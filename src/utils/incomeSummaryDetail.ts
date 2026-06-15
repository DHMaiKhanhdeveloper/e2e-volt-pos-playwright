import { parseCentsFromUsd } from '@utils/moneyUtils';

/** A money line, e.g. "$1,234.56" or "-$60.00" (also matches "$0.00"). */
export const MONEY_RE = /^-?\$\d{1,3}(,\d{3})*\.\d{2}$/;

/**
 * Helpers for parsing the Income Summary detail panel, captured via
 * `IncomeSummaryPage.detailBodyText()`. The panel is a flat list of
 * label-line / value-line pairs grouped under five section headings:
 *   Payment Details · Sale Details · Supply Fee · Staff Payout · Salon Earnings
 */

export const DETAIL_SECTIONS = [
  'Payment Details',
  'Sale Details',
  'Supply Fee',
  'Staff Payout',
  'Salon Earnings',
] as const;

/** The text slice belonging to one section (its heading → the next heading). */
export const sectionSlice = (panelText: string, section: string, nextSection?: string): string => {
  const start = panelText.indexOf(section);
  if (start < 0) return '';
  const end = nextSection ? panelText.indexOf(nextSection, start + section.length) : -1;
  return panelText.slice(start, end < 0 ? undefined : end);
};

/** The slice between two labels within a section (e.g. the "Cash" block up to "Card"). */
export const block = (text: string, startLabel: string, endLabel?: string): string =>
  sectionSlice(text, startLabel, endLabel);

/** Every money value (in cents) whose line immediately follows `label`. */
export const valuesAfterLabel = (text: string, label: string): number[] => {
  const lines = text.split('\n').map((s) => s.trim());
  const out: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i] === label && MONEY_RE.test(lines[i + 1])) {
      out.push(parseCentsFromUsd(lines[i + 1]));
    }
  }
  return out;
};

/** The first money value (in cents) after `label`, or `null` if absent. */
export const valueAfterLabel = (text: string, label: string): number | null => {
  const all = valuesAfterLabel(text, label);
  return all.length ? all[0] : null;
};

/** Split the whole panel text into its five section slices. */
export const splitSections = (panelText: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (let i = 0; i < DETAIL_SECTIONS.length; i++) {
    out[DETAIL_SECTIONS[i]] = sectionSlice(panelText, DETAIL_SECTIONS[i], DETAIL_SECTIONS[i + 1]);
  }
  return out;
};
