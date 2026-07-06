/** ISO-8601 week helpers used to anchor sheet week columns to real dates. */

export function isoWeekOf(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** Monday (UTC) that starts the given ISO week. */
export function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `now`, as a UTC timestamp. */
export function currentWeekMondayTime(now: Date): number {
  const { year, week } = isoWeekOf(now);
  return isoWeekMonday(year, week).getTime();
}
