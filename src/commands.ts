import { LANG } from './config';
import { getLocale } from './i18n';
import { MessageContext, SendFn } from './types';

function t() {
  return getLocale(LANG);
}

export async function handleCommand(
  text: string,
  send: SendFn,
  ctx: MessageContext,
): Promise<void> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Help command
  if (
    lower === 'help' ||
    lower === 'h' ||
    lower === '?' ||
    lower === 'commands'
  ) {
    const locale = t();
    const lines = Object.values(locale.commands).map(
      (cmd) => `*${cmd.name}*: ${cmd.desc}`,
    );
    await send(`*${locale.name} Commands:*\n\n${lines.join('\n')}`);
    return;
  }

  // Motivate command
  if (lower === 'msg' || lower === 'motivate') {
    const locale = t();
    const msgs = locale.motivationalMessages;
    const random = msgs[Math.floor(Math.random() * msgs.length)];
    await send(`${locale.responses.motivatePrefix}\n\n${random}`);
    return;
  }

  // Status command
  if (lower === 'status') {
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
  if (lower === 'ping') {
    await send(t().responses.ping);
    return;
  }

  // Unknown command
  await send(t().responses.unknown);
}
