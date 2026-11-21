/* ==========================================================================
   GymNote — GitHub Cloud Sync Engine (Марк и Лера)
   Stores shared profiles & workouts in data/gymnote-data.json via GitHub API
   Token is stored ONLY locally in Safari localStorage, never committed to Git.
   ========================================================================== */

(() => {
  'use strict';

  const SYNC_CONFIG_KEY = 'gymnote_gh_config_v1';
  const DEFAULT_CONFIG = {
    repo: 'bexaf3163/Gym-Training-',
    branch: 'main',
    path: 'data/gymnote-data.json',
    token: '',
    autoSync: true
  };

  let status = {
    state: 'idle', // 'idle' | 'syncing' | 'ok' | 'error'
    message: 'Локально',
    lastSyncAt: null
  };

  let lastKnownSha = null;
  let pushTimer = null;
  let listeners = [];

  function setStatus(next) {
    status = { ...status, ...next };
    listeners.forEach((fn) => {
      try { fn(status); } catch {}
    });
  }

  function getConfig() {
    try {
      const raw = localStorage.getItem(SYNC_CONFIG_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfig(partial) {
    const next = { ...getConfig(), ...partial };
    try {
      localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(next));
    } catch {}
    return next;
  }

  function clearToken() {
    saveConfig({ token: '' });
    lastKnownSha = null;
    setStatus({ state: 'idle', message: 'Отключено' });
  }

  function encodeBase64Utf8(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
  }

  function decodeBase64Utf8(b64) {
    const clean = String(b64 || '').replace(/\s+/g, '');
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function buildHeaders(token, write = false) {
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (write) headers['Content-Type'] = 'application/json';
    return headers;
  }

  function apiUrl(cfg) {
    const repo = (cfg.repo || DEFAULT_CONFIG.repo).trim();
    const path = (cfg.path || DEFAULT_CONFIG.path).replace(/^\/+/, '');
    return `https://api.github.com/repos/${repo}/contents/${path}`;
  }

  // Smart two-phone merge: Марк и Лера never overwrite each other's profiles
  function mergeStates(local, remote) {
    if (!remote || !remote.profiles) return local;
    if (!local || !local.profiles) return remote;

    const merged = JSON.parse(JSON.stringify(local));

    // Union workout categories preserving order
    const cats = new Set([...(local.workoutCategories || []), ...(remote.workoutCategories || [])]);
    merged.workoutCategories = [...cats];

    // Union shared exercises catalog by id & key
    const exMap = new Map();
    (remote.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
    (local.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
    merged.exercises = [...exMap.values()];

    // Per-profile timestamp merge (mark & lera independently!)
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

    // Keep local device UI preferences (activeUser, activeTab, theme)
    merged.activeUser = local.activeUser;
    merged.activeTab = local.activeTab;
    merged.workoutDayFilter = merged.workoutCategories.includes(local.workoutDayFilter)
      ? local.workoutDayFilter
      : merged.workoutCategories[0];
    merged.settings = { ...(remote.settings || {}), ...(local.settings || {}) };

    return merged;
  }

  function extractSyncPayload(appState) {
    return {
      schemaVersion: 4,
      syncedAt: new Date().toISOString(),
      workoutCategories: appState.workoutCategories,
      exercises: appState.exercises,
      profiles: appState.profiles
    };
  }

  async function fetchRemote(cfg) {
    const url = `${apiUrl(cfg)}?ref=${encodeURIComponent(cfg.branch || 'main')}&_t=${Date.now()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(cfg.token, false),
      cache: 'no-store'
    });
    if (res.status === 404) {
      return { exists: false, sha: null, data: null };
    }
    if (!res.ok) {
      throw new Error(`GitHub ${res.status}`);
    }
    const json = await res.json();
    const text = decodeBase64Utf8(json.content);
    const data = JSON.parse(text);
    lastKnownSha = json.sha;
    return { exists: true, sha: json.sha, data };
  }

  async function pull(localState) {
    const cfg = getConfig();
    setStatus({ state: 'syncing', message: 'Загрузка с GitHub...' });
    try {
      const remote = await fetchRemote(cfg);
      if (!remote.exists || !remote.data) {
        setStatus({ state: 'ok', message: 'Файл ещё не создан', lastSyncAt: new Date().toISOString() });
        return { merged: localState, changed: false, exists: false };
      }
      const merged = mergeStates(localState, remote.data);
      setStatus({ state: 'ok', message: 'Синхронизировано', lastSyncAt: new Date().toISOString() });
      return { merged, changed: true, exists: true };
    } catch (err) {
      setStatus({ state: 'error', message: `Ошибка загрузки (${err.message})` });
      throw err;
    }
  }

  async function push(localState, commitMessage = 'Sync GymNote profiles (Mark & Lera)', retryOnConflict = true) {
    const cfg = getConfig();
    if (!cfg.token) {
      setStatus({ state: 'idle', message: 'Нужен токен GitHub' });
      return { pushed: false, merged: localState };
    }

    setStatus({ state: 'syncing', message: 'Сохранение на GitHub...' });
    try {
      let currentState = localState;
      if (!lastKnownSha) {
        const remote = await fetchRemote(cfg);
        if (remote.exists && remote.data) {
          currentState = mergeStates(localState, remote.data);
        }
      }

      const payload = extractSyncPayload(currentState);
      const body = {
        message: commitMessage,
        content: encodeBase64Utf8(JSON.stringify(payload, null, 2)),
        branch: cfg.branch || 'main'
      };
      if (lastKnownSha) body.sha = lastKnownSha;

      const res = await fetch(apiUrl(cfg), {
        method: 'PUT',
        headers: buildHeaders(cfg.token, true),
        body: JSON.stringify(body)
      });

      if (res.status === 409 && retryOnConflict) {
        lastKnownSha = null;
        const remote = await fetchRemote(cfg);
        const merged = remote.exists && remote.data ? mergeStates(localState, remote.data) : localState;
        return await push(merged, commitMessage, false);
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`GitHub ${res.status}${errText.includes('Bad credentials') ? ': неверный токен' : ''}`);
      }

      const json = await res.json();
      if (json?.content?.sha) lastKnownSha = json.content.sha;
      setStatus({ state: 'ok', message: 'Сохранено на GitHub', lastSyncAt: new Date().toISOString() });
      return { pushed: true, merged: currentState };
    } catch (err) {
      setStatus({ state: 'error', message: err.message || 'Ошибка синхронизации' });
      throw err;
    }
  }

  async function syncNow(localState) {
    const cfg = getConfig();
    if (!cfg.token) {
      return await pull(localState);
    }
    const pulled = await pull(localState);
    const pushed = await push(pulled.merged, 'Sync GymNote (Mark & Lera)');
    return { merged: pushed.merged, pushed: pushed.pushed };
  }

  function schedulePush(getStateFn, onMergedFn) {
    const cfg = getConfig();
    if (!cfg.token || !cfg.autoSync) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      try {
        const result = await push(getStateFn(), 'Auto-sync GymNote (Mark & Lera)');
        if (result.pushed && onMergedFn) onMergedFn(result.merged);
      } catch {
        // Error state already reflected in status badge
      }
    }, 1800);
  }

  window.GYM_SYNC = {
    getConfig,
    saveConfig,
    clearToken,
    getStatus: () => status,
    onStatusChange: (cb) => {
      listeners.push(cb);
      cb(status);
    },
    pull,
    push,
    syncNow,
    schedulePush
  };
})();
