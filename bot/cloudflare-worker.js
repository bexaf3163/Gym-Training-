/**
 * GymNote — Telegram Bot Webhook Worker (Cloudflare Workers, Free Tier)
 *
 * Отвечает на /start в @GymNote2_bot приветствием и большой кнопкой
 * «🏋️ Открыть GymNote» на всю ширину экрана.
 *
 * Настройка за 2 минуты:
 * 1. Создай Worker на https://dash.cloudflare.com -> Workers & Pages -> Create Worker
 * 2. Вставь этот код в редактор и нажми Deploy
 * 3. Открой Settings -> Variables and Secrets -> Add -> Secret:
 *      Name:  BOT_TOKEN
 *      Value: токен твоего бота из @BotFather
 * 4. Открой в браузере: https://<твой-воркер>.workers.dev/setup
 * 5. Открой @GymNote2_bot в Telegram и отправь /start
 */

const APP_URL = 'https://bexaf3163.github.io/Gym-Training-/';
const BUTTON_TEXT = '🏋️ Открыть GymNote';

async function deriveWebhookSecret(token) {
  const bytes = new TextEncoder().encode(`gymnote-webhook:${token}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
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

    if (!env.BOT_TOKEN) {
      return new Response(
        'Добавь секрет BOT_TOKEN в Cloudflare Worker -> Settings -> Variables and Secrets.',
        { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // 1) Одноразовая настройка webhook + широкой кнопки меню: открыть /setup в браузере
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
        ? '✅ Готово! Бот GymNote подключён.\nТеперь открой @GymNote2_bot в Telegram и отправь /start.'
        : `⚠️ Ошибка настройки:\nwebhook: ${JSON.stringify(whRes)}\nmenu: ${JSON.stringify(menuRes)}`;

      return new Response(text, {
        status: ok ? 200 : 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 2) Обработка сообщений от Telegram
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
        const firstName = escapeHtml(msg.from?.first_name || '');
        const greeting = firstName ? `Привет, <b>${firstName}</b>! 👋` : 'Привет! 👋';

        await tgApi(env.BOT_TOKEN, 'sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text:
            `${greeting}\n\n` +
            `<b>GymNote</b> — трекер тренировок, прогрессии весов и тренажёров.\n` +
            `Все данные сохраняются автоматически в твоём облаке Telegram ☁️\n\n` +
            `Жми большую кнопку внизу 👇`,
          reply_markup: {
            keyboard: [
              [
                {
                  text: BUTTON_TEXT,
                  web_app: { url: APP_URL }
                }
              ]
            ],
            resize_keyboard: false,
            is_persistent: true
          }
        });
      }

      return new Response('OK', { status: 200 });
    }

    return new Response('GymNote Bot Worker is running ✅\nOpen /setup to connect Telegram webhook.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
