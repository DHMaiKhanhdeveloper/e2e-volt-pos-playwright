export const toMinorUnits = (amount: number, decimals = 2): number =>
  Math.round(amount * Math.pow(10, decimals));

export const fromMinorUnits = (minor: number, decimals = 2): number =>
  minor / Math.pow(10, decimals);

export const formatCurrency = (amount: number, currency = 'VND', locale = 'vi-VN'): string =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
