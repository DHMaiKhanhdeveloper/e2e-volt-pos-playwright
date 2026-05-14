export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const mask = (s: string, visible = 4): string => {
  if (s.length <= visible) return '*'.repeat(s.length);
  return '*'.repeat(s.length - visible) + s.slice(-visible);
};

export const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, max - 1) + '…';

export const onlyDigits = (s: string): string => s.replace(/\D+/g, '');
