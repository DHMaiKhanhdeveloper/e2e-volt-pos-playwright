# Income Reports — Test Cases (tổng hợp)

Bộ test case **tổng hợp 3 màn báo cáo doanh thu** của Volt POS. Cả ba dùng chung
nguồn dữ liệu GraphQL (`reportStoreDailyIncomeList` / `storeDailyIncomeLive`) nên
được gom về một chỗ để dễ đối chiếu chéo.

| #   | Tính năng                  | Route                     | Test case                                                                            | Số TC |
| --- | -------------------------- | ------------------------- | ------------------------------------------------------------------------------------ | ----- |
| 1   | **Daily Sale Report**      | `/incomes/income-daily`   | [VP-1048-daily-sale-report-test-cases.md](./VP-1048-daily-sale-report-test-cases.md) | 44    |
| 2   | **Income Summary**         | `/incomes/income-summary` | [VP-1048-income-summary.md](./VP-1048-income-summary.md)                             | 73    |
| 3   | **Staff Income & Payroll** | `/incomes/income-staff`   | [VP-1402-staff-income.md](./VP-1402-staff-income.md)                                 | 80    |

> Tổng: **~197 test case** cho cụm Income.

## Quan hệ giữa 3 báo cáo

```
                ┌─────────────────────── Income Summary ───────────────────────┐
                │  Payment Details · Sale Details · Supply Fee ·                │
                │  Staff Payout ───────────────┐   Salon Earnings              │
                └──────────────────────────────┼───────────────────────────────┘
                          ▲                     │ (per-staff payout)
                          │ (cùng ngày, cùng số) ▼
   Daily Sale Report ─────┘            Staff Income & Payroll
   (1 ngày: Income/Payment Detail)     (per-staff: Commission/Salary, chốt lương)
```

- **Daily Sale Report** — chi tiết **một ngày** (Income Detail + Payment Detail + bảng order). Là "lát cắt 1 ngày" của cùng dữ liệu Income Summary dùng.
- **Income Summary** — tổng hợp **theo khoảng thời gian** (Day/Week/Month) + panel chi tiết 5 khối; khối **Staff Payout** là phần per-staff cộng dồn.
- **Staff Income & Payroll** — bóc tách **theo từng nhân viên** (dự trù) và **chốt lương** (Payroll). Khối Staff Payout trong Income Summary = tổng của các staff ở đây.

## Đối chiếu chéo (cross-report invariants)

- Cùng một ngày: **Sale / Tax / Refund / Total Payment** phải khớp giữa Daily Sale Report và Income Summary (DSR ↔ IS).
- Income Summary **Staff Payout total** = Σ payout của các nhân viên trong Staff Income (cùng kỳ, settled).
- Tiền lưu **integer cents** ở mọi nơi; cho phép **số âm** (ngày lỗ / refund lớn).

## Liên kết nhanh

- **API reference (GraphQL):** [../../api/README.md](../../api/README.md) — query/field của Daily Sale Report & Income Summary.
- **Test tự động (Playwright):**
  - Daily Sale Report: `tests/regression/incomes/daily-sale-report/` + `tests/api/daily-sale-report.api.spec.ts`
  - Income Summary: `tests/regression/incomes/income-summary/` + `tests/api/income-summary.api.spec.ts`
- **Quy ước & workflow viết test case:** [../README.md](../README.md)

## Lưu ý chung khi viết/chạy test

- **Timezone merchant** (Asia/Ho_Chi_Minh, UTC+7): ngày được gom theo giờ merchant, không theo giờ máy chạy.
- **Live vs Settled:** hôm nay đọc bản _live_ (chưa chốt, tax gộp vào Sale, chưa tách per-order); ngày quá khứ đọc bản _settled_ (đầy đủ, bất biến) → các test công thức nên dùng ngày settled.
- Nhãn so sánh "% vs …" phụ thuộc **preset** đang chọn (xem VP-1048-income-summary).
