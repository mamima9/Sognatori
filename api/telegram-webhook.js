const BOT_API = "https://api.telegram.org";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!botToken || !webhookSecret) {
    console.error("Telegram webhook is missing required environment variables.");
    return res.status(500).json({ ok: false, error: "Telegram webhook is not configured" });
  }

  if (
    req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret
  ) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const message = req.body?.message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim() || "";

  if (!chatId || !text.startsWith("/")) {
    return res.status(200).json({ ok: true });
  }

  if (text === "/start" || text.startsWith("/start ")) {
    const telegramResponse = await fetch(
      `${BOT_API}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            "🌙 Benvenuto nel mondo di Sognatori!\n\n" +
            "Creature, strategia e avventure ti aspettano.\n\n" +
            "Entra nel gioco, costruisci la tua squadra e diventa una leggenda!",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🎮 GIOCA A SOGNATORI",
                  web_app: {
                    url: "https://sognatori.vercel.app/"
                  }
                }
              ]
            ]
          }
        })
      }
    );

    if (!telegramResponse.ok) {
      const errorBody = await telegramResponse.text();
      console.error("Telegram sendMessage failed:", errorBody);
      return res.status(502).json({ ok: false, error: "Telegram API request failed" });
    }
  } else if (text === "/help") {
    const telegramResponse = await fetch(
      `${BOT_API}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🎮 Premi il pulsante qui sotto per aprire Sognatori e iniziare a giocare.",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🎮 APRI SOGNATORI",
                  web_app: {
                    url: "https://sognatori.vercel.app/"
                  }
                }
              ]
            ]
          }
        })
      }
    );

    if (!telegramResponse.ok) {
      const errorBody = await telegramResponse.text();
      console.error("Telegram sendMessage failed:", errorBody);
      return res.status(502).json({ ok: false, error: "Telegram API request failed" });
    }
  }

  return res.status(200).json({ ok: true });
}
