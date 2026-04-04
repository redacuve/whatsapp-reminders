import qrcode from 'qrcode-terminal';
import { Chat, Client, Contact, LocalAuth } from 'whatsapp-web.js';

import {
  LANG,
  MY_GROUP,
  MY_NUMBER,
  MY_NUMBER_LID,
  SESSION_PATH,
} from './config';
import * as db from './db';
import { handleCommand } from './handleCommand';
import { getLocale } from './i18n';
import { Logger } from './logger';
import { startScheduler } from './scheduler';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_PATH }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-features=site-per-process',
    ],
    waitForInitialization: true,
  },
});

client.on('qr', (qr) => {
  Logger.info('📷 Scan the QR code below with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  const { wid, pushname, platform } = client.info;
  Logger.info(
    {
      number: wid._serialized,
      name: pushname,
      platform,
    },
    '✅ WhatsApp Reminders bot is ready!',
  );

  startScheduler(async (chatId: string, message: string) => {
    await client.sendMessage(chatId, message);
  });
});

client.on('message', async (message) => {
  const chat: Chat = await message.getChat();

  // Gating: if MY_GROUP is set, only respond in that group
  //         if MY_NUMBER is set, only respond to that number
  //         if neither is set, respond to anyone
  const groupGated =
    MY_GROUP && chat.isGroup && chat.id._serialized !== MY_GROUP;
  const numberGated =
    MY_NUMBER && !MY_NUMBER_LID
      ? message.from !== MY_NUMBER
      : MY_NUMBER_LID
        ? message.from !== MY_NUMBER && message.from !== MY_NUMBER_LID
        : false;
  const isGated = MY_GROUP || MY_NUMBER ? groupGated || numberGated : false;

  if (chat.isGroup) {
    Logger.info(
      {
        group: chat.name,
        from: message.from,
        author: message.author ?? 'unknown',
        body: message.body,
      },
      '👥 Group message',
    );
  } else {
    Logger.info({ from: message.from, body: message.body }, '📩 Private chat');
  }

  if (isGated) return;

  Logger.info({ body: message.body }, '⚡ Processing command');
  const language = db.getLanguage(message.from) || LANG;
  const locale = getLocale(language);
  const contact = await message.getContact();
  await handleCommand(
    message.body,
    async (response) => {
      await message.reply(response);
    },
    {
      language,
      locale,
      from: message.from,
      chatId: chat.id._serialized,
      isGroup: chat.isGroup,
      groupName: chat.isGroup ? chat.name : undefined,
      timestamp: new Date(message.timestamp * 1000),
      senderName: contact.name ?? contact.pushname ?? contact.number,
      senderPushName: contact.pushname,
      senderNumber: contact.number,
      senderIsBusiness: contact.isBusiness,
      senderLanguage: (contact as Contact & { language?: string }).language,
      botNumber: client.info.wid._serialized,
      botName: client.info.pushname,
      botPlatform: client.info.platform,
    },
  );
});

client.on('auth_failure', (msg) => {
  Logger.error({ msg }, '🔐 Authentication failure');
});

client.on('disconnected', (reason) => {
  Logger.warn({ reason }, '🔌 Client disconnected');
});

client.initialize();
