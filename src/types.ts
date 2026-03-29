export type SendFn = (msg: string) => Promise<void>;

export const EMOJI_KEYWORDS: string[] = [
  '👍',
  '🔥',
  '💪',
  '🙌',
  '👏',
  '🎉',
  '✨',
  '⭐',
  '❤️',
  '🫡',
];

export interface Locale {
  code: string;
  name: string;
  tomorrowKeywords: string[];
  dayLabels: { today: string; tomorrow: string };
  vagueHours: Record<string, number>;
  commands: Record<CommandKey, CommandDef>;
  motivationalMessages: string[];
  responses: {
    motivatePrefix: string;
    status: string;
    ping: string;
    unknown: string;
    langChanged: string;
    langInvalid: string;
    invalidArgs: string;
    pomodoroStarted: (task: string, mins: number) => string;
    pomodoroDefaultTask: string;
    pomodoroStart: string[];
    pomodoroEnd: string[];
    pomodoroAlreadyActive: string;
    pomodoroNoActive: string;
    pomodoroStatus: (task: string, minsLeft: number) => string;
    pomodoroCancelled: string;
    pomodoroUpdated: (task: string, mins: number) => string;
    pomodoroHelpCmd: string;
    pomodoroStatusCmd: string;
    pomodoroCancelCmd: string;
    pomodoroDone: (task: string) => string;
    reminderAdded: (text: string, when: string) => string;
    reminderEdited: (text: string, when: string) => string;
    reminderDeleted: (text: string) => string;
    reminderDone: (text: string) => string;
    reminderList: string;
    reminderEmpty: string;
    reminderNotFound: string;
    reminderInvalidTime: string;
    reminderListCmd: string;
    reminderDeleteCmd: string;
    reminderEditCmd: string;
    reminderHelpCmd: string;
    greetingKeywords: string[];
    greetings: {
      morning: ((name: string) => string)[];
      afternoon: ((name: string) => string)[];
      evening: ((name: string) => string)[];
      night: ((name: string) => string)[];
    };
    farewellKeywords: string[];
    helpHint: string;
    remiAbout: (name: string) => string;
    farewells: string[];
    thanksKeywords: string[];
    thanks: string[];
    howAreYouKeywords: string[];
    howAreYou: string[];
    emojiKeywords: string[];
    emojiReactions: string[];
    whoAreYouKeywords: string[];
    whoAreYou: string[];
    whatCanYouDoKeywords: string[];
    whatCanYouDo: string[];
    laughKeywords: string[];
    laughResponses: string[];
    complimentKeywords: string[];
    complimentResponses: string[];
    sorryKeywords: string[];
    sorryResponses: string[];
  };
}

export interface MessageContext {
  from: string;
  chatId: string;
  isGroup: boolean;
  groupName?: string;
  timestamp: Date;
  senderName: string;
  senderPushName?: string;
  senderNumber: string;
  senderIsBusiness: boolean;
  senderLanguage?: string;
  botNumber: string;
  botName: string;
  botPlatform: string;
}

export type CommandKey =
  | 'help'
  | 'msg'
  | 'status'
  | 'ping'
  | 'pomodoro'
  | 'lang'
  | 'reminder';

export interface CommandDef {
  name: string;
  desc: string;
  subcommands?: string[];
}

export interface PomodoroRow {
  id: number;
  number: string;
  task: string;
  duration_minutes: number;
  started_at: string;
  due_at: string;
  completed: number;
}

export interface ReminderRow {
  id: number;
  number: string;
  text: string;
  remind_at: string;
  sent: number;
  created_at: string;
}
