export type SendFn = (msg: string) => Promise<void>;

export interface HandlerResult {
  status: 'ok' | 'error';
  message: string;
}

// --- Parser layer types ---

export type CommandParser = (
  tokens: string[],
  context: ParserContext,
) => ParseResult;

export interface ParserCommandDef {
  key: string;
  subcommands?: Record<string, ParserCommandDef>;
  parse: CommandParser;
  defaultConfig?: Record<string, unknown>;
}

export interface ParserContext {
  locale: Locale;
  subcommand?: string;
  user?: string;
}

export interface ParseResult {
  command: string;
  action: string;
  params?: Record<string, unknown>;
  error?: string;
}

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
  commands: Record<string, CommandDef>;
  motivationalMessages: string[];
  commandList: any;
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
    remiAbout: (name: string, commandsList: string) => string;
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
    whatCanYouDo: (featuresSection: string) => string;
    laughKeywords: string[];
    laughResponses: string[];
    complimentKeywords: string[];
    complimentResponses: string[];
    sorryKeywords: string[];
    sorryResponses: string[];
    noteAdded: (text: string) => string;
    noteDeleted: (text: string) => string;
    noteList: string;
    notePendingList?: string;
    noteDoneList?: string;
    noteEmpty: string;
    noteNotFound: string;
    noteListCmd: string;
    noteDeleteCmd: string | string[];
    noteHelpCmd: string;
    noteDoneCmd?: string | string[];
    noteUndoneCmd?: string | string[];
    noteMarkedDone?: (text: string) => string;
    noteMarkedUndone?: (text: string) => string;
    noteAlreadyDone?: (text: string) => string;
    noteAlreadyPending?: (text: string) => string;
    journalAdded: (preview: string) => string;
    journalDeleted: string;
    journalList: string;
    journalEmpty: string;
    journalNotFound: string;
    journalListCmd: string;
    journalDeleteCmd: string | string[];
    journalHelpCmd: string;
    journalRandomCmd?: string;
    journalRandom?: string;
    journalDateCmd?: string | string[];
    journalStatsCmd?: string | string[];
    journalStats?: (stats: any) => string;
    journalKeywords: string[];
    noteKeywords: string[];
    remiKeywords: string[];
    aboutKeywords: string[];
    languageHelp: string;
  };
}

export interface MessageContext {
  language: string;
  locale: Locale;
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
  | 'message'
  | 'status'
  | 'ping'
  | 'pomodoro'
  | 'language'
  | 'reminder'
  | 'note'
  | 'journal';

export interface CommandDef {
  name: string;
  desc: string;
  /** Primary keyword shown in compact command lists; falls back to name.toLowerCase() */
  trigger?: string;
  /** Emoji marks this command as a user-facing feature (shown in "what can you do") */
  emoji?: string;
  /** Marketing-friendly display name for the features list; falls back to name */
  featureName?: string;
  /** Marketing-friendly description for the features list; falls back to desc */
  featureDesc?: string;
  subcommands?: SubcommandDef;
}

export type SubcommandDef = string[];

/**
 * Single source of truth for a command entry in a locale.
 * Builder functions derive both the parser commandList and the display commands from this.
 */
export interface CommandEntry {
  /** Trigger words/aliases used by the parser (commandList.list) */
  triggers: string[];
  /** Subcommand trigger words key → aliases (commandList.subcommands) */
  subcommandTriggers?: Record<string, string[]>;
  /** Display name — omit for commands with no help entry (hello, bye, remi) */
  name?: string;
  /** Short description */
  desc?: string;
  /** Override display trigger shown in help (defaults to triggers[0]) */
  trigger?: string;
  /** Emoji marks as a user-facing feature (shown in "what can you do") */
  emoji?: string;
  /** Feature list name; falls back to name */
  featureName?: string;
  /** Feature list description; falls back to desc */
  featureDesc?: string;
  /** Human-readable subcommand usage lines (shown in command help output) */
  helpLines?: string[];
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

export interface NoteRow {
  id: number;
  number: string;
  text: string;
  created_at: string;
  done: number; // 0 | 1
  done_at: string | null;
}

export interface JournalStats {
  totalEntries: number;
  totalWords: number;
  daysWritten: number;
  currentStreak: number;
  longestStreak: number;
}

export interface JournalRow {
  id: number;
  number: string;
  text: string;
  created_at: string;
}

export interface ReminderRow {
  id: number;
  number: string;
  text: string;
  remind_at: string;
  sent: number;
  created_at: string;
}
