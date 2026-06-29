---
title: Portal Order History
linearId: 09314f50-bf15-4369-ac55-3f8a37c2e830
url: https://linear.app/fastboy/document/portal-order-history-ba2903a15df5
team: VOLT
updatedAt: 2026-06-11T09:59:29.753Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# Portal Order History — Backend Business Rules

**Audience:** Backend team. **Purpose:** Business rules, action conditions, validation logic, and data flows. Backend team decides API/database design.

## 1. Order Status Display

| Status | Settled? | Display label |
| -- | -- | -- |
| `successful` | `false` | Successful - Unsettled |
| `successful` | `true` | Successful - Settled |
| `canceled` | — | Canceled |
| `canceling` | — | Canceling |
| `cancel_issue` | — | Cancel Issue |
| `refunded` | — | Refunded |
| `partial_refunded` | — | Partial Refunded |
| `refund_issue` | — | Refund Issue |
| `refunding` | — | Refunding |
| `re_open` | — | Re-opened |

**Default filter:** Exclude `pending` orders from the list.

## 2. Settled vs. Unsettled — The Critical Distinction

The `settled` flag controls which actions are available. This is a **payment processor constraint**, not just a business rule.

|  | Unsettled (`settled = false`) | Settled (`settled = true`) |
| -- | -- | -- |
| **Meaning** | Card batch still open | Card batch closed |
| **Cancel/Void** | Yes | No |
| **Reopen** | Yes | No |
| **Adjust Tip** | Yes (with conditions) | No |
| **Refund (full)** | No | Yes (with conditions) |
| **Refund (partial)** | No | Yes (with conditions) |
| **Send Receipt** | Yes | Yes |

The portal does NOT control when batches close — this happens automatically (typically daily at `merchant_setting.batch_close_time`).

## 3. Order Status Lifecycle

### Transition rules

| From | To | Trigger |
| -- | -- | -- |
| `pending` | `successful` | Payment completed |
| `successful` (unsettled) | `canceling` | Cancel initiated |
| `successful` (settled) | `refunding` | Refund initiated |
| `successful` (unsettled) | `re_open` | Reopen initiated |
| `canceling` | `canceled` | Cancel succeeded |
| `canceling` | `cancel_issue` | Cancel failed |
| `cancel_issue` | `canceling` | User retries cancel |
| `refunding` | `refunded` | Full refund succeeded |
| `refunding` | `partial_refunded` | Partial refund succeeded |
| `refunding` | `refund_issue` | Refund failed |
| `partial_refunded` | `refunding` | Another refund initiated |
| `re_open` | `successful` | Re-checkout completed |
| `re_open` | `canceling` | User cancels reopened order |

**Transitional state blocking:** When an order is in `refunding` or `canceling`, all actions must be blocked.

## 4. Action Conditions & Flows

### 4.1 Full Refund — all conditions true:
1. Order `settled = true`
2. Order `status` is `successful` or `partial_refunded`
3. Order has at least one non-gift-card payment
4. Order is NOT in a transitional state (`refunding`, `canceling`)
5. User has `refund` permission

Required input: Reason. On execution: status → `refunding`; a refund transaction created for each original sale (linked via `reference_id`); card → process through gateway; cash/gift card/other → record; each refund amount = original sale amount (excluding tip for card); update `refunded_amount` on items & tip shares; Success → `refunded`; Failure → `refund_issue` (no auto-retry).

### 4.2 Partial Refund — all conditions true:
1. `settled = true`
2. status `successful` or `partial_refunded`
3. selected transaction exists on this order
4. transaction has remaining refund balance > 0
5. if card payment: card batch closed (`batch_closed_at` not null)
6. refund amount > 0
7. refund amount <= remaining balance
8. NOT in transitional state
9. user has `refund` permission

Required: Transaction ID, refund amount (integer cents). Reason optional.

Remaining balance: Card → `remaining = original_amount - original_tip - SUM(previous refunds)`; Cash/gift card/other → `remaining = original_amount - SUM(previous refunds)`. "Previous refunds" = transactions where `reference_id` points to target and `transaction_type = 'refund'`.

Condition 5 error: "The transaction batch is not closed. Refund not available until batch is closed." On execution: status → `refunding`; single refund transaction linked via `reference_id`; Success → `partial_refunded`; Failure → `refund_issue`. A `partial_refunded` order can be refunded again.

### 4.3 Cancel / Void — all conditions true:
1. `settled = false`
2. status `successful`, `pending`, `partial_refunded`, or `cancel_issue`
3. NOT in transitional state (except `cancel_issue` allows retry)
4. user has `cancel_order_void` permission

Required: Reason. On execution: status → `canceling`; all sale transactions voided (new void transaction each, linked via `reference_id`); card → process void through gateway; Success → `canceled`; Failure → `cancel_issue`.

Cancel/void = unsettled orders; Refund = settled orders (payment processor constraint). `cancel_issue` can be retried from portal; `refund_issue` cannot (requires manual resolution).

### 4.4 Reopen Order — all conditions true:
1. `settled = false`
2. status `successful` or `re_open`
3. user has `edit_order` permission

If already `re_open`, button label = "Continue Re-open". On execution: status → `re_open`; edit mode (add/remove/modify line items, adjust order-level amounts, update notes); stays `re_open` until payment reprocessed → back to `successful`.

### 4.5 Adjust Tip — all conditions true:
1. `settled = false`
2. status `successful`
3. merchant tip timing = `AFTER_PAYMENT`
4. order has at least one assigned staff
5. user has `adjust_tip` permission

Required: Transaction ID, new tip amount, split tip auto converts to `evenly`. On execution: update transaction tip; recalc order `tip_amount`; update tip share records (Evenly / Proportional / Manual); update `tip_split_method`.

### 4.6 Send Receipt — any order, any status, `view_orders` permission. Input: delivery method (`email`/`sms`) + recipient. Validate email format / phone (10+ digits). Pre-fill with customer's email/phone.

### 4.7 Export — order list view, `export_orders` permission. Input: current filter + format (`csv`/`pdf`). Columns: Order Code, Date/Time, Location, Status, Total, Tip, Payment Method(s), Staff Name(s), Customer Name.

## 5. Reasons

| Value | Display label |
| -- | -- |
| `customer_request` | Customer Request |
| `service_issue` | Service Issue |
| `incorrect_order` | Incorrect Order |
| `duplicate_payment` | Duplicate Payment |
| `promotion_discount_error` | Promotion/Discount Error |
| `staff_mistake` | Staff Mistake |
| `other` | Other |

Required for: Full refund, Cancel/void. Optional for: Partial refund.

## 6. Permission Matrix

| Action | Permission key |
| -- | -- |
| View order list & detail | `view_orders` |
| Full refund | `refund` |
| Partial refund | `refund` |
| Cancel/void | `cancel_order_void` |
| Reopen order | `edit_order` |
| Adjust tip | `adjust_tip` |
| Send receipt | `view_orders` |
| Export orders | `export_orders` |

If the user lacks a permission, the action button is hidden.

## 7. Multi-Location

* Portal user can access multiple store locations. Default view: all orders across accessible locations. Location filter narrows to a specific store. Each order belongs to exactly one location. Order from inaccessible location → treat as not found.

## 8. Order List Filters & Search

| Filter | Behavior |
| -- | -- |
| Search by order code | Partial match, case-insensitive |
| Search by customer | Match on customer name, phone, or email |
| Location | Single-select from user's accessible locations |
| Status | Multi-select. Settled and Unsettled are separate options |
| Payment method | Multi-select: Card, Cash, Gift Card, Other |
| Staff | Multi-select: orders where any item assigned to selected staff |
| Date range | Today, Yesterday, Last 7 days, Last 30 days, This month, custom |
| Sort by | Created date (default) or Updated date, asc/desc |

Pagination: 20 orders per page. Default sort: newest first by created date.

## 9. Issue Status Handling

| Status | Can retry from portal? | Resolution |
| -- | -- | -- |
| `cancel_issue` | Yes — goes back to `canceling` | Portal retry or manual |
| `refund_issue` | No | Manual via support or POS device |

## 10. Audit Log

New for the portal (POS does not have an audit log). Every action logged with: What, Who (staff/portal user/"System"), Where (`pos`/`portal`), When, Context.

Actions to log: `created`, `payment_completed`, `settled`, `refund_initiated`, `refund_completed`, `refund_failed`, `partial_refund_completed`, `cancel_initiated`, `cancel_completed`, `cancel_failed`, `reopened`, `order_updated`, `tip_adjusted`, `receipt_sent`. Displayed chronologically (oldest first) in order detail.

## 11. Transaction Reference Chain

Refund/void creates new transaction: `transaction_type` (`refund`/`void`), `reference_id` (→ original `sale`). Enables tracking which payment refunded/voided, remaining balance per transaction, grouping in detail view.

## 12. Money Rules

All amounts stored as integer cents (e.g. $50.00 = `5000`); never floating point; currency code accompanies all amounts; frontend displays using `money()` helper.

## 13. Tip Split Methods

| Method | Calculation |
| -- | -- |
| Evenly | Equal share to all staff on order |
| Proportional | `staff_final_price / order_subtotal` |
| Manual | Specific amounts per staff |

## 14. POS Parity Notes

1. Same data shape (refund/cancel identical whether from POS or portal).
2. Status values are exact lowercase strings.
3. Settled flag set `true` when card batch closes (payment processor op).
4. Tip adjustments update transaction's `tip`, order's `tip_amount`, and `order_tip_share` — same as POS.

## 15. Summary of Action Eligibility (Quick Reference)

| Action | Settled? | Allowed statuses | Extra conditions |
| -- | -- | -- | -- |
| Refund (full) | Yes | `successful`, `partial_refunded` | Not gift-card-only |
| Refund (partial) | Yes | `successful`, `partial_refunded` | Transaction has remaining balance; card batch closed |
| Cancel/Void | No | `successful`, `pending`, `partial_refunded`, `cancel_issue` | — |
| Reopen | No | `successful`, `re_open` | — |
| Adjust Tip | No | `successful` | Tip timing = AFTER_PAYMENT; has staff |
| Send Receipt | Any | Any | Valid email or phone |
| Export | Any | Any | — |

---

*Source: Google Docs — "Portal Order History" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
