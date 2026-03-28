import { LANG } from './config';
import * as db from './db';
import { getLocale } from './i18n';
import { MessageContext, SendFn } from './types';

function getLang(): string {
  return db.getSetting('language') || LANG;
}

function t() {
  return getLocale(getLang());
}

export async function handleCommand(
  text: string,
  send: SendFn,
  ctx: MessageContext,
): Promise<void> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const locale = t();

  // Returns true if lower matches any of the given aliases OR the locale command name
  const matches = (key: keyof typeof locale.commands, ...aliases: string[]) =>
    aliases.includes(lower) ||
    lower === locale.commands[key].name.toLowerCase();

  // Help command
  if (matches('help', 'help', 'h', '?', 'commands')) {
    const lines = Object.values(locale.commands).map(
      (cmd) => `*${cmd.name}*: ${cmd.desc}`,
    );
    await send(`*${locale.name} Commands:*\n\n${lines.join('\n')}`);
    return;
  }

  // Language command
  if (lower.startsWith('lang ')) {
    const lang = lower.slice(5).trim();
    if (!['en', 'es', 'pt'].includes(lang)) {
      await send(locale.responses.langInvalid);
      return;
    }
    db.setSetting('language', lang);
    await send(getLocale(lang).responses.langChanged);
    return;
  }

  // Motivate command
  if (matches('msg', 'msg', 'motivate')) {
    const msgs = locale.motivationalMessages;
    const random = msgs[Math.floor(Math.random() * msgs.length)];
    await send(`${locale.responses.motivatePrefix}\n\n${random}`);
    return;
  }

  // Status command
  if (matches('status', 'status')) {
    const time = ctx.timestamp.toLocaleString();
    const chat = ctx.isGroup
      ? `👥 ${ctx.groupName ?? ctx.chatId}`
      : `💬 ${ctx.chatId}`;
    const pushLine = ctx.senderPushName
      ? `\n📲 Display name: ${ctx.senderPushName}`
      : '';
    const bizLine = ctx.senderIsBusiness ? '\n💼 Business account: Yes' : '';
    const langLine = ctx.senderLanguage
      ? `\n🌐 Language: ${ctx.senderLanguage}`
      : '';
    await send(
      `📊 *Your info*\n👤 Name: ${ctx.senderName}${pushLine}\n📞 Number: +${ctx.senderNumber}\n🔑 ID: ${ctx.from}${bizLine}${langLine}\n💬 Chat: ${chat}\n🕐 Message sent at: ${time}\n\n🤖 *Bot info*\n📞 Number: ${ctx.botNumber}\n👤 Name: ${ctx.botName}\n📱 Platform: ${ctx.botPlatform}`,
    );
    return;
  }

  // Ping command
  if (matches('ping', 'ping')) {
    await send(locale.responses.ping);
    return;
  }

  // Unknown command
  await send(locale.responses.unknown);
}
