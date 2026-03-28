import { Client, LocalAuth, Message, Chat } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

import { MY_NUMBER, MY_NUMBER_LID, MY_GROUP, SESSION_PATH } from "./config";
import { Logger } from "./logger";

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-features=site-per-process",
    ],
    waitForInitialization: true,
  },
});

client.on("qr", (qr) => {
  Logger.info("📷 Scan the QR code below with WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  Logger.info("✅ WhatsApp Reminders bot is ready!");
});

client.on("message", async (message) => {
  const chat: Chat = await message.getChat();
  const isMyNumber =
    message.from === MY_NUMBER || message.from === MY_NUMBER_LID;
  if (chat.isGroup) {
    Logger.info(
      {
        group: chat.name,
        from: message.from,
        author: message.author ?? "unknown",
        body: message.body,
      },
      "👥 Group message",
    );
  } else {
    Logger.info({ from: message.from, body: message.body }, "📩 Private chat");
  }

  // Only process commands from my number
  if (!isMyNumber) return;

  Logger.info({ body: message.body }, "⚡ Processing command");
});

client.on("auth_failure", (msg) => {
  Logger.error({ msg }, "🔐 Authentication failure");
});

client.on("disconnected", (reason) => {
  Logger.warn({ reason }, "🔌 Client disconnected");
});

client.initialize();
