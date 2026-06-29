/**
 * Per-shop (merchant) configuration for the Income Summary pipeline. Each shop
 * has its own seed data (staff / orders / products) and may have its own owner
 * passcode. The pipeline auto-detects the active merchant id via
 * `merchantSettingList`, then looks up its passcode here.
 *
 * Override at runtime with `OWNER_PASSCODE=xxxx` (wins over this map) — handy
 * when logging into a shop whose passcode isn't listed yet.
 */
export const SHOP_PASSCODES: Record<string, string> = {
  '14': '8888', // Volt POS 14 Dev
  '12': '8888', // Volt POS 12 — update if its owner passcode differs
};

/** Default owner passcode when a shop isn't in the map. */
export const DEFAULT_OWNER_PASSCODE = '8888';

/** Resolve the owner passcode for a shop: env override → map → default. */
export const shopPasscode = (shopId: string): string =>
  process.env.OWNER_PASSCODE ?? SHOP_PASSCODES[shopId] ?? DEFAULT_OWNER_PASSCODE;

/**
 * Per-shop IANA timezone. Each merchant keeps its own books in its LOCAL
 * timezone, so the report's day boundaries (and the browser's "Today") must use
 * that shop's zone — not a single hard-coded one. The browser `timezoneId` and
 * the report date math both flow from here so they can never disagree.
 *
 * Use an IANA name (DST-aware), e.g. `America/Chicago` for US Central (UTC-6/-5).
 */
export const SHOP_TIMEZONES: Record<string, string> = {
  '14': 'Asia/Ho_Chi_Minh', // Volt POS 14 Dev (UTC+7)
  '12': 'America/Chicago', // Volt POS 12 — US Central (UTC-6)
};

/** Default timezone when a shop isn't in the map. */
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Resolve a shop's timezone: `TZ_ID` env override → map → default. */
export const shopTimezone = (shopId?: string): string =>
  process.env.TZ_ID ?? (shopId ? SHOP_TIMEZONES[shopId] : undefined) ?? DEFAULT_TIMEZONE;
