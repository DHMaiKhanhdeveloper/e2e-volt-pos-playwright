---
title: Batches
linearId: ff35ac6d-8fb1-4126-8b75-ade4532eac99
url: https://linear.app/fastboy/document/batches-1ad99f112d7a
team: VOLT
updatedAt: 2026-06-11T09:59:36.875Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **POS – Batch History (Payment-based)**

## **1. Mục đích**

* Batch History trên POS giúp chủ tiệm: Xem open / closed batch; Thực hiện đối soát cuối ngày; Tra soát khi có sai lệch payment; Kiểm tra dòng tiền sẽ được Deposit về tài khoản sau khi batch close.
* Batch History KHÔNG dùng order làm đơn vị hiển thị, mà dựa hoàn toàn trên payment, show tương tự Batch Close Report của Fastboy Portal.

## **2. Định nghĩa Batch**

* Một Batch được xác định bởi: Batch Date; Batch Number; Batch Status.
* Batch Status chỉ có 2 trạng thái:
  * **Open:** Batch chưa được đóng.
  * **Close:** Batch đã đóng, tiền chuyển vào tài khoản chủ tiệm trong vòng 1-3 ngày làm việc sau khi batch close.
* Batch được gom theo Batch Number, mỗi batch chứa nhiều payment.
* Batch hiển thị nếu có ít nhất 1 payment. Batch không có payment → không hiển thị.

## **3. Dữ liệu hiển thị trên Batch History (Summary level)**

* Danh sách Batch hiển thị theo Batch Date, mỗi batch date là 1 record.
* Các field: Filter (Batch Date); Batch Date; Batch Number; Batch Status (Open / Close — open batch luôn hiển thị trên cùng); Total Payment (số lượng payment trong batch); Total Amount (tổng tiền các payment). Thứ tự: Batch Date DESC (mới nhất trước).
* Lưu ý: Open Batch thì không có Batch Date.

## **4. Support xem list order của payment đã Batch Close (Status - Closed)**

* **Amount hyperlink:** click sẽ show list order chứa payment đã batch close, gồm:
  * Batch Close Review - Batch Date
  * Order list: OD code (hyperlink → mở dialog order history detail, view only); Subtotal; Tip; Total.

---

*Source: Google Docs — "Batches" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
