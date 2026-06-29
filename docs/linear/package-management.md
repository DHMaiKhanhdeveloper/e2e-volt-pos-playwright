---
title: Package Management
linearId: abf445e3-7910-40e1-9e63-52fa70202e35
url: https://linear.app/fastboy/document/package-management-a13018e280ab
team: VOLT
updatedAt: 2026-06-11T09:59:41.158Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

# **Package Management**

* Identify and define the features available in each package, aligned with Fastboy's business information.
* **Mục tiêu:** Xây dựng trang quản lý Package & Feature dành cho Admin nội bộ, cho phép cấu hình các tính năng hiển thị và thao tác trên giao diện (UI) dựa trên gói dịch vụ (Package) mà Merchant đang sử dụng.
* Trang này chỉ dùng để: Quyết định feature nào được hiển thị; Quyết định action nào được phép thao tác trên UI.
* Hệ thống có 3 Package cố định = 3 level dịch vụ: **BASIC / DELUXE / PREMIUM**.
* Package được tính theo chu kỳ tháng. Mỗi merchant chỉ có 1 package tại 1 thời điểm.
* **Feature:** đại diện cho một màn hình / một tab / một nút hoặc một hành động trên UI. Mỗi feature có trạng thái Enable (ON) - Disable (OFF). Feature có thể dùng chung cho nhiều package.
* Với mỗi package (Basic / Deluxe / Premium): Admin có thể bật/tắt từng feature.
* **Quy tắc hiển thị UI cho Merchant sau khi apply package:** Merchant chỉ nhìn thấy và thao tác được feature khi đồng thời thỏa: Merchant đang có package active; Thời điểm hiện tại ≥ effective date của package; Feature được Enable trong package tương ứng.
* Nếu feature bị Disable: UI liên quan không hiển thị; Action tương ứng không cho thao tác.

UI tham khảo — Package List:

| Package | Description | Enabled Features | Last Updated | Action |
| -- | -- | -- | -- | -- |
| Basic | Gói cơ bản | 8 / 25 | 20/01/2026 | View / Update |
| Deluxe | Gói nâng cao | 15 / 25 | 22/01/2026 | View / Update |
| Premium | Gói cao cấp | 25 / 25 | 25/01/2026 | View / Update |

Click View / Update → Package Detail (vd Deluxe):

| Feature Group | Feature | Description | Enable |
| -- | -- | -- | -- |
| Payment & Transaction Features | Card Payment | Cho phép thanh toán bằng thẻ | ☐ |
| Payment & Transaction Features | Partial Refund | Hoàn tiền 1 phần | ☑ |
| Reporting | Export CSV | Xuất báo cáo CSV | ☑ |
| ... | | | |

(Button: Save Changes)

**Audit & lịch sử thay đổi:** Hệ thống cần lưu lịch sử cho: Thay đổi cấu hình feature trong package; Gán / thay đổi package cho merchant. Thông tin audit: Người thực hiện; Thời gian; Nội dung thay đổi (trước / sau).

---

*Source: Google Docs — "Package Management" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
