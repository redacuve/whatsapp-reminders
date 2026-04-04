export interface ParsedTime {
  due: Date;
  text: string;
}

export interface ParsedEdit {
  due?: Date;
  text?: string;
}

export interface DayLabels {
  today: string;
  tomorrow: string;
}

const MAX_RELATIVE_MINUTES = 10_080; // 7 days
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
const DEFAULT_MORNING_HOUR = 9;

// ---- Public API ----

/**
 * Parse a full reminder input: `<time-expression> <text>`.
 * Returns null when no valid time + text combination is found.
 */
export function parseReminderTime(
  input: string,
  vagueHours: Record<string, number>,
  tomorrowKeywords: string[],
): ParsedTime | null {
  const result = extractTime(input.trim(), vagueHours, tomorrowKeywords, true);
  if (!result?.rest) return null;
  return { due: result.due, text: result.rest };
}

/**
 * Parse an edit input: `<time-expression> [text]` or just `<text>`.
 * Missing text means "keep old value".
 */
export function parseEditInput(
  input: string,
  vagueHours: Record<string, number>,
  tomorrowKeywords: string[],
): ParsedEdit {
  const trimmed = input.trim();
  const result = extractTime(trimmed, vagueHours, tomorrowKeywords, false);
  if (result) {
    return {
      due: result.due,
      ...(result.rest ? { text: result.rest } : {}),
    };
  }
  return { text: trimmed };
}

/**
 * Format a reminder datetime for display.
 * Shows today/tomorrow label or DD/MM for further dates.
 */
export function formatReminderTime(
  due: Date | string,
  labels: DayLabels,
): string {
  const d =
    typeof due === 'string' ? new Date(due.replace(' ', 'T') + 'Z') : due;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + MS_PER_DAY);
  const dayAfterStart = new Date(tomorrowStart.getTime() + MS_PER_DAY);

  const time = formatHHMM(d);

  if (d >= todayStart && d < tomorrowStart) return `${labels.today} ${time}`;
  if (d >= tomorrowStart && d < dayAfterStart)
    return `${labels.tomorrow} ${time}`;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${time}`;
}

// ---- Core parser ----

interface TimeParseResult {
  due: Date;
  rest: string;
}

/**
 * Unified parsing pipeline. When `textRequired` is true, bare numbers are
 * accepted as relative minutes (the mandatory text disambiguates); when false,
 * the `+` prefix is required for relative minutes.
 */
function extractTime(
  input: string,
  vagueHours: Record<string, number>,
  tomorrowKeywords: string[],
  textRequired: boolean,
): TimeParseResult | null {
  if (!input) return null;

  // Relative minutes: +N always, bare N only when text is required
  const relRe = textRequired
    ? /^\+?(\d+)\s+([\s\S]+)/
    : /^\+(\d+)(?:\s+([\s\S]+))?$/;
  const relMatch = input.match(relRe);
  if (relMatch) {
    const mins = parseInt(relMatch[1], 10);
    if (mins > 0 && mins <= MAX_RELATIVE_MINUTES) {
      return {
        due: new Date(Date.now() + mins * MS_PER_MINUTE),
        rest: relMatch[2]?.trim() ?? '',
      };
    }
  }

  // Tomorrow prefix
  let dayOffset = 0;
  let rest = input;
  const tomorrowRe = buildPrefixRe(tomorrowKeywords, textRequired);
  const tomorrowMatch = input.match(tomorrowRe);
  if (tomorrowMatch) {
    dayOffset = 1;
    rest = tomorrowMatch[1]?.trim() ?? '';
    if (!rest)
      return { due: resolveTime(DEFAULT_MORNING_HOUR, 0, 1), rest: '' };
  }

  // HH:MM
  const timeRe = textRequired
    ? /^(\d{1,2}):(\d{2})\s+([\s\S]+)/
    : /^(\d{1,2}):(\d{2})(?:\s+([\s\S]+))?$/;
  const timeMatch = rest.match(timeRe);
  if (timeMatch) {
    const [h, m] = [parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10)];
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return {
        due: resolveTime(h, m, dayOffset),
        rest: timeMatch[3]?.trim() ?? '',
      };
    }
  }

  // Vague time expressions (sorted longest-first for greedy match)
  for (const [keyword, hour] of sortedEntries(vagueHours)) {
    const pattern = escapeRegex(keyword);
    const vagueRe = textRequired
      ? new RegExp(`^${pattern}\\s+([\\s\\S]+)`, 'i')
      : new RegExp(`^${pattern}(?:\\s+([\\s\\S]+))?$`, 'i');
    const vm = rest.match(vagueRe);
    if (vm) {
      return {
        due: resolveTime(hour, 0, dayOffset),
        rest: vm[1]?.trim() ?? '',
      };
    }
  }

  return null;
}

// ---- Helpers ----

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sortedEntries(map: Record<string, number>): [string, number][] {
  return Object.entries(map).sort(([a], [b]) => b.length - a.length);
}

function buildPrefixRe(keywords: string[], requireRest: boolean): RegExp {
  const alts = keywords.map(escapeRegex).join('|');
  return requireRest
    ? new RegExp(`^(?:${alts})\\s+([\\s\\S]+)`, 'i')
    : new RegExp(`^(?:${alts})(?:\\s+([\\s\\S]+))?$`, 'i');
}

function resolveTime(hour: number, minute: number, dayOffset: number): Date {
  const now = new Date();
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    hour,
    minute,
  );
  if (dayOffset === 0 && d <= now) d.setDate(d.getDate() + 1);
  return d;
}

function formatHHMM(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ---- Flexible time token parser ----

/**
 * Parses a single token as a time expression.
 * Accepts: HH:MM, H:MM, 8:00am, 8am, 8pm, 20hrs, 20hr, 8h
 * Returns null if the token is not a recognised time format.
 */
export function parseFlexibleTimeToken(
  token: string,
): { h: number; m: number } | null {
  // HH:MM or H:MM with optional am/pm suffix — e.g. 14:30, 8:00am, 8:00PM
  const colonMatch = token.match(/^(\d{1,2}):(\d{2})(am|pm)?$/i);
  if (colonMatch) {
    let h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    const ampm = colonMatch[3]?.toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return { h, m };
  }

  // Ham/pm — e.g. 8am, 8pm, 11PM
  const ampmMatch = token.match(/^(\d{1,2})(am|pm)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const ampm = ampmMatch[2].toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    if (h >= 0 && h < 24) return { h, m: 0 };
  }

  // HHhrs / Hhr / Hh — e.g. 20hrs, 8hr, 14h
  const hrsMatch = token.match(/^(\d{1,2})h(?:rs?)?$/i);
  if (hrsMatch) {
    const h = parseInt(hrsMatch[1], 10);
    if (h >= 0 && h < 24) return { h, m: 0 };
  }

  return null;
}

// ---- Recurring reminders ----

/**
 * Given a recurrence type + value and a reference date, returns the next
 * occurrence strictly after `from`.
 *
 * type='interval'  value='30'         → from + 30 min
 * type='weekly'    value='0 08:00'    → next Monday at 08:00 (0=Mon…6=Sun)
 * type='monthly'   value='15 09:00'  → next 15th of month at 09:00
 * type='weekdays'  value='08:00'      → next Mon–Fri at 08:00
 * type='weekends'  value='10:00'      → next Sat–Sun at 10:00
 */
export function computeNextOccurrence(
  type: string,
  value: string,
  from: Date,
): Date {
  if (type === 'interval') {
    const mins = parseInt(value, 10);
    return new Date(from.getTime() + mins * MS_PER_MINUTE);
  }

  if (type === 'weekly') {
    const [dayStr, timeStr] = value.split(' ');
    const targetDow = parseInt(dayStr, 10); // 0=Mon…6=Sun
    const [h, m] = timeStr.split(':').map(Number);
    // JS getDay(): 0=Sun, 1=Mon…6=Sat  →  our 0=Mon maps to JS 1
    const jsTarget = targetDow === 6 ? 0 : targetDow + 1;
    const d = new Date(from);
    d.setSeconds(0, 0);
    d.setHours(h, m, 0, 0);
    // Advance day-by-day until we land on the right weekday and it's after `from`
    while (d.getDay() !== jsTarget || d <= from) {
      d.setDate(d.getDate() + 1);
      d.setHours(h, m, 0, 0);
    }
    return d;
  }

  if (type === 'monthly') {
    const [dayStr, timeStr] = value.split(' ');
    const dom = parseInt(dayStr, 10);
    const [h, m] = timeStr.split(':').map(Number);
    let d = new Date(from.getFullYear(), from.getMonth(), dom, h, m, 0, 0);
    if (d <= from) {
      d = new Date(from.getFullYear(), from.getMonth() + 1, dom, h, m, 0, 0);
    }
    return d;
  }

  if (type === 'weekdays' || type === 'weekends') {
    const [h, m] = value.split(':').map(Number);
    const isTarget =
      type === 'weekdays'
        ? (day: number) => day >= 1 && day <= 5 // Mon–Fri (JS getDay 1-5)
        : (day: number) => day === 0 || day === 6; // Sat–Sun (JS 0, 6)
    const d = new Date(from);
    d.setHours(h, m, 0, 0);
    while (!isTarget(d.getDay()) || d <= from) {
      d.setDate(d.getDate() + 1);
      d.setHours(h, m, 0, 0);
    }
    return d;
  }

  throw new Error(`Unknown recurrence type: ${type}`);
}
