import journalCommand from './journal';
import { languageCommand } from './language';
import noteCommand from './note';
import pomodoroCommand from './pomodoro';
import reminderCommand from './reminder';
import {
  byeCommand,
  helloCommand,
  helpCommand,
  messageCommand,
  pingCommand,
  remiCommand,
  statusCommand,
} from './simple';

export const commands = {
  // Register every new command here
  help: helpCommand,
  status: statusCommand,
  ping: pingCommand,
  message: messageCommand,
  hello: helloCommand,
  bye: byeCommand,
  pomodoro: pomodoroCommand,
  language: languageCommand,
  reminder: reminderCommand,
  note: noteCommand,
  journal: journalCommand,
  remi: remiCommand,
};
