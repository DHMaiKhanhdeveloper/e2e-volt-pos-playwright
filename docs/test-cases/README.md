# Test Cases

Nơi lưu trữ các file test case (Markdown) đã được QA review và đối chiếu với source code Volt POS.

## Quy ước

- 1 task / feature = 1 file
- Tên file: `<TICKET-ID>-<slug>.md` — vd `VP-1048-daily-sale-report-test-cases.md`
- Mỗi file dùng bảng Markdown với header cố định:
  `ID | PROGRAM | FEATURES | LINK | DESCRIPTION | PRE-CONDITION | TEST STEPS | DATA TEST | EXPECTED RESULT | ACTUAL RESULT | STATUS | NOTE`
- Khi bổ sung TC sau khi review code, thêm section `## Bổ sung sau review code` ở cuối file (không sửa TC gốc, đánh ID tiếp theo).
- Mỗi file có section `## Coverage map` mapping spec → TC ID để dễ audit.

## Workflow

1. **QA viết draft** từ spec (Linear / Confluence / chat).
2. **Đối chiếu với source code Volt POS** (`D:\Project\Volt-pos-main\volt-pos\src\routes\...`) — tìm behavior code có mà spec không nói.
3. **Bổ sung TC** vào section "Bổ sung sau review code".
4. **Sync với QA team** — file gốc nằm ở `D:\Project\POS\volt-pos-test\volt-qc\`; bản trong repo này là **mirror** để dev/QA tra cứu nhanh khi viết test automation.
5. **Khi implement test Playwright** — tham chiếu TC ID trong tên test:
   ```ts
   test("TC-19 | Income Detail: Sale/Tip/Tax/Total Payment", async ({ page }) => { ... })
   ```

## File hiện có

### 📊 Income Reports (tổng hợp) → [income-reports/](./income-reports/)

3 báo cáo doanh thu dùng chung nguồn dữ liệu, gom trong [income-reports/](./income-reports/) (có [index tổng hợp](./income-reports/README.md) + đối chiếu chéo):

| File                                                                                                | Ticket  | Trang                        | Số TC |
| --------------------------------------------------------------------------------------------------- | ------- | ---------------------------- | ----- |
| [VP-1048-daily-sale-report-test-cases.md](./income-reports/VP-1048-daily-sale-report-test-cases.md) | VP-1048 | Daily Sale Report            | 44    |
| [VP-1048-income-summary.md](./income-reports/VP-1048-income-summary.md)                             | VP-1048 | Income Summary               | 73    |
| [VP-1402-staff-income.md](./income-reports/VP-1402-staff-income.md)                                 | VP-1402 | Staff Income & Staff Payroll | 80    |
