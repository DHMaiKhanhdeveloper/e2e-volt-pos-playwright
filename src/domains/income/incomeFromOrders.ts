/**
 * Derive the Daily Sale Report's Income Details totals from its per-order rows.
 *
 * The orders table and the Income Details panel are two views of the same data:
 * the panel is just the column-wise sum of every order row. These pure helpers
 * let a test rebuild the panel from the rows and assert the two agree — and the
 * same `computeIncomeFromOrders` works on rows scraped from the UI or loaded
 * from a saved JSON snapshot (both are `OrderMoneyRow[]`).
 *
 * All amounts are integer cents; negative = refund.
 */

/** One order row's four money columns, in cents. */
export interface OrderMoneyRow {
  orderCode: string;
  saleCents: number;
  tipCents: number;
  taxCents: number;
  totalCents: number;
}

/** The Income Summary figures derivable from a set of order rows. */
export interface IncomeFromOrders {
  orderCountTotal: number;
  /** Rows whose Total is positive (a net sale). */
  saleOrderCount: number;
  /** Rows whose Total is negative (a net refund). */
  refundOrderCount: number;
  /** Σ of the positive sale amounts only. */
  grossSaleCents: number;
  /** Σ of the negative sale amounts only (≤ 0). */
  refundSaleCents: number;
  /** Net Sale = gross + refund = Σ saleCents. */
  netSaleCents: number;
  tipCents: number;
  taxCents: number;
  /** Total Payment = netSale + tip + tax. */
  totalPaymentCents: number;
}

/**
 * Sum order rows into the Income Details totals.
 *
 * `totalPaymentCents` is recomputed as `netSale + tip + tax` rather than summed
 * from each row's Total column, so it stands as an independent check of the
 * per-row `Total = Sale + Tip + Tax` identity.
 */
export const computeIncomeFromOrders = (orders: OrderMoneyRow[]): IncomeFromOrders => {
  const sum = (pick: (o: OrderMoneyRow) => number): number =>
    orders.reduce((acc, o) => acc + pick(o), 0);

  const netSaleCents = sum((o) => o.saleCents);
  const tipCents = sum((o) => o.tipCents);
  const taxCents = sum((o) => o.taxCents);

  return {
    orderCountTotal: orders.length,
    saleOrderCount: orders.filter((o) => o.totalCents > 0).length,
    refundOrderCount: orders.filter((o) => o.totalCents < 0).length,
    grossSaleCents: sum((o) => (o.saleCents > 0 ? o.saleCents : 0)),
    refundSaleCents: sum((o) => (o.saleCents < 0 ? o.saleCents : 0)),
    netSaleCents,
    tipCents,
    taxCents,
    totalPaymentCents: netSaleCents + tipCents + taxCents,
  };
};
