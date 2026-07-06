---
title: Order Pending (/order-pending)
source-linear: 'https://linear.app/fastboy/document/order-pending-caa07c054f23 (đọc bản offline docs/linear/order-pending.md — Linear MCP chưa xác thực trong phiên này)'
scanned-at: 2026-07-06
scanned-by: playwright-mcp trên app live http://localhost:1420/order-pending
skill: linear-feature-spec (1/4)
---

# Order Pending (`/order-pending`) — Đặc tả tính năng

> File này là đầu ra **Skill 1/4** (`linear-feature-spec`) cho màn hình **Order Pending**.
> Nguồn: spec offline Linear (`docs/linear/order-pending.md`) + **quét màn hình thật** bằng
> Playwright MCP trên app đang chạy (2026-07-06). Không sinh test case / code ở skill này.

## 1. Mục tiêu & phạm vi

Xây dựng workflow **Pending Order** cho POS để tách rời **phục vụ** khỏi **thanh toán**:

- Tạo order **trước khi** thanh toán (walk-in, khách đang làm dịch vụ).
- Hỗ trợ luồng **GoCheckin** (queue management, theo dõi khách đang ở tiệm).
- Thoát khỏi flow cứng `Create Order → Checkout → Payment Success` hiện tại.

Màn `/order-pending` là **Pending Orders Queue** — màn hình vận hành chính: theo dõi khách,
trạng thái xử lý, mở nhanh order cần thao tác, quản lý queue. **KHÔNG** dùng để edit sâu order
(việc đó nằm ở màn Create/Update Order — Order Workspace).

## 2. Các luồng chính (từ Linear)

- **Định nghĩa Pending Order:** status `Pending` = order chưa checkout hoàn tất (chưa thanh
  toán). **Không** hiển thị trong Order History cho tới khi `Completed`.
- **3 nguồn tạo Pending Order:**
  1. **Create Order thủ công** — `POS Home → Create Order → Pending Order` (walk-in).
  2. **Checkout từ Appointment** — `Appointment → Checkout → Pending Order → thanh toán sau`.
  3. **GoCheckin** — `Check-in success → auto-create Pending Order → tag: Checked in`.
- **Vòng đời:** `Create Order → Pending → Service Processing → Checkout → Payment Success → Completed`.
- **GoCheckin flow:** `GoCheckin → Auto-create Pending → xử lý dịch vụ → Checkout → Payment Success`.

## 3. Thành phần UI thực tế (quét bằng Playwright MCP, 2026-07-06)

Ảnh: [order-pending-assets/queue.png](order-pending-assets/queue.png)

| Thành phần                               | Vai trò                                       | Trạng thái | Ghi chú                                  |
| ---------------------------------------- | --------------------------------------------- | ---------- | ---------------------------------------- |
| Header — nút **Pending Orders**          | Đang active, mở panel/queue đơn chờ           | Hoạt động  | Cạnh Order History, Appointment, Scanner |
| Link **Order History** / **Appointment** | Điều hướng chéo                               | Hoạt động  | Appointment kèm `?date=<epoch>`          |
| **Search order** (textbox)               | Lọc theo _order ID, customer name hoặc phone_ | Hoạt động  | placeholder tiếng Anh                    |
| Filter **Staff (15)**                    | Lọc theo nhân viên; badge đếm 15              | Hoạt động  | Mở dropdown chọn staff                   |
| Combobox **Sort**                        | Sắp xếp danh sách                             | Hoạt động  | Options: **Latest** / **Oldest**         |
| Combobox **Date range** (preset "Today") | Chọn khoảng ngày                              | Hoạt động  | Đi kèm date-picker calendar              |
| Nút **calendar** `07/05/2026`            | Chọn ngày cụ thể                              | Hoạt động  | Ngày mặc định = hôm nay theo TZ shop     |
| Nút **Quick Checkout**                   | Thanh toán nhanh                              | Hoạt động  | Action chính bên phải toolbar            |
| **Pending Order Card**                   | Một đơn chờ, click để mở workspace            | Hoạt động  | Xem cấu trúc card bên dưới               |
| Banner **connection**                    | "Internet connection restored."               | Hoạt động  | Liên quan Offline Mode                   |

**Cấu trúc Pending Order Card** (khớp spec Linear §4.1):

| Field           | Ví dụ quét được                                               | Ghi chú                                           |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| Order ID        | `OD260705-14849180`, `OD260706-13470271`, `OD260706-01297238` | Mã đơn                                            |
| Tag "In Use"    | có/không                                                      | Badge trạng thái sử dụng (card thứ 3 có "In Use") |
| Customer name   | `Unknown`                                                     | Khách chưa gán → Unknown                          |
| Phone / Points  | `N/A` · `0 Pts`                                               | SĐT và điểm thành viên                            |
| Created at      | `11:07 PM`, `10:44 PM`, `07:21 PM`                            | Giờ tạo                                           |
| Status          | `Processing`                                                  | Trạng thái xử lý dịch vụ                          |
| Service · Staff | `Regular Pedicure` · `Linda`                                  | Chỉ hiện khi đơn đã có dịch vụ/nhân viên          |

## 4. Nghiệp vụ & ràng buộc

- Pending Order **không tự complete/cancel** khi qua ngày mới; vẫn cho thanh toán đơn Pending
  của **ngày quá khứ** — complete lúc nào thì **Order Date** = lúc đó.
- Nếu đã Checkout từ Appointment nhưng chưa thanh toán → click Checkout tiếp **redirect** về
  Order Pending đã checkout trước đó (chống tạo trùng).
- Mọi thay đổi trên Pending Order đều được ghi nhận cho đến khi `payment success → Completed`.

## 5. Trạng thái / quyền / edge case

- **Offline Mode:** vẫn tạo được Pending Order khi offline (`order_status = Pending`). Chỉ cho
  **Complete bằng Cash** khi offline rồi sync lại khi online.
- **Offline indicators:** `Waiting for sync`, `Sync failed`, `Conflict detected`.
- **Chống duplicate:** Pending Orders hiển thị đồng thời ở `Pending Orders Queue` và `Order Workspace`.
- Card `Unknown` / `N/A` / `0 Pts`: đơn tạo trước, chưa gán khách.

## 6. Đối chiếu Linear ↔ UI thực tế (khớp / lệch)

- **Khớp:** Card hiển thị đúng `Order ID, Customer name, Phone, Tag, Created at, Status: Pending`
  như spec §4.1. Header actions có Search + Date picker + Create/Quick Checkout.
- **Lệch / cần lưu ý:**
  - Spec nêu header action **"Create Order"**; UI thực tế nút bên phải là **"Quick Checkout"**
    (Create Order có thể ở Home). Cần xác nhận với PO.
  - Spec §4.1 nêu **Filters** chung; UI thực tế cụ thể hoá thành **Staff filter + Sort
    (Latest/Oldest) + Date range**.
  - Status trên card hiển thị **"Processing"** (không phải literal "Pending") — là trạng thái
    xử lý dịch vụ bên trong lifecycle Pending.
  - Chuỗi tiếng Anh còn lộ trên UI: `Pending Orders`, `Order History`, `Appointment`,
    `Scanner`, `Quick Checkout`, `Search order ID, customer name or phone`, `Latest/Oldest`,
    `Today`, `Processing`, `In Use`, `Unknown`, `Pts` → để Skill 5 (i18n scan) xử lý.

## 7. Nguồn tham chiếu

- Spec Linear (offline): [docs/linear/order-pending.md](../linear/order-pending.md)
- Ảnh quét: [order-pending-assets/queue.png](order-pending-assets/queue.png)
- App live: `http://localhost:1420/order-pending` (BASE_URL mặc định, TZ theo shop)
