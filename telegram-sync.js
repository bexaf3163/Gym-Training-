/* ==========================================================================
   GymNote — Telegram Mini App CloudStorage Sync Engine
   Each Telegram user gets their own private, automatic cloud storage (up to 4MB).
   Handles UTF-8 safe 3400-byte chunking, offline queue, haptics, and theme sync.
   ========================================================================== */

(() => {
  'use strict';

  const META_KEY = 'gn_v1_meta';
  const CHUNK_PREFIX = 'gn_v1_c_';
  const MAX_CHUNK_CHARS = 1800; // Safe for Cyrillic UTF-8 (<= 3600 bytes < 4096 Telegram limit)

  let status = {
    state: 'idle', // 'idle' | 'syncing' | 'ok' | 'error'
    message: 'Локально (вне Telegram)',
    lastSyncAt: null,
    inTelegram: false,
    user: null
  };

  let listeners = [];
  let pushTimer = null;
  let pendingGetState = null;

  function getTg() {
    return (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp)
      ? window.Telegram.WebApp
      : null;
  }

  function isInTelegram() {
    const tg = getTg();
    return Boolean(tg && tg.initData && tg.CloudStorage);
  }

  function getTelegramUser() {
    const tg = getTg();
    return tg?.initDataUnsafe?.user || null;
  }

  function detectPreferredProfile() {
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

  // Promise wrappers around Telegram.WebApp.CloudStorage callbacks
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

  function getLatestTimestamp(st) {
    if (!st) return 0;
    const t0 = Date.parse(st.updatedAt || '1970-01-01T00:00:00Z') || 0;
    const tM = Date.parse(st.profiles?.mark?.updatedAt || '1970-01-01T00:00:00Z') || 0;
    const tL = Date.parse(st.profiles?.lera?.updatedAt || '1970-01-01T00:00:00Z') || 0;
    return Math.max(t0, tM, tL);
  }

  function mergeStates(local, remote) {
    if (!remote || !remote.profiles) return local;
    if (!local || !local.profiles) return remote;

    const merged = JSON.parse(JSON.stringify(local));

    const cats = new Set([...(local.workoutCategories || []), ...(remote.workoutCategories || [])]);
    merged.workoutCategories = [...cats];

    const exMap = new Map();
    (remote.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
    (local.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
    merged.exercises = [...exMap.values()];

    ['mark', 'lera'].forEach((uid) => {
      const lProf = local.profiles[uid];
      const rProf = remote.profiles[uid];
      if (!rProf) return;
      if (!lProf) {
        merged.profiles[uid] = JSON.parse(JSON.stringify(rProf));
        return;
      }
      const lTime = Date.parse(lProf.updatedAt || '1970-01-01T00:00:00Z') || 0;
      const rTime = Date.parse(rProf.updatedAt || '1970-01-01T00:00:00Z') || 0;
      if (rTime > lTime) {
        merged.profiles[uid] = JSON.parse(JSON.stringify(rProf));
      } else {
        merged.profiles[uid] = JSON.parse(JSON.stringify(lProf));
      }
    });

    merged.activeUser = local.activeUser;
    merged.activeTab = local.activeTab;
    merged.workoutDayFilter = merged.workoutCategories.includes(local.workoutDayFilter)
      ? local.workoutDayFilter
      : merged.workoutCategories[0];
    merged.settings = { ...(remote.settings || {}), ...(local.settings || {}) };
    merged.updatedAt = new Date(Math.max(getLatestTimestamp(local), getLatestTimestamp(remote))).toISOString();

    return merged;
  }

  function extractPayload(appState) {
    return {
      schemaVersion: 5,
      updatedAt: appState.updatedAt || new Date().toISOString(),
      workoutCategories: appState.workoutCategories,
      exercises: appState.exercises,
      profiles: appState.profiles,
      settings: appState.settings
    };
  }

  async function pull(localState) {
    if (!isInTelegram()) {
      setStatus({ state: 'idle', message: 'Локально (вне Telegram)', inTelegram: false });
      return { merged: localState, exists: false };
    }
    setStatus({ state: 'syncing', message: 'Загрузка из Telegram...' });
    try {
      const rawMeta = await csGetItem(META_KEY);
      if (!rawMeta) {
        setStatus({ state: 'ok', message: 'Облако Telegram готово', lastSyncAt: new Date().toISOString() });
        return { merged: localState, exists: false };
      }
      const meta = JSON.parse(rawMeta);
      const count = Number(meta.chunks) || 0;
      if (count <= 0) {
        setStatus({ state: 'ok', message: 'Облако Telegram готово', lastSyncAt: new Date().toISOString() });
        return { merged: localState, exists: false };
      }
      const keys = Array.from({ length: count }, (_, i) => `${CHUNK_PREFIX}${i}`);
      const bag = await csGetItems(keys);
      let joined = '';
      for (let i = 0; i < count; i += 1) {
        if (typeof bag[keys[i]] !== 'string') {
          throw new Error('Повреждённый фрагмент облака');
        }
        joined += bag[keys[i]];
      }
      const remoteData = JSON.parse(joined);
      const merged = mergeStates(localState, remoteData);
      setStatus({ state: 'ok', message: 'Синхронизировано с Telegram', lastSyncAt: new Date().toISOString() });
      return { merged, exists: true };
    } catch (err) {
      setStatus({ state: 'error', message: `Ошибка загрузки: ${err.message}` });
      throw err;
    }
  }

  async function push(localState) {
    if (!isInTelegram()) {
      setStatus({ state: 'idle', message: 'Локально (вне Telegram)', inTelegram: false });
      return { pushed: false };
    }
    setStatus({ state: 'syncing', message: 'Сохранение в Telegram...' });
    try {
      let prevCount = 0;
      try {
        const prevMetaRaw = await csGetItem(META_KEY);
        if (prevMetaRaw) prevCount = Number(JSON.parse(prevMetaRaw).chunks) || 0;
      } catch {}

      const payloadStr = JSON.stringify(extractPayload(localState));
      const chunks = splitIntoChunks(payloadStr);

      await Promise.all(
        chunks.map((chunk, idx) => csSetItem(`${CHUNK_PREFIX}${idx}`, chunk))
      );

      const meta = {
        v: 1,
        chunks: chunks.length,
        updatedAt: new Date().toISOString(),
        bytes: payloadStr.length
      };
      await csSetItem(META_KEY, JSON.stringify(meta));

      // Remove extra stale chunks if payload shrank
      if (prevCount > chunks.length) {
        const stale = [];
        for (let i = chunks.length; i < prevCount; i += 1) {
          stale.push(`${CHUNK_PREFIX}${i}`);
        }
        await csRemoveItems(stale);
      }

      setStatus({ state: 'ok', message: 'Сохранено в Telegram', lastSyncAt: meta.updatedAt });
      return { pushed: true, bytes: payloadStr.length };
    } catch (err) {
      setStatus({ state: 'error', message: `Нет связи (${err.message})` });
      throw err;
    }
  }

  async function syncNow(localState) {
    if (!isInTelegram()) {
      return { merged: localState, pushed: false };
    }
    const pulled = await pull(localState);
    const res = await push(pulled.merged);
    return { merged: pulled.merged, pushed: res.pushed };
  }

  function schedulePush(getStateFn) {
    if (!isInTelegram()) return;
    pendingGetState = getStateFn;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const fn = pendingGetState;
      pendingGetState = null;
      if (!fn) return;
      try {
        await push(fn());
      } catch {
        // Error already reflected in status dot; will retry on online/next change
      }
    }, 1200);
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

      // Fallback for Telegram iOS floating "Закрыть / ..." pills when contentSafeAreaInset isn't reported
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
      message: active ? 'Облако Telegram подключено' : 'Локально (вне Telegram)',
      inTelegram: active,
      user
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (pendingGetState && isInTelegram()) {
          const fn = pendingGetState;
          pendingGetState = null;
          push(fn()).catch(() => {});
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && pendingGetState && isInTelegram()) {
          clearTimeout(pushTimer);
          const fn = pendingGetState;
          pendingGetState = null;
          push(fn()).catch(() => {});
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
    onStatusChange: (cb) => {
      listeners.push(cb);
      cb(status);
    },
    pull,
    push,
    syncNow,
    schedulePush,
    haptic,
    syncTelegramChrome,
    shareText
  };
})();
