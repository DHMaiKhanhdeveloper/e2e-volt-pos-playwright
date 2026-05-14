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
