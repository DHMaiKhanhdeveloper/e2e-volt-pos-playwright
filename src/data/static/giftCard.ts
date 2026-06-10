/**
 * Funded gift card available in the Volt POS dev environment, used to drive
 * a real Gift Card *redemption* through the checkout UI (see TC-24).
 *
 * The card carries a large standing balance so redemptions in the e2e suite
 * never drain it. Update the code here if the seed gift card changes.
 */
export const GIFT_CARD = {
  /** 15-digit gift card number entered via "Input Gift Card Code". */
  code: '888896682024616',
} as const;
