import { getTimeOfDay, pickRandom } from '../helper';
import { buildCommandsList } from '../i18n';
import { MessageContext } from '../types';

export function helpHandler(ctx: MessageContext) {
  const { locale } = ctx;
  const lines = Object.values(locale.commands).map((cmd) => {
    const sub = cmd.subcommands
      ? '\n' + cmd.subcommands.map((s) => `  › ${s}`).join('\n')
      : '';
    return `*${cmd.name}*: ${cmd.desc}${sub}`;
  });
  return `*${locale.name} Commands:*\n\n${lines.join('\n\n')}${locale.responses.helpHint}`;
}

export function statusHandler(ctx: MessageContext) {
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
  return `📊 *Your info*\n👤 Name: ${ctx.senderName}${pushLine}\n📞 Number: +${ctx.senderNumber}\n🔑 ID: ${ctx.from}${bizLine}${langLine}\n💬 Chat: ${chat}\n🕐 Message sent at: ${time}\n\n✨ *Remi info*\n📞 Number: ${ctx.botNumber}\n👤 Name: ${ctx.botName}\n📱 Platform: ${ctx.botPlatform}`;
}

export function pingHandler(ctx: MessageContext) {
  const { locale } = ctx;
  return locale.responses.ping || 'pong';
}

export const messageHandler = (ctx: MessageContext) => {
  const { locale } = ctx;
  const msgs = locale.motivationalMessages;
  return `${locale.responses.motivatePrefix}\n\n${pickRandom(msgs)}`;
};

export const helloHandler = (ctx: MessageContext) => {
  const { locale, senderPushName, timestamp, senderName } = ctx;
  const name = senderPushName || senderName;
  const hour = timestamp.getHours();

  return pickRandom(locale.responses.greetings[getTimeOfDay(hour)])(name);
};

export const byeHandler = (ctx: MessageContext) => {
  const { locale } = ctx;
  return pickRandom(locale.responses.farewells);
};

export const remiHandler = (ctx: MessageContext) => {
  const { locale, senderPushName, senderName } = ctx;
  const name = senderPushName || senderName;
  return locale.responses.remiAbout(name, buildCommandsList(locale));
};
