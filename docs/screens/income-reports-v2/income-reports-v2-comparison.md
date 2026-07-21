# So sánh 3 cặp màn hình Report: V1 vs V2

> Quét trực tiếp bằng MCP Playwright trên app đang chạy tại `http://localhost:1420`, ngày dữ liệu **Jul 21, 2026** (shop timezone), sau khi nhập passcode `8888` để qua `PermissionProtectedRoute`.
>
> Route V1/V2 lấy từ sidebar thực tế của app (không phải suy đoán):
>
> - `/incomes/income-daily` ↔ `/incomes/income-daily-v2` — **Daily Sale Report**
> - `/incomes/income-summary` ↔ `/incomes/income-summary-v2` — **Income Summary**
> - `/incomes/income-staff` ↔ `/incomes/income-staff-v2` — **Staff Income**

## Kết luận nhanh

| Cặp màn hình            | Kết quả so sánh                                                           |
| ----------------------- | ------------------------------------------------------------------------- |
| Daily Sale Report vs V2 | **Giống hệt 100%** — cùng dữ liệu, cùng layout, chỉ khác tiêu đề "... V2" |
| Income Summary vs V2    | **Có sai lệch dữ liệu ở panel chi tiết** (xem mục "Bug tìm thấy")         |
| Staff Income vs V2      | **Giống hệt 100%** — cả layout salary-type lẫn commission-type đều khớp   |

---

## 1. Daily Sale Report (`income-daily`) vs Daily Sale Report V2 (`income-daily-v2`)

Cả 2 route trả về **cùng một bộ dữ liệu, cùng cấu trúc**, chỉ tiêu đề đổi từ "Daily Sale Report" → "Daily Sale Report V2".

### Cấu trúc màn hình (giống nhau ở cả 2 bản)

**A. 4 thẻ thống kê (stat cards) + so sánh vs Yesterday:**
| Field | Giá trị quét được | Mô tả (tooltip trong app) |
|---|---|---|
| Total Order | 7 (↑96% vs Yesterday) | Total number of order, excluding cancel/refunds/manual refunds |
| Sale | $471.50 (↑93% vs Yesterday) | Total sale amount of the order, including refund/partial refund values after discount is applied, excluding Tax and Tip |
| Total tip _(chú ý chữ thường "tip")_ | $72.00 (↑56% vs Yesterday) | Total tips received, not included in sales revenue but counted in collected amounts |
| Total Payment | $543.50 (↑92% vs Yesterday) | The final revenue includes Gift Card Redemption |

**B. Chart "Sale"** — biểu đồ cột theo giờ trong ngày.

**C. Bảng danh sách Order (7 dòng, mỗi dòng click được → mở chi tiết order):**

| Order #           | Sale/Refund | Tip    | Tax   | Total (Sale+Tax+Tip) |
| ----------------- | ----------- | ------ | ----- | -------------------- |
| OD260721-25951760 | $140.00     | $20.00 | $0.00 | $160.00              |
| OD260721-26073632 | $140.00     | $20.00 | $0.00 | $160.00              |
| OD260721-26684906 | $140.00     | $20.00 | $0.00 | $160.00              |
| OD260721-27254727 | $60.50      | $5.00  | $0.00 | $65.50               |
| OD260721-27339767 | $22.00      | $8.00  | $0.00 | $30.00               |
| OD260720-30723448 | -$75.00     | -$1.00 | $0.00 | -$76.00              |
| OD260721-27797111 | $22.00      | $0.00  | $0.00 | $22.00               |
| OD260721-27815904 | $22.00      | $0.00  | $0.00 | $22.00               |

**D. Income Details:**

- Sale: $471.50
- Tip: $72.00
- Tax Collected _(Sales tax collected, adjusted for refunds)_: $0.00
- Total Payment: $543.50

**E. Payment Details:**

- Card: $139.50
- Cash: $404.00
- Others: $0.00
- Amount Collected: $543.50
- Gift Card Redemption: $0.00
- Total Payment: $543.50

### So sánh V1 vs V2

Tất cả field ở trên (A–E) **giống hệt nhau về giá trị** giữa 2 route. Không phát hiện khác biệt.

---

## 2. Income Summary (`income-summary`) vs Income Summary V2 (`income-summary-v2`)

### Cấu trúc màn hình (giống nhau ở cả 2 bản)

**A. Header:**

- "Total Income Jul 21, 2026": **$471.50** (↑689.38% vs. Same day last week)
- Legend: Gross Income / Net Income / Total tip
- Toggle Day / Week / Month + chart theo `groupBy`

**B. Bảng theo kỳ (Date/Sale/Tip/Tax/Total Payment):**
| Date | Sale | Tip | Tax | Total Payment |
|---|---|---|---|---|
| Jul 21 | $471.50 | $72.00 | $0.00 | $543.50 |

Click 1 dòng → mở panel chi tiết bên phải (`detailId` gắn vào URL).

**C. Panel chi tiết — Payment Details** _(giống nhau V1/V2)_:

- Cash: $404.00 → Sale $420.00, Refund -$75.00, Tip $59.00, Tax $0.00
- Card: $139.50 → Sale $126.50, Refund $0.00, Tip $13.00, Tax $0.00
- Others: $0.00 → Sale/Refund/Tip/Tax đều $0.00
- Amount Collected: $543.50
- Gift Card Redemption: $0.00 (Sale/Tip/Tax $0.00)
- Total Payment: $543.50

**D. Panel chi tiết — Sale Details** ⚠️ **KHÁC NHAU (xem bug bên dưới)**

**E. Panel chi tiết — Supply Fee** _(giống nhau V1/V2)_:

- Total supply fee: -$1.00
- Staff Supply Share: $0.00
- Salon Supply Share: -$1.00

**F. Panel chi tiết — Staff Payout** _(giống nhau V1/V2)_:

- Total Service: $471.50
- Staff Supply Share: $0.00
- Staff Commission: $95.00
- Tip: $59.00
- Clean Up Fee: $54.00
- Discount Charge: $0.00
- Card Charge Commission: $0.22
- Card Charge Tip: $0.00
- Staff Salary: $1,716.65
- **Total Staff Payout: $1,816.43** → Pay 1: $772.10 / Pay 2: $1,044.33

**G. Panel chi tiết — Salon Earnings** ⚠️ **KHÁC NHAU (xem bug bên dưới)**

### 🐛 Bug tìm thấy: Income Summary V2 — Sale Details & Salon Earnings sai lệch dữ liệu

Khi so sánh trực tiếp cùng 1 ngày (Jul 21, 2026), cùng dữ liệu nguồn, panel chi tiết ở V2 trả về **giá trị khác V1** cho các field bên dưới — trong khi V1 nội bộ tự nhất quán (breakdown cộng đúng bằng tổng).

**Sale Details:**
| Field | V1 (`income-summary`) | V2 (`income-summary-v2`) | Ghi chú |
|---|---|---|---|
| Total Sale (heading) | $546.50 | $546.50 | Giống nhau |
| Service Sale | **$546.50** | **$0.00** | ❌ V2 sai — Service+Product+GiftCard Sale ở V2 cộng lại = $0, không khớp Total Sale = $546.50 |
| Product Sale | $0.00 | $0.00 | Giống |
| Gift Card Sale | $0.00 | $0.00 | Giống |
| Total Refund (heading) | $75.00 | $75.00 | Giống nhau |
| Service Refund | **$75.00** | **$0.00** | ❌ V2 sai — Service+Product Refund ở V2 cộng lại = $0, không khớp Total Refund = $75.00 |
| Product Refund | $0.00 | $0.00 | Giống |
| Subtotal, Discount, Net Total, Tip, Tax Collected, Total Payment | Giống hệt | Giống hệt | Không đổi |

**Salon Earnings:**
| Field | V1 | V2 | Ghi chú |
|---|---|---|---|
| Total Service, Salon Supply Share, Salon Commission, Product Sale/Refund, Total Discount, Net Earnings, Staff Supply Share | Giống hệt | Giống hệt | Không đổi |
| Clean Up Fee | **$54.00** | **$0.00** | ❌ V2 thiếu Clean Up Fee |
| Discount Charge, Card Charge Commission, Card Charge Tip | Giống hệt | Giống hệt | Không đổi |
| Staff Salary | **$1,716.65** | **$0.00** | ❌ V2 thiếu Staff Salary |
| **Total Earnings** | **-$1,284.93** | **$377.72** | ❌ Lệch ~$1,662.65 do 2 field trên bị mất |

**Đề xuất kiểm tra code:** field `Service Sale`/`Service Refund` trong Sale Details và `Clean Up Fee`/`Staff Salary` trong Salon Earnings ở trang V2 (`/incomes/income-summary-v2`) có khả năng bind sai nguồn dữ liệu hoặc thiếu tính toán so với API/logic của V1.

---

## 3. Staff Income (`income-staff`) vs Staff Income V2 (`income-staff-v2`)

### Cấu trúc màn hình (giống nhau ở cả 2 bản)

**A. 6 thẻ thống kê tổng hợp toàn shop:**
| Field | Giá trị |
|---|---|
| Total staff | 9 |
| Total orders | 8 |
| Total subtotal | $471.50 |
| Total supply fee | -$1.00 |
| Total tip | $59.00 |
| Total staff income | $1,732.43 |

**B. Bảng danh sách staff (Name/Orders/Subtotal/Supply Fee/Tip/Total Income):**

| Staff    | Orders | Subtotal | Supply Fee | Tip    | Total Income |
| -------- | ------ | -------- | ---------- | ------ | ------------ |
| trinehhh | 1      | $140.00  | $0.00      | $20.00 | $20.00       |
| Val      | 3      | $104.50  | $0.00      | $0.00  | $0.00        |
| Mai      | 0      | $0.00    | $0.00      | $0.00  | $451.66      |
| Linda    | 1      | $140.00  | $0.00      | $20.00 | $20.00       |
| Kevin    | 1      | -$75.00  | -$1.00     | -$1.00 | $645.66      |
| Jackie   | 1      | $140.00  | $0.00      | $20.00 | $20.00       |
| Hugo     | 1      | $22.00   | $0.00      | $0.00  | $10.78       |
| Evon     | 0      | $0.00    | $0.00      | $0.00  | $221.33      |
| Annie    | 0      | $0.00    | $0.00      | $0.00  | $343.00      |

Click 1 staff → mở panel chi tiết bên phải (`staffId` gắn vào URL). Panel có **2 layout** tùy pay type của staff:

**C1. Layout "salary" (vd. Kevin — Salary by Period):**

- Bảng order riêng của staff: Order #, Sale/Refund, Tip
- Clock In: `-`, Clock Out: `-`, Working Days: 1
- Sale $0.00 / Refund -$75.00 / Subtotal -$75.00
- Salary Type: Salary by Period, Rate: $666.66
- Gross Income _(Fixed salary for this period)_: $666.66
- Clean Up Fee/Deduction: $20.00
- Tip: -$1.00
- Card Charge Tip: $0.00
- **Total Income** _(Gross Income − Clean Up Fee + Tip − Card Charge Tip)_: $645.66
- Pay 1 _(Gross Income × 50% − Clean Up Fee − Card Charge Tip)_: $313.33
- Pay 2 _(Gross Income × 50% + Tip)_: $332.33

**C2. Layout "commission" (vd. trinehhh):**

- Bảng order riêng: Order #, Sale/Refund, Supply, Tip
- Sale $140.00 / Refund $0.00 / Subtotal $140.00
- Supply Fee _(incl. Sale & Refund)_: $0.00
- Staff Commission _((Subtotal − Supply Fee) × Commission Rate)_: $0.00
- Commission Rate (07/21/2026): 0%
- Card Charge Commission: $0.00
- Clean Up Fee/Deduction: $0.00
- Discount Charge: $0.00
- Tip: $20.00
- Card Charge Tip: $0.00
- **Total Income** _(Staff Commission − Clean Up Fee + Tip − Card Charge Commission − Card Charge Tip − Discount Charge)_: $20.00
- Pay 1 _(Staff Commission × Pay 1 Rate − Clean Up Fee − Card Charge Commission − Card Charge Tip − Discount Charge)_, Pay 1 Rate 0%: $0.00
- Pay 2 _(Staff Commission × Pay 2 Rate + Tip)_, Pay 2 Rate 100%: $20.00

### So sánh V1 vs V2

Đã quét đối chiếu cả **layout salary (Kevin)** và **layout commission (trinehhh)** — tất cả field, công thức, giá trị **giống hệt nhau** giữa `income-staff` và `income-staff-v2`. Không phát hiện sai lệch.

---

## 4. Staff Income — Quét mở rộng 1 tháng, toàn bộ staff & pay-type

> Khoảng ngày dùng để quét: chọn preset **"This Month"** trong date-filter combobox trên `income-staff` → URL ra `?from=1782882000&to=1784696399`, hiển thị `07/01/2026 - 07/21/2026` (từ đầu tháng đến hôm nay, app không cho chọn hết tháng 7 vì chưa qua ngày 21). Đây là range 1 tháng (tính từ đầu tháng) theo đúng ý định của yêu cầu.

Ở khoảng ngày này, bảng danh sách staff hiển thị **15 staff** (nhiều hơn 9 staff của bản quét 1-ngày Jul 21 trước đó, vì có thêm staff không phát sinh order vào riêng ngày 21/07 nhưng có order trong các ngày khác của tháng): Wendy, Vincent, Val, trinehhh, Tony, Ryan, Mai, Linda, Kevin, Jackie, Hugo, Evon, Bob, Annie, Andy.

**Tổng shop (6 thẻ thống kê) tại `income-staff` với range tháng:**
| Field | Giá trị |
|---|---|
| Total staff | 15 |
| Total orders | 230 |
| Total subtotal | $10,302.40 |
| Total supply fee | $117.00 |
| Total tip | $624.66 |
| Total staff income | $17,174.90 |

### 4.1 Bảng phân loại pay-type của toàn bộ 15 staff

| Staff    | Orders (tháng) | Pay type   | Salary subtype       | Rate quét được                                  |
| -------- | -------------- | ---------- | -------------------- | ----------------------------------------------- |
| Wendy    | 1              | Salary     | **Wage Per Day**     | $150.00/ngày                                    |
| Vincent  | 0              | Commission | –                    | 60%                                             |
| Val      | 9              | Salary     | **Wage Per Day**     | $80.00/ngày                                     |
| trinehhh | 1              | Commission | –                    | 0% (theo tuần, xem 4.3)                         |
| Tony     | 8              | Salary     | **Wage Per Hour**    | $25.00/giờ                                      |
| Ryan     | 1              | Salary     | **Wage Per Hour**    | (không xem rate chi tiết, chỉ xác nhận subtype) |
| Mai      | 5              | Salary     | **Salary by Period** | (xem 4.3)                                       |
| Linda    | 4              | Salary     | **Wage Per Hour**    | (không xem rate chi tiết)                       |
| Kevin    | 186            | Salary     | **Salary by Period** | rate đổi theo tuần (xem 4.3)                    |
| Jackie   | 5              | Salary     | **Wage Per Day**     | (không xem rate chi tiết)                       |
| Hugo     | 3              | Commission | –                    | 50%                                             |
| Evon     | 1              | Salary     | **Salary by Period** | (không xem rate chi tiết)                       |
| Bob      | 4              | Commission | –                    | 60%                                             |
| Annie    | 0              | Salary     | **Salary by Period** | (không xem rate chi tiết)                       |
| Andy     | 2              | Salary     | **Wage Per Day**     | (không xem rate chi tiết)                       |

**Kết luận độ phủ salary subtype:** cả **3 subtype Salary** đúng như Staff Setting (Salary by Period, Wage Per Day, Wage Per Hour) đều **có mặt** trong dữ liệu thật, cùng dạng Commission — tổng cộng đủ **4 biến thể pay-type** cần kiểm tra:

- Commission: Vincent (60%), trinehhh (0%), Hugo (50%), Bob (60%)
- Salary by Period: Mai, Kevin, Evon, Annie
- Wage Per Day: Wendy, Val, Jackie, Andy
- Wage Per Hour: Tony, Ryan, Linda

### 4.2 Order-level detail cho staff nhiều order — Kevin (186 orders)

Khi mở panel chi tiết của Kevin (`staffId=019ef27b-c9e2-745d-92fc-6baec45fa02f`), bảng Order **render toàn bộ 186 order cùng lúc trong DOM** (không phân trang, không lazy-load/virtualization) — accessibility snapshot của panel này dài **~850 dòng YAML**. Vì vậy **không cần thao tác "scroll" thủ công để load thêm dữ liệu** — chỉ cần snapshot là thấy hết toàn bộ order ngay từ đầu. Một vài order mẫu (đầu bảng, mới nhất trước):

| Order #           | Sale/Refund | Tip    |
| ----------------- | ----------- | ------ |
| OD260720-30723448 | -$75.00     | -$1.00 |
| OD260720-30733093 | -$80.00     | -$1.00 |
| OD260720-30684380 | -$8.00      | -$1.00 |
| OD260720-30742856 | -$73.00     | -$1.00 |
| OD260720-30693721 | -$65.00     | (…)    |

**Tổng hợp Kevin (Salary by Period) cho cả tháng:**

- Clock In/Out: `-` / `-`, Working Days: 13
- Sale $6,656.00 / Refund -$301.00 / Subtotal $6,355.00
- Salary Type: Salary by Period, Rate hiển thị "-" ở dòng tổng (vì rate đổi theo từng kỳ lương, xem breakdown 4.3)
- Gross Income _(Fixed salary for this period)_: $4,666.66
- Clean Up Fee/Deduction: $260.00
- Tip: $277.50, Card Charge Tip: $50.00
- **Total Income**: $4,634.16 → Pay 1: $2,023.30 / Pay 2: $2,610.86

⚠️ **Sai lệch nhỏ tìm thấy:** bảng danh sách staff (tổng quan) hiển thị Total Income của Kevin là **$4,634.13**, nhưng panel chi tiết hiển thị **$4,634.16** — lệch **$0.03**. Đây là sai lệch làm tròn (rounding) giữa giá trị tổng hợp ở bảng danh sách và giá trị tính lại trong panel chi tiết, cần kiểm tra logic tổng hợp/làm tròn phía backend hoặc phía tổng hợp client.

### 4.3 Rate/Commission thay đổi theo tuần trong cùng 1 khoảng ngày — phát hiện kỹ thuật mới

Khi khoảng ngày quét trải dài nhiều tuần lương (payroll period), UI **tự chia nhỏ theo từng kỳ rate/commission đã áp dụng** thay vì chỉ hiển thị 1 giá trị duy nhất:

- **trinehhh (Commission)**: hiển thị 4 dòng `Commission Rate (07/01/2026 - 07/08/2026): 0%`, `(07/09/2026 - 07/13/2026): 0%`, `(07/14/2026 - 07/20/2026): 0%`, `(07/21/2026): 0%` — tương tự với `Pay 1 Rate`/`Pay 2 Rate` cũng tách theo từng kỳ đổi rate.
- **Vincent (Commission 60%)**: 4 kỳ đều 60%, Pay 1 Rate 30% / Pay 2 Rate 70% xuyên suốt — rate ổn định trong tháng.
- **Kevin (Salary by Period)**: dòng "Rate" ở tổng hiển thị "-", thay vào đó liệt kê `Rate (07/01/2026 - 07/08/2026): $0.00`, `(07/09/2026 - 07/13/2026): $400.00`, `(07/14/2026 - 07/20/2026): $285.71`, `(07/21/2026): $666.66` — đúng là salary theo kỳ, mỗi kỳ lương có rate cấu hình khác nhau, và Gross Income $4,666.66 là tổng các kỳ (không đơn thuần cộng 4 số hiển thị, vì các con số hiển thị có thể là rate quy đổi/ngày chứ không phải tổng tiền kỳ đó).

**Ghi chú riêng cho Val (Wage Per Day):** order trải trên 3 ngày khác nhau trong tháng (07/07, 07/13, 07/21) nhưng field **Working Days vẫn hiển thị "1"** và Gross Income chỉ tính `Rate × 1 = $80.00` (không phải 3 ngày × $80 = $240). Cần xác nhận lại đây là hành vi đúng theo thiết kế (ví dụ "Working Days" chỉ đếm ngày làm việc thực tế đã "check-in", không suy ra từ ngày có order) hay là một bug tính thiếu Working Days khi range trải nhiều ngày — trong dữ liệu quét được, Total Income hiển thị nhất quán ở cả bảng tổng quan ($75.00) và panel chi tiết ($75.00) nên nội bộ không tự mâu thuẫn, nhưng về mặt nghiệp vụ có vẻ đáng nghi (nhân viên làm 3 ngày nhưng chỉ được tính lương 1 ngày).

### 4.4 So sánh V1 vs V2 ở tầm tháng — vẫn khớp cho cả 4 biến thể pay-type

Đối chiếu trực tiếp cùng `staffId` + cùng `from`/`to` (tháng) giữa `/incomes/income-staff` và `/incomes/income-staff-v2`:

| Staff    | Pay type         | Total Income V1 | Total Income V2 | Khớp? |
| -------- | ---------------- | --------------- | --------------- | ----- |
| trinehhh | Commission       | $20.00          | $20.00          | ✅    |
| Wendy    | Wage Per Day     | $142.00         | $142.00         | ✅    |
| Tony     | Wage Per Hour    | $549.76         | $549.76         | ✅    |
| Kevin    | Salary by Period | $4,634.16       | $4,634.16       | ✅    |

Cả 4 biến thể pay-type (Commission, Wage Per Day, Wage Per Hour, Salary by Period) đều **giữ nguyên kết luận "giống hệt 100%"** giữa V1/V2 kể cả khi mở rộng range ra 1 tháng — không phát hiện thêm sai lệch mới giữa V1/V2 của Staff Income ngoài phạm vi đã biết.

### 4.5 Đối chiếu nhanh với Daily Sale Report & Income Summary (cùng range tháng)

- **Daily Sale Report (`income-daily`)** với `?from=1782882000&to=1784696399`: URL tự thêm `activeChart=sale` nhưng **màn hình chỉ hiển thị dữ liệu của đúng 1 ngày `07/01/2026` (tức ngày `from`)** — header hiển thị "07/01/2026" chứ không phải range, Total Order = 6, Sale = $427.50, Total tip = $72.00, Total Payment = $499.50. → **Daily Sale Report không hỗ trợ quét theo range nhiều ngày**, nó luôn dùng `from` làm ngày đơn lẻ, bất kể `to` khác `from` bao xa. Đây là hành vi đúng theo tên gọi "Daily" nhưng cần lưu ý khi truyền `to` khác `from` vào URL sẽ không có tác dụng gì trên màn này.
- **Income Summary (`income-summary`)** với cùng range: hỗ trợ đúng range tháng — header hiển thị "Total Income Jul 01, 2026 - Jul 21, 2026: $10,767.20". Con số này **không bằng** "Total subtotal" $10,302.40 của Staff Income cho cùng range — nhưng đây là khác biệt kỳ vọng vì 2 field có định nghĩa khác nhau (Total Income ở Summary tính theo Sale gộp Net/Gross khác công thức Subtotal ở Staff Income, vốn là Sale − Refund riêng theo từng staff), không phải sai lệch cần sửa.

## Ghi chú kỹ thuật khi quét (cho lần chạy sau)

- Cả 6 route đều bị `PermissionProtectedRoute` chặn bằng passcode dialog (`8888`) — phải nhập passcode trước khi snapshot thấy nội dung thật.
- Tick checkbox "Do not require passcode for the next 30 minutes" ở lần nhập đầu để không phải nhập lại khi chuyển route trong cùng phiên.
- URL filter là nguồn sự thật: `?from=<epoch>&to=<epoch>` (+ `activeChart=` cho Daily, `groupBy=` cho Summary, `staffId=`/`detailId=` khi mở panel chi tiết).
- Panel chi tiết của Income Summary/Staff Income **chỉ mount sau khi click 1 dòng trong bảng** — nếu chỉ chụp snapshot ngay khi vào trang sẽ thấy "No detail to show".
- Nhãn tip trên Daily Sale Report là **"Total tip"** (t thường), không phải "Total Tip".
- Combobox date-filter có preset **"This Month"** — chọn preset này khi app đang ở ngày X trong tháng sẽ ra range `01/tháng - X/tháng` (không phải cả tháng đủ 30/31 ngày nếu chưa đi hết tháng). Muốn 1 range tháng cố định/đủ ngày thì nên tự set `from`/`to` qua URL thay vì dùng preset.
- Bảng Order trong panel chi tiết Staff Income **không phân trang/không lazy-load** — kể cả staff có 186 order (Kevin) thì toàn bộ order vẫn render hết trong DOM/accessibility tree ngay khi mở panel, nên khi cần "quét hết order" chỉ cần lấy snapshot đầy đủ, không cần giả lập hành động scroll.
- Daily Sale Report **bỏ qua `to`** trong query string — luôn hiển thị dữ liệu của đúng ngày `from` dù URL có truyền range nhiều ngày.

## Code đã sinh từ document này

Đã tự động hoá 3 phép so sánh V1 vs V2 ở trên thành test Playwright, chạy trên "hôm nay" (tự thích ứng dữ liệu live thay vì cố định ngày Jul 21, 2026 của bản quét tay):

- **Page objects** — thêm tham số `variant: 'v1' | 'v2'` (mặc định `'v1'`, không phá vỡ code cũ) vào constructor:
  - [`DailySaleReportPage.ts`](../../../src/pages/pos/DailySaleReportPage.ts) → route `-v2` là `/incomes/income-daily-v2`
  - [`IncomeSummaryPage.ts`](../../../src/pages/pos/IncomeSummaryPage.ts) → `/incomes/income-summary-v2`
  - [`IncomeStaffPage.ts`](../../../src/pages/pos/IncomeStaffPage.ts) → `/incomes/income-staff-v2`
- **Spec** — [`TC-income-reports-v2-compare.spec.ts`](../../../tests/regression/incomes/income-reports-v2/TC-income-reports-v2-compare.spec.ts), 3 test case:
  - **TC-IRV2-1**: Daily Sale Report v1 vs v2 — stat cards, Income/Payment Details, order rows.
  - **TC-IRV2-2**: Income Summary v1 vs v2 — Payment Details/Supply Fee/Staff Payout (kỳ vọng khớp) + **Sale Details**/**Salon Earnings** viết dưới dạng assertion so sánh bằng thật (không phải assertion "phải khác"), nên **sẽ FAIL cho tới khi bug ở mục "Bug tìm thấy" (§2) được fix**, lúc đó tự chuyển xanh mà không cần sửa lại test.
  - **TC-IRV2-3**: Staff Income v1 vs v2 — 6 field thẻ thống kê tổng shop + toàn bộ dòng bảng staff.

Câu lệnh chạy (xem thêm `docs/test-commands.md`):

```bash
# Chạy cả file — ẩn trình duyệt (headless, mặc định)
npx playwright test tests/regression/incomes/income-reports-v2/TC-income-reports-v2-compare.spec.ts

# Chạy cả file — hiển thị trình duyệt (headed)
npx playwright test tests/regression/incomes/income-reports-v2/TC-income-reports-v2-compare.spec.ts --headed

# Chạy có hiển thị trình duyệt + Playwright Inspector, dừng từng bước để debug
npx playwright test tests/regression/incomes/income-reports-v2/TC-income-reports-v2-compare.spec.ts --headed --debug

# Chạy riêng từng test case (thêm --headed nếu muốn xem trình duyệt)
npx playwright test tests/regression/incomes/income-reports-v2/TC-income-reports-v2-compare.spec.ts:25   # TC-IRV2-1: Daily Sale Report
npx playwright test tests/regression/incomes/income-reports-v2/TC-income-reports-v2-compare.spec.ts:70   # TC-IRV2-2: Income Summary
npx playwright test tests/regression/incomes/income-reports-v2/TC-income-reports-v2-compare.spec.ts:110  # TC-IRV2-3: Staff Income
```

**Chưa tự động hoá** (ngoài phạm vi lần gen này): phần 4 của document (quét mở rộng 1 tháng theo từng staff, drill-down panel chi tiết Staff Income cho Kevin/trinehhh, sai lệch rounding $0.03) — mới chỉ có so sánh ở tầm bảng liệt kê + thẻ thống kê cho Staff Income, chưa có code đọc panel chi tiết per-staff (salary/commission layout) như đã có sẵn cho Income Summary (`readDetailSections`).
