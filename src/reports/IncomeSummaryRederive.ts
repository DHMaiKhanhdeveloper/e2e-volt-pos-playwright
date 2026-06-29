import type { VoltPosDb } from '@db/VoltPosDb';
import { computeIncomeSummary, type StaffInput } from './incomeCalcCore';

/**
 * "Cách 2" — RE-DERIVE the Income Summary Staff Payout & Salon Earnings sections
 * from raw tables, ported faithfully from `volt-pos/.dbwork/report-tool.cjs`
 * (which itself ports the backend `report.rs`). Uses the per-staff loop with the
 * HISTORICAL `%service` snapshot (frozen in `report_staff_daily_income.compensation`),
 * which is the correct basis for a settled day.
 *
 * All money values are integer cents. The merchant timezone is UTC+7.
 */

export interface StaffPayoutRow {
  staffId: string;
  name: string;
  percentService: number;
  compType: string;
  serviceNet: number;
  supplyNet: number;
  commission: number;
  supplyShare: number;
  salonCommission: number;
  tip: number;
  cleanUp: number;
  cardFee: number;
  salary: number;
  total: number;
  pay1: number;
  pay2: number;
}

export interface RederivedIncomeSummary {
  date: string;
  // Sale side (needed for salon net / total service)
  serviceSale: number;
  serviceRefund: number;
  productSale: number;
  productRefund: number;
  giftCardSale: number;
  totalDiscount: number;
  totalService: number;
  // Supply fee
  supplyTotal: number;
  staffSupplyShare: number;
  salonSupplyShare: number;
  // Staff Payout (store rollup = Σ per-staff)
  commission: number;
  payoutTip: number;
  cleanUp: number;
  cardCharge: number;
  salary: number;
  payoutTotal: number;
  pay1: number;
  pay2: number;
  // Salon Earnings
  salonCommission: number;
  netEarnings: number;
  totalEarning: number;
  // Per-staff breakdown (for debugging / detailed assertions)
  staff: StaffPayoutRow[];
}

interface CompRow {
  id: string;
  t: string;
  ps: number;
  p1: number;
  cc: number;
  ded: number;
  sal: number;
  ss: string;
  ept: number;
}

const TZ = '+7 hours';

export function rederiveIncomeSummary(db: VoltPosDb, date: string): RederivedIncomeSummary {
  // ---- transaction-validity predicates (port of report.rs SALE_TX / REFUND_TX) ----
  const SALE_TX = `EXISTS(SELECT 1 FROM order_transaction ot LEFT JOIN "transaction" t ON ot.payment_type='card' AND t.id=ot.id
    WHERE ot.order_id=o.id AND ot.transaction_type='sale'
    AND NOT EXISTS(SELECT 1 FROM order_transaction ov LEFT JOIN "transaction" tv ON ov.payment_type='card' AND tv.id=ov.id
      WHERE ov.reference_id=ot.id AND ov.transaction_type='void' AND (ov.payment_type!='card' OR tv.status IS NULL OR tv.status!='failed'))
    AND (ot.payment_type!='card' OR t.status IN ('authorized','sale')))`;
  const REFUND_TX = `EXISTS(SELECT 1 FROM order_transaction ot LEFT JOIN "transaction" t ON ot.payment_type='card' AND t.id=ot.id
    WHERE ot.order_id=o.id AND ot.transaction_type='refund' AND (ot.payment_type!='card' OR t.status='refunded'))`;
  const dayO = `date(COALESCE(o.completed_at,o.created_at),'${TZ}')='${date}'`;
  const dayIt = `date(oi.created_at,'${TZ}')='${date}'`;
  // Sale counts by ITEM-creation day, refund by refund-row day (report.rs rule).
  const ACTIVE = `(date(oi.created_at,'${TZ}')='${date}' AND oi.refunded_amount IS NULL)`;
  const num = (v: unknown): number => Number(v ?? 0);

  // ---- Sale Details: service / product / gift-card sale + refunds ----
  const sps = db.one<{ svc: number; prd: number; gc: number }>(`SELECT
    COALESCE(SUM(CASE WHEN LOWER(oi.type)='service' THEN oi.final_price ELSE 0 END),0) svc,
    COALESCE(SUM(CASE WHEN LOWER(oi.type)='product' AND oi.gift_card_id IS NULL THEN oi.final_price ELSE 0 END),0) prd,
    COALESCE(SUM(CASE WHEN LOWER(oi.type)='product' AND oi.gift_card_id IS NOT NULL THEN oi.final_price ELSE 0 END),0) gc
   FROM order_item oi JOIN "order" o ON o.id=oi.order_id
   WHERE ${ACTIVE} AND ${dayO} AND ${SALE_TX}`);
  const spr = db.one<{ svc: number; prd: number }>(`SELECT
    COALESCE(SUM(CASE WHEN LOWER(oi.type)='service' THEN COALESCE(oi.refunded_amount,0)-COALESCE(oi.tax_amount,0) ELSE 0 END),0) svc,
    COALESCE(SUM(CASE WHEN LOWER(oi.type)='product' THEN COALESCE(oi.refunded_amount,0)-COALESCE(oi.tax_amount,0) ELSE 0 END),0) prd
   FROM order_item oi JOIN "order" o ON o.id=oi.order_id
   WHERE (o.status='refunded' OR o.status='partial_refunded') AND oi.status IS NULL AND oi.refunded_amount IS NOT NULL AND ${dayIt} AND ${REFUND_TX}`);
  const serviceSale = num(sps.svc);
  const productSale = num(sps.prd);
  const giftCardSale = num(sps.gc);
  const serviceRefund = num(spr.svc);
  const productRefund = num(spr.prd);

  // ---- Supply total (plain Σ, sale − refund) ----
  const supSale = db.one<{ v: number }>(`SELECT COALESCE(SUM(COALESCE(oi.supply_fee,0)),0) v
    FROM order_item oi JOIN "order" o ON o.id=oi.order_id
    WHERE LOWER(oi.type)='service' AND oi.service_id IS NOT NULL AND ${ACTIVE} AND ${dayO} AND ${SALE_TX}`);
  const supRefund = db.one<{ v: number }>(`SELECT COALESCE(SUM(COALESCE(oi.supply_fee,0)),0) v
    FROM order_item oi JOIN "order" o ON o.id=oi.order_id
    WHERE LOWER(oi.type)='service' AND oi.service_id IS NOT NULL AND (o.status='refunded' OR o.status='partial_refunded') AND COALESCE(oi.refunded_amount,0)>0 AND ${REFUND_TX} AND ${dayIt}`);
  const supplyTotal = num(supSale.v) - num(supRefund.v);

  // ---- Discount (sale orders) ----
  const totalDiscount = num(
    db.one<{ v: number }>(`SELECT COALESCE(SUM(o.total_discount),0) v FROM "order" o WHERE ${dayO} AND ${SALE_TX}`).v,
  );

  // ---- compensation: current + historical snapshot (frozen %service for the day) ----
  const compFull: Record<string, CompRow> = {};
  for (const c of db.all<{ id: string; t: string; ps: number; p1: number; cc: number; ded: number; sal: number; ss: string; ept: number }>(
    `SELECT id, compensation_type t, COALESCE(percent_service_staff,0) ps, COALESCE(cash_check_split,0) p1,
      COALESCE(percent_staff_commission,0) cc, COALESCE(deduction_per_day,0) ded, COALESCE(salary_amount,0) sal,
      COALESCE(salary_setting,'') ss, COALESCE(enable_payroll_tip,0) ept FROM compensation`,
  )) {
    compFull[c.id] = { id: c.id, t: c.t, ps: num(c.ps), p1: num(c.p1), cc: num(c.cc), ded: num(c.ded), sal: num(c.sal), ss: c.ss, ept: num(c.ept) };
  }
  const histComp: Record<string, CompRow> = {};
  for (const r of db.all<{ sid: string; compensation: string }>(
    `SELECT staff_id sid, compensation FROM report_staff_daily_income WHERE date=?`,
    [date],
  )) {
    try {
      const j = JSON.parse(r.compensation) as Record<string, unknown>;
      histComp[r.sid] = {
        id: r.sid,
        t: String(j.compensation_type ?? '-'),
        ps: Number(j.percent_service_staff ?? 0),
        p1: Number(j.cash_check_split ?? 0),
        cc: Number(j.percent_staff_commission ?? 0),
        ded: Number(j.deduction_per_day ?? 0),
        sal: Number(j.salary_amount ?? 0),
        ss: String(j.salary_setting ?? ''),
        ept: j.enable_payroll_tip ? 1 : 0,
      };
    } catch {
      /* skip malformed snapshot */
    }
  }
  const compOf = (sid: string): CompRow =>
    histComp[sid] ?? compFull[sid] ?? { id: sid, t: '-', ps: 0, p1: 0, cc: 0, ded: 0, sal: 0, ss: '', ept: 0 };

  // ---- time_keeping minutes per staff ----
  const wmMap: Record<string, number> = {};
  for (const r of db.all<{ sid: string; wm: number }>(
    `SELECT tk.staff_id sid, COALESCE(SUM(CASE WHEN tk.check_in_at IS NOT NULL AND tk.check_out_at IS NOT NULL THEN MAX(0,CAST(ROUND((julianday(tk.check_out_at)-julianday(tk.check_in_at))*1440) AS INTEGER)) ELSE 0 END),0) wm
     FROM time_keeping tk WHERE tk.staff_id IS NOT NULL AND date(tk.check_in_at,'${TZ}')='${date}' GROUP BY tk.staff_id`,
  )) {
    wmMap[r.sid] = num(r.wm);
  }

  // ---- card-fee base per staff (service net on card-paid orders) ----
  const cardBaseMap: Record<string, number> = {};
  for (const r of db.all<{ sid: string; base: number }>(
    `WITH son AS (SELECT oi.staff_id sid, oi.order_id oid, COALESCE(SUM(CASE WHEN oi.refunded_amount IS NULL THEN oi.final_price-CASE WHEN oi.service_id IS NOT NULL THEN COALESCE(oi.supply_fee,0) ELSE 0 END ELSE -COALESCE(oi.refunded_amount,0)+CASE WHEN oi.service_id IS NOT NULL THEN COALESCE(oi.supply_fee,0) ELSE 0 END END),0) base
       FROM order_item oi JOIN "order" o ON oi.order_id=o.id WHERE oi.staff_id IS NOT NULL AND LOWER(oi.type)='service'
       AND ((oi.refunded_amount IS NULL AND ${dayO} AND ${SALE_TX}) OR (oi.refunded_amount IS NOT NULL AND ${dayIt} AND ${REFUND_TX})) GROUP BY oi.staff_id, oi.order_id),
     op AS (SELECT ot.order_id oid, MAX(CASE WHEN ot.payment_type='card' AND ot.transaction_type='sale' AND t.status IN('authorized','sale') AND NOT EXISTS(SELECT 1 FROM order_transaction ov LEFT JOIN "transaction" tv ON ov.payment_type='card' AND tv.id=ov.id WHERE ov.reference_id=ot.id AND ov.transaction_type='void' AND (ov.payment_type!='card' OR tv.status IS NULL OR tv.status!='failed')) THEN 1 ELSE 0 END) isc
       FROM order_transaction ot LEFT JOIN "transaction" t ON ot.payment_type='card' AND t.id=ot.id WHERE ot.order_id IN (SELECT oid FROM son) GROUP BY ot.order_id)
     SELECT son.sid sid, COALESCE(SUM(CASE WHEN op.isc=1 THEN son.base ELSE 0 END),0) base FROM son JOIN op ON op.oid=son.oid GROUP BY son.sid`,
  )) {
    cardBaseMap[r.sid] = num(r.base);
  }

  // ---- tip share per staff ----
  const tipMap: Record<string, number> = {};
  for (const r of db.all<{ sid: string; tip: number }>(
    `SELECT ots.staff_id sid, COALESCE(SUM(COALESCE(ots.amount,0)-COALESCE(ots.refunded_amount,0)),0) tip
     FROM order_tip_share ots JOIN "order" o ON ots.order_id=o.id
     WHERE date(COALESCE(o.completed_at,o.created_at),'${TZ}')='${date}' AND LOWER(o.status) NOT IN('canceled','canceling','cancel_issue') GROUP BY ots.staff_id`,
  )) {
    tipMap[r.sid] = num(r.tip);
  }

  // ---- payroll period (proration + finalized salary) ----
  const period = db.one<{ id: string; locked_at: string | null; start_date: string; end_date: string }>(
    `SELECT id, locked_at, start_date, end_date FROM payroll_period WHERE start_date<=? AND end_date>=? ORDER BY start_date DESC LIMIT 1`,
    [date, date],
  );
  const finalized = !!(period && period.locked_at);
  const dayCount = (s: string, e: string): number => {
    const d = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1;
    return d > 0 ? d : 0;
  };
  const sched = db.one<{ s: string; e: string }>(
    `SELECT start_date s, end_date e FROM payroll_period WHERE status='scheduled' AND start_date<=? AND end_date>=? ORDER BY start_date DESC LIMIT 1`,
    [date, date],
  );
  const periodDays = sched ? dayCount(sched.s, sched.e) : period ? dayCount(period.start_date, period.end_date) : 0;
  const finPay: Record<string, { sal: number; wd: number }> = {};
  if (finalized && period) {
    for (const r of db.all<{ sid: string; sal: number; wd: number }>(
      `SELECT staff_id sid, COALESCE(salary,0) sal, COALESCE(work_days,0) wd FROM staff_payroll WHERE period_id=?`,
      [period.id],
    )) {
      finPay[r.sid] = { sal: num(r.sal), wd: num(r.wd) };
    }
  }
  // ---- staff universe: service-active ∪ checked-in ∪ salaried ----
  const SM: Record<string, { name: string; svc: number; sup: number }> = {};
  const getSM = (sid: string): { name: string; svc: number; sup: number } =>
    (SM[sid] = SM[sid] ?? { name: sid, svc: 0, sup: 0 });
  for (const r of db.all<{ sid: string; name: string; svc: number; sup: number }>(
    `SELECT oi.staff_id sid, MAX(oi.staff_name) name, SUM(oi.final_price) svc, SUM(COALESCE(oi.supply_fee,0)) sup
     FROM order_item oi JOIN "order" o ON o.id=oi.order_id WHERE LOWER(oi.type)='service' AND ${ACTIVE} AND ${dayO} AND ${SALE_TX} GROUP BY oi.staff_id`,
  )) {
    const a = getSM(r.sid);
    a.name = r.name ?? r.sid;
    a.svc += num(r.svc);
    a.sup += num(r.sup);
  }
  for (const r of db.all<{ sid: string; svc: number; sup: number }>(
    `SELECT oi.staff_id sid, SUM(COALESCE(oi.refunded_amount,0)-COALESCE(oi.tax_amount,0)) svc, SUM(COALESCE(oi.supply_fee,0)) sup
     FROM order_item oi JOIN "order" o ON o.id=oi.order_id WHERE (o.status='refunded' OR o.status='partial_refunded') AND LOWER(oi.type)='service' AND oi.refunded_amount IS NOT NULL AND ${dayIt} AND ${REFUND_TX} GROUP BY oi.staff_id`,
  )) {
    const a = getSM(r.sid);
    a.svc -= num(r.svc);
    a.sup -= num(r.sup);
  }
  for (const sid of Object.keys(wmMap)) getSM(sid);
  for (const sid of Object.keys(compFull)) {
    if (['salary', 'commission_salary'].includes(compFull[sid]?.t)) getSM(sid);
  }

  // ---- per-staff payout loop — delegated to the shared pure core ----
  // Map the SQLite-gathered rows into the source-agnostic StaffInput shape; the
  // UI pipeline builds the SAME shape from scraped data so both share one math.
  const staffInputs: StaffInput[] = Object.entries(SM).map(([sid, a]) => {
    const c = compOf(sid);
    const fin = finPay[sid];
    return {
      staffId: sid,
      name: a.name,
      serviceNet: a.svc,
      supplyNet: a.sup,
      tip: tipMap[sid] ?? 0,
      cardBase: cardBaseMap[sid] ?? 0,
      checkedIn: sid in wmMap,
      workedMinutes: wmMap[sid] ?? 0,
      comp: {
        compType: c.t,
        percentService: c.ps,
        pay1Split: c.p1,
        cardFeeCommissionPct: c.cc,
        deductionPerDay: c.ded,
        salaryAmount: c.sal,
        salarySetting: c.ss,
        enablePayrollTip: !!c.ept,
      },
      finalizedSalary: finalized && fin ? { salary: fin.sal, workDays: fin.wd } : undefined,
    };
  });

  const result = computeIncomeSummary(
    { serviceSale, serviceRefund, productSale, productRefund, giftCardSale, totalDiscount, supplyTotal },
    staffInputs,
    { periodDays, finalized },
  );

  return { date, ...result };
}
