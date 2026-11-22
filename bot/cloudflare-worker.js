/**
 * GymNote — Telegram Bot + Shared Coach Cloud Worker (Cloudflare Workers + KV, Free Tier)
 *
 * Возможности:
 * 1. Красивая карточка с баннером GymNote и кнопкой «🏋️ Открыть GymNote» на /start
 * 2. Команда /id — показывает Telegram ID (для настройки COACH_ID и LERA_ID)
 * 3. Защищённое общее облако (Cloudflare KV) с проверкой подписи Telegram initData:
 *    - Тренер (COACH_ID): редактирует и свой профиль (Марк), и профиль Леры — всё синхронизируется у обоих
 *    - Подопечная (LERA_ID): видит и редактирует только свой профиль (Лера), мгновенно получает правки тренера
 *
 * Переменные в Cloudflare Worker -> Settings:
 *   Secret:    BOT_TOKEN  (токен от @BotFather)
 *   Variable:  COACH_ID   (Telegram ID Марка — узнать командой /id в боте)
 *   Variable:  LERA_ID    (Telegram ID Леры — узнать командой /id в боте)
 *   Binding:   GYM_KV     (KV Namespace -> Storage & Databases -> KV -> Create -> gymnote-kv)
 */

const APP_URL = 'https://bexaf3163.github.io/Gym-Training-/';
const BANNER_URL = 'https://bexaf3163.github.io/Gym-Training-/bot/banner.jpg';
const BUTTON_TEXT = '🏋️ Открыть GymNote';
const ALLOWED_ORIGIN = 'https://bexaf3163.github.io';
const KV_STATE_KEY = 'shared_state_v1';

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data',
    'Vary': 'Origin'
  };
}

function jsonResponse(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request)
    }
  });
}

async function hmacSha256(keyBytes, messageStr) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(messageStr));
  return new Uint8Array(sig);
}

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  const pairs = [];
  for (const [k, v] of params.entries()) {
    if (k !== 'hash') pairs.push([k, v]);
  }
  pairs.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = await hmacSha256(new TextEncoder().encode('WebAppData'), botToken);
  const computed = toHex(await hmacSha256(secretKey, dataCheckString));
  if (!timingSafeEqual(computed, hash.toLowerCase())) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    if (!user || !user.id) return null;
    return user;
  } catch {
    return null;
  }
}

function parseIdList(val) {
  return String(val || '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveRole(userId, env) {
  const idStr = String(userId);
  const coachIds = parseIdList(env.COACH_ID);
  const leraIds = parseIdList(env.LERA_ID);
  if (coachIds.includes(idStr)) return 'coach';
  if (leraIds.includes(idStr)) return 'athlete';
  return 'none';
}

function ts(val) {
  return Date.parse(val || '1970-01-01T00:00:00Z') || 0;
}

function mergeSharedState(existing, incoming, role, scope) {
  if (!existing || !existing.profiles) {
    const base = JSON.parse(JSON.stringify(incoming));
    if (role === 'athlete' && base.profiles?.lera) {
      base.profiles.lera.lastEditedBy = 'lera';
    }
    return base;
  }

  const merged = JSON.parse(JSON.stringify(existing));
  const nowIso = new Date().toISOString();

  // Athlete (Лера): может обновлять ТОЛЬКО свой профиль (lera) и упражнения, на которые он ссылается
  if (role === 'athlete') {
    const inLera = incoming?.profiles?.lera;
    if (inLera) {
      const exTime = ts(existing.profiles?.lera?.updatedAt);
      const inTime = ts(inLera.updatedAt);
      if (inTime >= exTime) {
        merged.profiles.lera = JSON.parse(JSON.stringify(inLera));
        merged.profiles.lera.lastEditedBy = 'lera';
        merged.profiles.lera.updatedAt = inLera.updatedAt || nowIso;
      }
    }
    // Добавляем новые упражнения из базы Леры, не трогая упражнения Марка
    const exMap = new Map((merged.exercises || []).map((e) => [e.id, e]));
    const leraItemIds = new Set(Object.keys(merged.profiles?.lera?.items || {}));
    (incoming?.exercises || []).forEach((ex) => {
      if (leraItemIds.has(ex.id) && !exMap.has(ex.id)) {
        exMap.set(ex.id, ex);
      }
    });
    merged.exercises = [...exMap.values()];
    merged.updatedAt = nowIso;
    return merged;
  }

  // Coach (Марк): может обновлять и Марка, и Леру — с изоляцией по scope чтобы не перетирать параллельные правки
  const allowedProfiles = scope === 'mark'
    ? ['mark']
    : (scope === 'lera' ? ['lera'] : ['mark', 'lera']);

  allowedProfiles.forEach((uid) => {
    const inProf = incoming?.profiles?.[uid];
    if (!inProf) return;
    const exTime = ts(existing.profiles?.[uid]?.updatedAt);
    const inTime = ts(inProf.updatedAt);
    if (inTime >= exTime || scope === uid) {
      merged.profiles[uid] = JSON.parse(JSON.stringify(inProf));
      merged.profiles[uid].lastEditedBy = 'coach';
      merged.profiles[uid].updatedAt = inProf.updatedAt || nowIso;
    }
  });

  // Обновляем общую базу упражнений (сохраняя упражнения, используемые любым профилем)
  const exMap = new Map();
  (merged.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
  (incoming?.exercises || []).forEach((ex) => exMap.set(ex.id, ex));
  const usedIds = new Set([
    ...Object.keys(merged.profiles?.mark?.items || {}),
    ...Object.keys(merged.profiles?.lera?.items || {})
  ]);
  const incomingIds = new Set((incoming?.exercises || []).map((e) => e.id));
  merged.exercises = [...exMap.values()].filter((e) => incomingIds.has(e.id) || usedIds.has(e.id));

  if (Array.isArray(incoming?.workoutCategories) && incoming.workoutCategories.length) {
    merged.workoutCategories = [...incoming.workoutCategories];
  }
  if (incoming?.settings) {
    merged.settings = { ...(merged.settings || {}), ...incoming.settings };
  }
  merged.updatedAt = nowIso;
  return merged;
}

function filterStateForRole(state, role) {
  if (!state) return null;
  if (role === 'coach') return state;
  // Для Леры отдаём полную базу упражнений и её профиль (не раскрывая приватные данные Марка)
  const copy = JSON.parse(JSON.stringify(state));
  if (copy.profiles?.mark) {
    copy.profiles.mark = {
      name: 'Марк',
      activeSchemeId: 'mark-mass',
      body: { weightKg: null, heightCm: null, activity: '', completed: false },
      days: ['День 1', 'День 2', 'День 3'],
      items: {},
      updatedAt: '1970-01-01T00:00:00Z'
    };
  }
  copy.activeUser = 'lera';
  return copy;
}

async function deriveWebhookSecret(token) {
  const bytes = new TextEncoder().encode(`gymnote-webhook:${token}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(new Uint8Array(hash)).slice(0, 32);
}

async function tgApi(token, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight for Mini App API calls
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (!env.BOT_TOKEN) {
      return new Response(
        'Добавь секрет BOT_TOKEN в Cloudflare Worker -> Settings -> Variables and Secrets.',
        { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // 1) API: Загрузка общего состояния (проверка Telegram initData + роли Тренер/Подопечная)
    if (request.method === 'GET' && url.pathname === '/api/state') {
      const initData = request.headers.get('X-Telegram-Init-Data') || '';
      const tgUser = await verifyTelegramInitData(initData, env.BOT_TOKEN);
      if (!tgUser) {
        return jsonResponse(request, { ok: false, error: 'INVALID_AUTH' }, 401);
      }

      const role = resolveRole(tgUser.id, env);
      if (role === 'none') {
        return jsonResponse(request, {
          ok: false,
          error: 'ACCESS_DENIED',
          userId: tgUser.id,
          role: 'none'
        }, 403);
      }

      if (!env.GYM_KV) {
        return jsonResponse(request, { ok: false, error: 'KV_NOT_BOUND', role }, 503);
      }

      const raw = await env.GYM_KV.get(KV_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return jsonResponse(request, {
        ok: true,
        role,
        user: { id: tgUser.id, first_name: tgUser.first_name || '' },
        exists: Boolean(parsed),
        state: filterStateForRole(parsed, role)
      });
    }

    // 2) API: Сохранение и слияние состояния в общее облако
    if (request.method === 'POST' && url.pathname === '/api/sync') {
      const initData = request.headers.get('X-Telegram-Init-Data') || '';
      const tgUser = await verifyTelegramInitData(initData, env.BOT_TOKEN);
      if (!tgUser) {
        return jsonResponse(request, { ok: false, error: 'INVALID_AUTH' }, 401);
      }

      const role = resolveRole(tgUser.id, env);
      if (role === 'none') {
        return jsonResponse(request, { ok: false, error: 'ACCESS_DENIED', userId: tgUser.id, role: 'none' }, 403);
      }

      if (!env.GYM_KV) {
        return jsonResponse(request, { ok: false, error: 'KV_NOT_BOUND', role }, 503);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse(request, { ok: false, error: 'BAD_JSON' }, 400);
      }

      const scope = body?.scope || (role === 'athlete' ? 'lera' : 'all');
      const incoming = body?.state;
      if (!incoming || !incoming.profiles) {
        return jsonResponse(request, { ok: false, error: 'MISSING_STATE' }, 400);
      }

      const raw = await env.GYM_KV.get(KV_STATE_KEY);
      const existing = raw ? JSON.parse(raw) : null;
      const merged = mergeSharedState(existing, incoming, role, scope);
      await env.GYM_KV.put(KV_STATE_KEY, JSON.stringify(merged));

      return jsonResponse(request, {
        ok: true,
        role,
        updatedAt: merged.updatedAt,
        state: filterStateForRole(merged, role)
      });
    }

    // 3) Одноразовая настройка webhook + широкой кнопки меню: открыть /setup в браузере
    if (request.method === 'GET' && url.pathname === '/setup') {
      const secretToken = await deriveWebhookSecret(env.BOT_TOKEN);
      const webhookUrl = `${url.origin}/webhook`;

      const [whRes, menuRes] = await Promise.all([
        tgApi(env.BOT_TOKEN, 'setWebhook', {
          url: webhookUrl,
          secret_token: secretToken,
          allowed_updates: ['message'],
          drop_pending_updates: true
        }),
        tgApi(env.BOT_TOKEN, 'setChatMenuButton', {
          menu_button: {
            type: 'web_app',
            text: BUTTON_TEXT,
            web_app: { url: APP_URL }
          }
        })
      ]);

      const ok = Boolean(whRes.ok && menuRes.ok);
      const text = ok
        ? '✅ Готово! Бот GymNote подключён.\nТеперь открой @GymNote2_bot в Telegram и отправь /start (или /id чтобы узнать Telegram ID).'
        : `⚠️ Ошибка настройки:\nwebhook: ${JSON.stringify(whRes)}\nmenu: ${JSON.stringify(menuRes)}`;

      return new Response(text, {
        status: ok ? 200 : 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 4) Обработка сообщений от Telegram
    if (request.method === 'POST' && url.pathname === '/webhook') {
      const expectedSecret = await deriveWebhookSecret(env.BOT_TOKEN);
      const incomingSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (incomingSecret !== expectedSecret) {
        return new Response('Unauthorized', { status: 401 });
      }

      let update;
      try {
        update = await request.json();
      } catch {
        return new Response('Bad Request', { status: 400 });
      }

      const msg = update?.message;
      if (msg && msg.chat?.type === 'private') {
        const chatId = msg.chat.id;
        const textCmd = String(msg.text || '').trim().toLowerCase();

        // Команда /id — удобно узнать свой Telegram ID для COACH_ID / LERA_ID
        if (textCmd === '/id' || textCmd.startsWith('/id@')) {
          const role = resolveRole(msg.from?.id, env);
          const roleLabel = role === 'coach'
            ? 'Тренер (полный доступ)'
            : (role === 'athlete' ? 'Подопечная (синхронизация с тренером)' : 'Пока не добавлен в COACH_ID / LERA_ID');
          await tgApi(env.BOT_TOKEN, 'sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🆔 Твой Telegram ID: <code>${msg.from?.id || chatId}</code>\nРоль в GymNote: <b>${roleLabel}</b>`
          });
          return new Response('OK', { status: 200 });
        }

        const firstName = escapeHtml(msg.from?.first_name || '');
        const greeting = firstName ? `Привет, <b>${firstName}</b>! 👋` : 'Привет! 👋';

        // Убираем старую нижнюю клавиатуру, если она осталась от прошлой версии
        try {
          const tmp = await tgApi(env.BOT_TOKEN, 'sendMessage', {
            chat_id: chatId,
            text: '⚡',
            disable_notification: true,
            reply_markup: { remove_keyboard: true }
          });
          if (tmp?.ok && tmp.result?.message_id) {
            await tgApi(env.BOT_TOKEN, 'deleteMessage', {
              chat_id: chatId,
              message_id: tmp.result.message_id
            });
          }
        } catch {}

        const caption =
          `${greeting}\n\n` +
          `Твои тренировки, прогрессия весов и 97 тренажёров с анимациями.\n` +
          `Все данные сохраняются автоматически в облаке ☁️`;

        const inlineMarkup = {
          inline_keyboard: [
            [
              {
                text: BUTTON_TEXT,
                web_app: { url: APP_URL }
              }
            ]
          ]
        };

        const photoRes = await tgApi(env.BOT_TOKEN, 'sendPhoto', {
          chat_id: chatId,
          photo: BANNER_URL,
          caption,
          parse_mode: 'HTML',
          reply_markup: inlineMarkup
        });

        if (!photoRes?.ok) {
          await tgApi(env.BOT_TOKEN, 'sendMessage', {
            chat_id: chatId,
            text: `<b>GymNote</b>\n\n${caption}`,
            parse_mode: 'HTML',
            reply_markup: inlineMarkup
          });
        }
      }

      return new Response('OK', { status: 200 });
    }

    // Статус-страница воркера (без утечки секретов)
    const statusLines = [
      'GymNote Bot & Coach Cloud Worker ✅',
      `BOT_TOKEN: ${env.BOT_TOKEN ? '✅' : '❌'}`,
      `GYM_KV:    ${env.GYM_KV ? '✅ подключено' : '❌ привяжи KV Namespace с именем GYM_KV'}`,
      `COACH_ID:  ${env.COACH_ID ? '✅ задан' : '❌ добавь переменную COACH_ID'}`,
      `LERA_ID:   ${env.LERA_ID ? '✅ задан' : '⚠️ добавь переменную LERA_ID'}`
    ].join('\n');

    return new Response(statusLines, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
