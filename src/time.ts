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
