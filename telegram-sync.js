/* ==========================================================================
   GymNote — Shared Coach Cloud + Telegram Mini App CloudStorage Sync Engine
   1) Shared Coach Cloud (Cloudflare Worker + KV, verified via Telegram initData):
      - Coach (Марк): edits both Марк & Лера profiles; changes sync live to both.
      - Athlete (Лера): locked to Лера profile; live-receives Coach's edits & sends progress back.
   2) Automatic fallback to personal Telegram.WebApp.CloudStorage if Shared Cloud isn't bound yet.
   ========================================================================== */

(() => {
  'use strict';

  const SHARED_API_BASE = 'https://gymnote-bot.markundrest.workers.dev';
  const META_KEY = 'gn_v1_meta';
  const CHUNK_PREFIX = 'gn_v1_c_';
  const MAX_CHUNK_CHARS = 1800; // Safe for Cyrillic UTF-8 (<= 3600 bytes < 4096 Telegram limit)

  let status = {
    state: 'idle', // 'idle' | 'syncing' | 'ok' | 'error'
    mode: 'local', // 'shared' | 'personal' | 'local'
    role: null,    // 'coach' | 'athlete' | null
    setupHint: '',
    message: 'Локально (вне Telegram)',
    lastSyncAt: null,
    inTelegram: false,
    user: null
  };

  let listeners = [];
  let pushTimer = null;
  let pendingGetState = null;
  let pendingScope = null;
  let sharedAvailable = null; // null = unknown, true = shared KV active, false = fallback to personal
  let liveTimer = null;
  let isSyncBusy = false;

  function getTg() {
    return (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp)
      ? window.Telegram.WebApp
      : null;
  }

  function isInTelegram() {
    const tg = getTg();
    return Boolean(tg && tg.initData);
  }

  function hasPersonalCloud() {
    const tg = getTg();
    return Boolean(tg && tg.initData && tg.CloudStorage);
  }

  function getTelegramUser() {
    const tg = getTg();
    return tg?.initDataUnsafe?.user || null;
  }

  function detectPreferredProfile() {
    if (status.role === 'athlete') return 'lera';
    if (status.role === 'coach') return 'mark';
    const u = getTelegramUser();
    if (!u) return null;
    const raw = `${u.first_name || ''} ${u.last_name || ''} ${u.username || ''}`.toLowerCase();
    if (/лер|валер|lera|valer/.test(raw)) return 'lera';
    if (/марк|mark/.test(raw)) return 'mark';
    return null;
  }

  function setStatus(next) {
    status = { ...status, ...next };
    listeners.forEach((fn) => {
      try { fn(status); } catch {}
    });
  }

  function ts(val) {
    return Date.parse(val || '1970-01-01T00:00:00Z') || 0;
  }

  function getLatestTimestamp(st) {
    if (!st) return 0;
    const t0 = ts(st.updatedAt);
    const tM = ts(st.profiles?.mark?.updatedAt);
    const tL = ts(st.profiles?.lera?.updatedAt);
    return Math.max(t0, tM, tL);
  }

  function extractPayload(appState) {
    return {
      schemaVersion: 7,
      updatedAt: appState.updatedAt || new Date().toISOString(),
      activeUser: appState.activeUser,
      workoutCategories: appState.workoutCategories,
      exercises: appState.exercises,
      profiles: appState.profiles,
      settings: appState.settings
    };
  }

  function mergeStates(local, remote, role = null) {
    if (!remote || !remote.profiles) return local;
    if (!local || !local.profiles) return remote;

    const merged = JSON.parse(JSON.stringify(local));
    const localLatest = getLatestTimestamp(local);
    const remoteLatest = getLatestTimestamp(remote);
    const remoteNewer = remoteLatest > localLatest;

    if (role === 'athlete') {
      // Подопечная (Лера): берём общую базу упражнений от тренера + более свежий профиль Леры
      const exMap = new Map();
      (local.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
      (remote.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
      merged.exercises = [...exMap.values()];

      const lTime = ts(local.profiles?.lera?.updatedAt);
      const rTime = ts(remote.profiles?.lera?.updatedAt);
      if (remote.profiles?.lera && rTime > lTime) {
        merged.profiles.lera = JSON.parse(JSON.stringify(remote.profiles.lera));
      }
      if (Array.isArray(merged.profiles?.lera?.days) && merged.profiles.lera.days.length) {
        merged.workoutCategories = [...merged.profiles.lera.days];
      } else if (Array.isArray(remote.workoutCategories) && remote.workoutCategories.length) {
        merged.workoutCategories = [...remote.workoutCategories];
      }
      merged.activeUser = 'lera';
      merged.activeTab = local.activeTab;
      merged.workoutDayFilter = merged.workoutCategories.includes(local.workoutDayFilter)
        ? local.workoutDayFilter
        : merged.workoutCategories[0];
      merged.updatedAt = new Date(Math.max(localLatest, remoteLatest)).toISOString();
      return merged;
    }

    if (remoteNewer && Array.isArray(remote.workoutCategories) && remote.workoutCategories.length) {
      merged.workoutCategories = [...remote.workoutCategories];
    } else if (Array.isArray(local.workoutCategories) && local.workoutCategories.length) {
      merged.workoutCategories = [...local.workoutCategories];
    } else {
      merged.workoutCategories = ['День 1', 'День 2', 'День 3'];
    }

    const exMap = new Map();
    if (remoteNewer) {
      (local.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
      (remote.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
    } else {
      (remote.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
      (local.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
    }
    merged.exercises = [...exMap.values()];

    ['mark', 'lera'].forEach((uid) => {
      const lProf = local.profiles[uid];
      const rProf = remote.profiles[uid];
      if (!rProf) return;
      if (!lProf) {
        merged.profiles[uid] = JSON.parse(JSON.stringify(rProf));
        return;
      }
      const lTime = ts(lProf.updatedAt);
      const rTime = ts(rProf.updatedAt);
      if (rTime > lTime) {
        merged.profiles[uid] = JSON.parse(JSON.stringify(rProf));
      } else {
        merged.profiles[uid] = JSON.parse(JSON.stringify(lProf));
      }
    });

    const activeIds = new Set([
      ...Object.keys(merged.profiles.mark?.items || {}),
      ...Object.keys(merged.profiles.lera?.items || {})
    ]);
    if (remoteNewer) {
      const remoteIds = new Set((remote.exercises || []).map((e) => e.id));
      merged.exercises = merged.exercises.filter((e) => remoteIds.has(e.id) || activeIds.has(e.id));
    }

    merged.activeUser = role === 'coach'
      ? local.activeUser
      : ((remoteNewer && remote.activeUser && merged.profiles[remote.activeUser]) ? remote.activeUser : local.activeUser);
    merged.activeTab = local.activeTab;
    merged.workoutDayFilter = merged.workoutCategories.includes(local.workoutDayFilter)
      ? local.workoutDayFilter
      : merged.workoutCategories[0];
    merged.settings = remoteNewer
      ? { ...(local.settings || {}), ...(remote.settings || {}) }
      : { ...(remote.settings || {}), ...(local.settings || {}) };
    merged.updatedAt = new Date(Math.max(localLatest, remoteLatest)).toISOString();

    return merged;
  }

  /* ---- Shared Coach Cloud API (Cloudflare Worker + KV) ---- */
  async function sharedFetch(path, options = {}) {
    const tg = getTg();
    if (!tg?.initData) throw new Error('NO_INIT_DATA');
    const res = await fetch(`${SHARED_API_BASE}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg.initData
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch {}
    return { status: res.status, ok: res.ok, data };
  }

  async function pullShared(localState, silent = false) {
    if (!silent) setStatus({ state: 'syncing', message: 'Синхронизация с общим облаком...' });
    const res = await sharedFetch('/api/state', { method: 'GET' });

    if (res.status === 503 && res.data?.error === 'KV_NOT_BOUND') {
      sharedAvailable = false;
      setStatus({
        mode: 'personal',
        role: res.data?.role || null,
        setupHint: 'Привяжи GYM_KV в Cloudflare Worker для общего тренерского облака.'
      });
      return { fallback: true };
    }
    if (res.status === 403 && res.data?.error === 'ACCESS_DENIED') {
      sharedAvailable = false;
      const uid = res.data?.userId ? ` (твой ID: ${res.data.userId})` : '';
      setStatus({
        mode: 'personal',
        role: 'none',
        setupHint: `Добавь свой Telegram ID${uid} в COACH_ID или LERA_ID в Cloudflare Worker.`
      });
      return { fallback: true };
    }
    if (!res.ok || !res.data?.ok) {
      throw new Error(res.data?.error || `HTTP ${res.status}`);
    }

    sharedAvailable = true;
    const role = res.data.role;
    const roleMsg = role === 'coach' ? 'Тренерский доступ • Общее облако' : 'Синхронизировано с тренером';

    // Если общее облако ещё пустое — сразу загружаем туда текущие данные (только тренер или первый запуск)
    if (!res.data.exists || !res.data.state) {
      const seeded = await pushShared(localState, role === 'athlete' ? 'lera' : 'all', true);
      const outState = seeded.state ? mergeStates(localState, seeded.state, role) : localState;
      setStatus({
        state: 'ok',
        mode: 'shared',
        role,
        setupHint: '',
        message: roleMsg,
        lastSyncAt: new Date().toISOString()
      });
      return { merged: outState, exists: true, role, mode: 'shared', changed: false };
    }

    const remoteState = res.data.state;
    const prevLeraTs = ts(localState.profiles?.lera?.updatedAt);
    const prevMarkTs = ts(localState.profiles?.mark?.updatedAt);
    const remLeraTs = ts(remoteState.profiles?.lera?.updatedAt);
    const remMarkTs = ts(remoteState.profiles?.mark?.updatedAt);

    const changed = role === 'athlete'
      ? remLeraTs > prevLeraTs
      : (remLeraTs > prevLeraTs || remMarkTs > prevMarkTs);

    const coachUpdatedLera = role === 'athlete' && remLeraTs > prevLeraTs && remoteState.profiles?.lera?.lastEditedBy === 'coach';
    const leraUpdatedSelf = role === 'coach' && remLeraTs > prevLeraTs && remoteState.profiles?.lera?.lastEditedBy === 'lera';

    const merged = mergeStates(localState, remoteState, role);
    setStatus({
      state: 'ok',
      mode: 'shared',
      role,
      setupHint: '',
      message: roleMsg,
      lastSyncAt: new Date().toISOString()
    });
    return { merged, exists: true, role, mode: 'shared', changed, coachUpdatedLera, leraUpdatedSelf };
  }

  async function pushShared(localState, scope = null, silent = false) {
    if (!silent) setStatus({ state: 'syncing', message: 'Сохранение в общее облако...' });
    const effectiveScope = status.role === 'athlete'
      ? 'lera'
      : (scope || localState.activeUser || 'all');

    const res = await sharedFetch('/api/sync', {
      method: 'POST',
      body: {
        scope: effectiveScope,
        state: extractPayload(localState)
      }
    });

    if (res.status === 503 || res.status === 403) {
      sharedAvailable = false;
      return { fallback: true };
    }
    if (!res.ok || !res.data?.ok) {
      throw new Error(res.data?.error || `HTTP ${res.status}`);
    }

    sharedAvailable = true;
    const role = res.data.role;
    const roleMsg = role === 'coach' ? 'Тренерский доступ • Сохранено' : 'Сохранено (видно тренеру)';
    setStatus({
      state: 'ok',
      mode: 'shared',
      role,
      setupHint: '',
      message: roleMsg,
      lastSyncAt: res.data.updatedAt || new Date().toISOString()
    });
    return { pushed: true, role, mode: 'shared', state: res.data.state };
  }

  /* ---- Fallback: Personal Telegram.WebApp.CloudStorage ---- */
  function csGetItem(key) {
    return new Promise((resolve, reject) => {
      const tg = getTg();
      if (!tg?.CloudStorage) return reject(new Error('CloudStorage недоступен'));
      tg.CloudStorage.getItem(key, (err, value) => {
        if (err) reject(new Error(String(err)));
        else resolve(value || '');
      });
    });
  }

  function csGetItems(keys) {
    return new Promise((resolve, reject) => {
      const tg = getTg();
      if (!tg?.CloudStorage) return reject(new Error('CloudStorage недоступен'));
      if (!keys.length) return resolve({});
      tg.CloudStorage.getItems(keys, (err, values) => {
        if (err) reject(new Error(String(err)));
        else resolve(values || {});
      });
    });
  }

  function csSetItem(key, value) {
    return new Promise((resolve, reject) => {
      const tg = getTg();
      if (!tg?.CloudStorage) return reject(new Error('CloudStorage недоступен'));
      tg.CloudStorage.setItem(key, value, (err, stored) => {
        if (err) reject(new Error(String(err)));
        else resolve(Boolean(stored));
      });
    });
  }

  function csRemoveItems(keys) {
    return new Promise((resolve) => {
      const tg = getTg();
      if (!tg?.CloudStorage || !keys.length) return resolve();
      tg.CloudStorage.removeItems(keys, () => resolve());
    });
  }

  function splitIntoChunks(str) {
    const chunks = [];
    for (let i = 0; i < str.length; i += MAX_CHUNK_CHARS) {
      chunks.push(str.slice(i, i + MAX_CHUNK_CHARS));
    }
    return chunks;
  }

  async function pullPersonal(localState) {
    if (!hasPersonalCloud()) {
      setStatus({ state: 'idle', mode: 'local', message: 'Локально (вне Telegram)', inTelegram: false });
      return { merged: localState, exists: false, mode: 'local' };
    }
    setStatus({ state: 'syncing', message: 'Загрузка из Telegram...' });
    const rawMeta = await csGetItem(META_KEY);
    if (!rawMeta) {
      setStatus({ state: 'ok', mode: 'personal', message: 'Личное облако Telegram', lastSyncAt: new Date().toISOString() });
      return { merged: localState, exists: false, mode: 'personal' };
    }
    const meta = JSON.parse(rawMeta);
    const count = Number(meta.chunks) || 0;
    if (count <= 0) {
      setStatus({ state: 'ok', mode: 'personal', message: 'Личное облако Telegram', lastSyncAt: new Date().toISOString() });
      return { merged: localState, exists: false, mode: 'personal' };
    }
    const keys = Array.from({ length: count }, (_, i) => `${CHUNK_PREFIX}${i}`);
    const bag = await csGetItems(keys);
    let joined = '';
    for (let i = 0; i < count; i += 1) {
      if (typeof bag[keys[i]] !== 'string') throw new Error('Повреждённый фрагмент облака');
      joined += bag[keys[i]];
    }
    const remoteData = JSON.parse(joined);
    const merged = mergeStates(localState, remoteData, null);
    setStatus({ state: 'ok', mode: 'personal', message: 'Личное облако Telegram', lastSyncAt: new Date().toISOString() });
    return { merged, exists: true, mode: 'personal' };
  }

  async function pushPersonal(localState) {
    if (!hasPersonalCloud()) {
      setStatus({ state: 'idle', mode: 'local', message: 'Локально (вне Telegram)', inTelegram: false });
      return { pushed: false, mode: 'local' };
    }
    setStatus({ state: 'syncing', message: 'Сохранение в Telegram...' });
    let prevCount = 0;
    try {
      const prevMetaRaw = await csGetItem(META_KEY);
      if (prevMetaRaw) prevCount = Number(JSON.parse(prevMetaRaw).chunks) || 0;
    } catch {}

    const payloadStr = JSON.stringify(extractPayload(localState));
    const chunks = splitIntoChunks(payloadStr);
    await Promise.all(chunks.map((chunk, idx) => csSetItem(`${CHUNK_PREFIX}${idx}`, chunk)));

    const meta = { v: 1, chunks: chunks.length, updatedAt: new Date().toISOString(), bytes: payloadStr.length };
    await csSetItem(META_KEY, JSON.stringify(meta));

    if (prevCount > chunks.length) {
      const stale = [];
      for (let i = chunks.length; i < prevCount; i += 1) stale.push(`${CHUNK_PREFIX}${i}`);
      await csRemoveItems(stale);
    }

    setStatus({ state: 'ok', mode: 'personal', message: 'Сохранено в Telegram', lastSyncAt: meta.updatedAt });
    return { pushed: true, bytes: payloadStr.length, mode: 'personal' };
  }

  /* ---- Unified Public Pull / Push / Sync ---- */
  async function pull(localState, options = {}) {
    const { silent = false } = options;
    if (!isInTelegram()) {
      setStatus({ state: 'idle', mode: 'local', message: 'Локально (вне Telegram)', inTelegram: false });
      return { merged: localState, exists: false, mode: 'local' };
    }
    try {
      if (sharedAvailable !== false) {
        try {
          const res = await pullShared(localState, silent);
          if (!res.fallback) return res;
        } catch (err) {
          if (sharedAvailable === true) {
            setStatus({ state: 'error', message: `Нет связи с облаком (${err.message})` });
            throw err;
          }
          // Network/API unavailable on first try — fall through to personal CloudStorage
        }
      }
      return await pullPersonal(localState);
    } catch (err) {
      setStatus({ state: 'error', message: `Ошибка загрузки: ${err.message}` });
      throw err;
    }
  }

  async function push(localState, scope = null) {
    if (!isInTelegram()) {
      setStatus({ state: 'idle', mode: 'local', message: 'Локально (вне Telegram)', inTelegram: false });
      return { pushed: false, mode: 'local' };
    }
    try {
      if (sharedAvailable !== false) {
        try {
          const res = await pushShared(localState, scope, false);
          if (!res.fallback) return res;
        } catch (err) {
          if (sharedAvailable === true) {
            setStatus({ state: 'error', message: `Нет связи (${err.message})` });
            throw err;
          }
        }
      }
      return await pushPersonal(localState);
    } catch (err) {
      setStatus({ state: 'error', message: `Нет связи (${err.message})` });
      throw err;
    }
  }

  async function syncNow(localState, scope = null) {
    if (!isInTelegram()) {
      return { merged: localState, pushed: false, mode: 'local' };
    }
    sharedAvailable = null; // Re-check shared cloud availability on manual sync
    const pulled = await pull(localState);
    const res = await push(pulled.merged, scope || (status.role === 'athlete' ? 'lera' : 'all'));
    const finalState = res.state ? mergeStates(pulled.merged, res.state, res.role || status.role) : pulled.merged;
    return { merged: finalState, pushed: res.pushed, role: res.role || pulled.role, mode: res.mode || pulled.mode };
  }

  function schedulePush(getStateFn, scope = null) {
    if (!isInTelegram()) return;
    pendingGetState = getStateFn;
    if (!pendingScope) {
      pendingScope = scope;
    } else if (scope && pendingScope !== scope) {
      pendingScope = 'all';
    }
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const fn = pendingGetState;
      const sc = pendingScope;
      pendingGetState = null;
      pendingScope = null;
      if (!fn) return;
      isSyncBusy = true;
      try {
        await push(fn(), sc);
      } catch {
        // Error reflected in dot; will retry on online/next change
      } finally {
        isSyncBusy = false;
      }
    }, 900);
  }

  function startLiveRefresh(getStateFn, onRemoteUpdate) {
    if (!isInTelegram() || typeof window === 'undefined') return;
    clearInterval(liveTimer);

    const checkOnce = async () => {
      if (sharedAvailable !== true) return;
      if (document.visibilityState !== 'visible') return;
      if (pendingGetState || isSyncBusy) return;
      isSyncBusy = true;
      try {
        const res = await pullShared(getStateFn(), true);
        if (!res.fallback && res.changed && res.merged && onRemoteUpdate) {
          onRemoteUpdate(res);
        }
      } catch {
        // Silent retry next tick
      } finally {
        isSyncBusy = false;
      }
    };

    liveTimer = setInterval(checkOnce, 12000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkOnce();
      }
    });
  }

  function haptic(type = 'light') {
    const tg = getTg();
    if (!tg?.HapticFeedback) return;
    try {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch {}
  }

  function syncTelegramChrome(theme) {
    const tg = getTg();
    if (!tg) return;
    try {
      const bg = theme === 'dark' ? '#000000' : '#F2F2F7';
      if (tg.setHeaderColor) tg.setHeaderColor(bg);
      if (tg.setBackgroundColor) tg.setBackgroundColor(bg);
    } catch {}
  }

  function shareText(text) {
    const tg = getTg();
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://bexaf3163.github.io/Gym-Training-/')}&text=${encodeURIComponent(text)}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
      return true;
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
      return true;
    }
    return false;
  }

  function applySafeAreas() {
    const tg = getTg();
    if (!tg || typeof document === 'undefined') return;
    try {
      const root = document.documentElement;
      const saTop = Number(tg.safeAreaInset?.top || 0);
      const csaTop = Number(tg.contentSafeAreaInset?.top || 0);
      const saBottom = Number(tg.safeAreaInset?.bottom || 0);
      const csaBottom = Number(tg.contentSafeAreaInset?.bottom || 0);

      let topPx = saTop + csaTop;
      const bottomPx = saBottom + csaBottom;

      if (topPx === 0 && tg.platform === 'ios') {
        const cs = window.getComputedStyle(root);
        const cssTop =
          (parseFloat(cs.getPropertyValue('--tg-safe-area-inset-top')) || 0) +
          (parseFloat(cs.getPropertyValue('--tg-content-safe-area-inset-top')) || 0);
        if (cssTop === 0) {
          topPx = 52;
        }
      }

      root.style.setProperty('--tg-js-safe-top', `${Math.max(0, Math.round(topPx))}px`);
      root.style.setProperty('--tg-js-safe-bottom', `${Math.max(0, Math.round(bottomPx))}px`);
    } catch {}
  }

  function init() {
    const tg = getTg();
    const active = isInTelegram();
    const user = getTelegramUser();
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        applySafeAreas();
        if (typeof tg.onEvent === 'function') {
          tg.onEvent('safeAreaChanged', applySafeAreas);
          tg.onEvent('contentSafeAreaChanged', applySafeAreas);
          tg.onEvent('fullscreenChanged', applySafeAreas);
          tg.onEvent('viewportChanged', applySafeAreas);
        }
      } catch {}
    }
    setStatus({
      state: active ? 'ok' : 'idle',
      mode: active ? 'personal' : 'local',
      message: active ? 'Подключение к облаку...' : 'Локально (вне Telegram)',
      inTelegram: active,
      user
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (pendingGetState && isInTelegram()) {
          const fn = pendingGetState;
          const sc = pendingScope;
          pendingGetState = null;
          pendingScope = null;
          push(fn(), sc).catch(() => {});
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && pendingGetState && isInTelegram()) {
          clearTimeout(pushTimer);
          const fn = pendingGetState;
          const sc = pendingScope;
          pendingGetState = null;
          pendingScope = null;
          push(fn(), sc).catch(() => {});
        }
      });
    }
  }

  window.TG_SYNC = {
    init,
    isInTelegram,
    getTelegramUser,
    detectPreferredProfile,
    getStatus: () => status,
    getRole: () => status.role,
    isCoach: () => status.role === 'coach',
    isAthlete: () => status.role === 'athlete',
    isSharedMode: () => status.mode === 'shared',
    onStatusChange: (cb) => {
      listeners.push(cb);
      cb(status);
    },
    pull,
    push,
    syncNow,
    schedulePush,
    startLiveRefresh,
    haptic,
    syncTelegramChrome,
    shareText
  };
})();
