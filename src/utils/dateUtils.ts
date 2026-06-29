export const toIsoUtc = (d: Date = new Date()): string => d.toISOString();

export const addDays = (d: Date, days: number): Date => {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
};

export const startOfDay = (d: Date = new Date()): Date => {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
};

export const endOfDay = (d: Date = new Date()): Date => {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
};

export const formatYmd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ───────────────────────── timezone-aware day boundaries ─────────────────────────
// Each shop keeps its books in its OWN timezone, so day-boundary unix ranges for
// the report URLs must be built in that zone — not the test machine's. These are
// DST-aware (they read the actual UTC offset of the zone at that date).

/** The zone's offset (minutes east of UTC) at a given instant. +420 for UTC+7, −360 for UTC−6. */
export const tzOffsetMinutes = (instant: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  const asUtc = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour === 24 ? 0 : +parts.hour,
    +parts.minute,
    +parts.second,
  );
  return (asUtc - instant.getTime()) / 60000;
};

/** Calendar date (YYYY-MM-DD) of `d` as seen in `timeZone`. */
export const zonedYmd = (d: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

/** Unix seconds of 00:00:00 of `d`'s calendar day, in `timeZone`. */
export const zonedDayStartUnix = (d: Date, timeZone: string): number => {
  const ymd = zonedYmd(d, timeZone);
  const off = tzOffsetMinutes(new Date(`${ymd}T12:00:00Z`), timeZone);
  return Math.floor((Date.parse(`${ymd}T00:00:00Z`) - off * 60000) / 1000);
};

/** Unix seconds of 23:59:59 of `d`'s calendar day, in `timeZone`. */
export const zonedDayEndUnix = (d: Date, timeZone: string): number => {
  const ymd = zonedYmd(d, timeZone);
  const off = tzOffsetMinutes(new Date(`${ymd}T12:00:00Z`), timeZone);
  return Math.floor((Date.parse(`${ymd}T23:59:59Z`) - off * 60000) / 1000);
};
