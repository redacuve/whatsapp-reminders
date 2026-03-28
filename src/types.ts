export type SendFn = (msg: string) => Promise<void>;

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
  | 'lang';

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
