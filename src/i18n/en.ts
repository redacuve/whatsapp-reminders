import { CommandDef, CommandKey } from '../types';

const commands: Record<CommandKey, CommandDef> = {
  help: { name: 'Help', desc: 'Show available commands' },
  msg: { name: 'Motivate', desc: 'Send a motivational message now' },
  status: { name: 'Status', desc: 'Show bot status' },
  ping: { name: 'Ping', desc: 'Responds with pong' },
};

const motivationalMessages = [
  "Good morning. Today is a new day to build something great. What's your goal?",
  'Focus on ONE thing today. Multitasking is the enemy of progress.',
  "Do the thing you're avoiding first. That uncomfortable task will make you grow the most.",
  "Discipline beats motivation. Don't wait until you're ready, just start.",
  'Small progress is still progress. 1% daily = 37x per year.',
  "Don't negotiate with yourself. You made a commitment, honor it.",
  'Remember why you started. That goal is still there.',
  'Time is your most valuable resource. How are you investing it today?',
  'Extraordinary results require consistent effort, not perfect effort.',
  'Step out of your comfort zone. Growth lives on the other side of fear.',
  "Don't compare yourself to others. Compete with who you were yesterday.",
  'Every day you practice is a day closer to where you want to be.',
  'Perfection is the enemy of progress. Done is better than perfect.',
  'Your future is being built by what you do today, not tomorrow.',
  "If you don't feel like it today, do it anyway. That's called discipline.",
  "You don't rise to the level of your goals, you fall to the level of your systems.",
  'Stop waiting for the right moment. The right moment is the one you create.',
  "Tired? Good. That means you're pushing past where most people stop.",
  "Success is not owned, it's rented — and rent is due every single day.",
  'The version of you from 5 years ago would be proud of where you are. Keep going.',
  'Hard work in silence. Let the results make the noise.',
  'Energy flows where attention goes. What are you feeding your focus today?',
  "One year from now, you'll wish you had started today.",
  "Your habits are votes for the person you're becoming. Choose wisely.",
  "Don't shrink to fit a world that hasn't caught up to your vision yet.",
  'The pain of discipline weighs ounces. The pain of regret weighs tons.',
  'You have the same 24 hours as everyone else. What you do with them is your story.',
  'Be the version of yourself that future you is counting on.',
  'Momentum is built in the moments when quitting feels easiest.',
  'Comfort is a slow death. Choose challenge.',
];

export const en = {
  code: 'en',
  name: 'English',
  commands,
  motivationalMessages,
  responses: {
    motivatePrefix: "Here's a motivational message for you! 💪",
    status: 'Bot is running smoothly! ✅',
    ping: 'Pong! 🏓',
    unknown:
      "Sorry, I didn't understand that command. Type *help* to see available commands.",
  },
};

export type Locale = typeof en;
