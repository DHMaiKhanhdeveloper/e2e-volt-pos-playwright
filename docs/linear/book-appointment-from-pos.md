---
title: Book Appointment from POS
linearId: 64dcf1dd-7329-4e31-b499-9fa81582057f
url: https://linear.app/fastboy/document/book-appointment-from-pos-77e8461bc641
team: VOLT
updatedAt: 2026-06-11T09:59:08.943Z
---

> 📌 **Source of truth: Linear** (từ 2026-06-11). PO viết & sửa spec trực tiếp tại đây — bản Google Docs gốc đã freeze, chỉ để tham khảo lịch sử.

**Book Appointment from POS**

# **A. Setting Go Booking (Web Booking - POS Booking)**

1. **Booking Hours**

* Thiết lập thời gian được phép đặt hẹn tại trang website book hẹn. Có thể thiết lập riêng hoặc giống thời gian làm việc của tiệm thông qua việc chọn nút Sync with Business work hour.

2. **SMS Content**

* Các nội dung tin nhắn chỉ được thiết lập trong phạm vi 160 ký tự bao gồm cả tên tiệm theo quy định SMS quốc tế. Trường hợp lố ký tự sẽ dẫn đến không gửi tin nhắn ra được. Số lượng ký tự có thể xem ở cuối mỗi dòng.

| SMS Content | Nội dung | Ý nghĩa / Điều kiện |
| -- | -- | -- |
| **SMS sent when you can't fulfill an appointment request** | Sorry we're busy at the time you request the appointment, please make another appointment, thanks! {link}. Reply STOP to opt out | Chủ tiệm hủy lịch hẹn Appointment Status = Cancelled |
| **SMS sent when customer's booking is confirmed** | Your appointment with {business_name} has been confirmed. {link}. Reply STOP to opt out | Appointment đã được phía tiệm xác nhận Appointment Status = Confirmed |
| **SMS sent when your customer completes a booking online** | Your appointment with {business_name} has been sent to the owner, please wait for his/her confirmation. {link} | Book appoinment online thành công (tin nhắn trước khi nhận được tin confirmed) Appointment Status = Scheduled |
| **SMS sent reminder customer** | Hi {customer_name}, don't forget your appointment at {business_name} on {date} at {time}. {link}. Reply STOP to opt out | Nội dung nhắc nhở khách hàng về cuộc hẹn sắp tới. Mặc định 3 tiếng trước giờ hẹn. |
| **SMS sent for waiting customer** | {business_name}: We're ready for you, please come back as soon as you can. | Báo với khách hàng đang trong danh sách chờ rằng tiệm đã sẵn sàng phục vụ. |

3. **Block Time**

* Là một tính năng dùng để chặn (block) một khoảng thời gian trên lịch đặt hẹn, để khách hàng không thể đặt lịch trong khoảng thời gian đó.
* **Business Block Time:** Tạm thời chặn hẹn toàn bộ tiệm vào ngày cụ thể. Chọn dấu + ở góc phải để thêm ngày. Các thiết lập:
  * **Day Off:** ngày muốn chặn đặt hẹn.
  * **Duration:** khung thời gian muốn chặn đặt hẹn của ngày hôm đó (hoặc tích chọn All day để chặn cả ngày).
  * **Recurring?:** cho phép thiết lập sự lặp lại.
  * **Repeat:** Lặp lại hàng tuần hoặc hàng tháng.
  * **End Date:** ngày kết thúc sự lặp lại.
  * **Description:** mô tả/nguyên nhân (chỉ tiệm thấy).
* **Staff Block Time:** Tạm thời chặn đặt hẹn đối với thợ chỉ định. Chọn Add Time Off. Các thiết lập giống Business Block Time (Day Off, Duration, Recurring?, Repeat, End Date, Description).

4. **Popup Message (Web Booking)**

* Thiết lập thông báo ngay khi khách hàng truy cập vào trang đặt hẹn. Nhập nội dung và Save lại.

5. **Appointment Deposit (Web Booking)**

* Tính năng đặt cọc trước mỗi khi khách hàng đặt hẹn vào tiệm.
* **Setting deposit type:** Mức đặt cọc — chọn theo phần trăm (**Percentage deposit**) hoặc số tiền cụ thể (**Fixed deposit amount**).
* **Setting cancel policy:** Nếu kích hoạt Allow, tiệm cho phép khách hủy hẹn và hoàn tiền trong phạm vi thời gian nhất định (24h, 48h hoặc Custom Hours).

6. **Web Booking Settings**

* **Display Settings**: Cài đặt giao diện hiển thị trên trang **Web Booking**

| Action | Ý nghĩa |
| -- | -- |
| Show skip button on your online booking page | Hiển thị nút Skip trên trang đặt hẹn online (chỉ áp dụng cho link web booking 2.0). |
| Show service price on your online booking page | Hiển thị giá của services trên trang đặt hẹn. |
| Show Standard Service Duration | Hiển thị Duration trên trang đặt hẹn. |
| Show the staff name of the confirmation page | Hiển thị tên thợ trên trang confirm sau khi đặt hẹn xong. |
| Show Staff Selection Page | Hiển thị trang chọn staffs cho người đặt chọn thợ mình muốn. |

* **Staff Selection & Assignment**: thiết lập cách client chọn thợ và cách hệ thống tự động assign staff cho các cuộc hẹn **Web Booking.**
  * **"Any Staff" option:** cho phép người đặt chọn thợ ngẫu nhiên ("Any available staff").
  * **Auto-assign:** chỉ active khi dùng Any Staff; system tự động assign người thợ phù hợp trong khung giờ đó.
    * Any staff color / Booking done color / Booking cancel color: màu sắc hiển thị mặc định.
  * **Allow selecting staff per service when booking:** hiển thị "Staff per service" để khách tạm thời lựa chọn.

* **Web Booking Rules & Behavior**:
  * **Allow customers to submit booking requests for time slots that are unavailable:** Booking sẽ ở dạng request, owner/staff xử lý thủ công.
  * **Allow adding multiple guests in a single booking:** service của Guest 2 bắt đầu cùng thời gian với Guest 1 và không cho 2 Guest đặt cùng 1 thợ.
  * **Maximum Number of Days Customers Can Book in Advance.**
  * **Minimum Advance Days Required Before Booking.**
  * **Allow Customers to Cancel Bookings.**
  * **Require Note Input.**

* **Go Booking Rules & Behavior:** Cấu hình quy tắc, hành vi đặt hẹn từ hệ thống tới Dashboard.
  * **Hide unassigned column when having no appointment.**
  * **You don't need to confirm your online bookings...:** Tất cả booking online auto confirm ngay sau khi đặt hẹn.
  * **Block create warning appointment:** Chặn việc tạo warning appointment (staff không làm/bận, không thể làm service đó). Khi cố tình tạo sẽ show popup confirm: Title "Confirmation", Description "There are warnings about these appointments, please check again.", Button "Accept".

* **Security & Validation** (Web booking):
  * **Require login before booking.**
  * **Enable CAPTCHA Verification for Booking.**
  * **Require Customers to Enter Email When Booking.**
  * **Display a notification message when the selected service is invalid:** ví dụ "No staff available for this service on this time. Please select other date & time!"

* **Pricing & Payment Settings**:
  * **The service price will include the service fee:** ON = giá đã bao gồm service fee; OFF = service fee tính riêng ở bước thanh toán.

* **System Configuration**:
  * **Set Up Store Timezone.**
  * **Activate** trang Web Booking để đi vào hoạt động.
  * **Enable Booking V3 Redirect:** cho phép chuyển giữa Version 2.0 và 3.0.
  * **Sync data to web booking:** đồng bộ Settings, Services, Staff, các thay đổi cấu hình booking lên trang Web Booking. Nên sync sau khi có thay đổi.

# **B. Setting apply cho POS Booking**

1. **Booking Hours**

* Thời gian booking trên POS phụ thuộc vào Booking Hours, Business Hours và Staff Booking Hours.
* Rule:

```
- Calendar hiển thị theo Booking Hours ± 1 tiếng.
Ví dụ:
Booking Hours: 7AM - 9PM
=> Calendar hiển thị: 6AM - 10PM
- Staff chỉ được nhận booking trong:
Calendar visible time VÀ Staff Booking Hours
- Business Hours là giờ hoạt động của tiệm, không quyết định trực tiếp khung giờ hiển thị Calendar.
```

| Ví dụ | Kết quả |
| -- | -- |
| Booking Hours: 7:00 AM - 9:00 PM; Staff Booking Hours: 10:00 AM - 5:00 PM | Calendar: 6:00 AM - 10:00 PM; Staff chỉ được booking: 10:00 AM - 5:00 PM |
| Business Hours: 8:00 AM - 8:00 PM; Booking Hours: 7:00 AM - 9:00 PM; Staff Booking Hours: 12:00 AM - 11:59 PM | Calendar: 6:00 AM - 10:00 PM; Staff được phép nhận booking: 6:00 AM - 10:00 PM |

2. **SMS Content**
3. **Block Time**
4. **Web Booking Settings - Go Booking Rules & Behavior**
5. **Một số setting chỉ apply cho Calendar Booking UI**

| Setting | Ý nghĩa |
| -- | -- |
| Show unavailable staff | Hiển thị staff không available trên Calendar và dropdown staff. |
| Show with most booking | Sắp xếp staff theo số lượng booking nhiều nhất. |
| Show customer phone | Hiển thị phone number trên appointment card. |
| Change edit start time mode | Enable: sửa thời gian trực tiếp tại appointment detail. Disable: show dialog Edit date & Time. |
| Set appointment color | Cho phép dùng màu cho appointment (màu theo staff). |
| Show only business work hours | Calendar chỉ hiển thị trong khoảng business hours. |
| Require passcode to cancel appointment | Yêu cầu nhập passcode để cancel appointment. |
| Unlock customer phone for 30 minute | Show full phone customer trong 30 phút sau khi unlock. |
| Require Passcode to Edit Appointment | Edit appointment cần passcode. |
| Require Staff Code to Edit Appointment | Staff phải nhập staff code để edit. |
| Require Staff Code to Create new appointment | Khi create appointment yêu cầu staff code. |
| Show Repeat Appointment feature | Hiển thị tính năng repeat appointment trong appointment detail. |
| Show quick info when cursor is over an appointment | Hiển thị tooltip/quick info khi hover appointment. |

# **C. Flow Create Appointment từ POS**

## **1. Mở form Create Appointment**

* User click button New Appointment trên Calendar POS để mở modal, hoặc click thẳng từ calendar.
* Lưu ý nếu click thẳng từ Calendar:
  * Chọn thời gian trong quá khứ: không effect.
  * Chọn vào Block Time: show message — Title "Information", Description "Can not schedule appointment outside your normal business hours!", Button "OK".

## **2. Chọn hoặc tạo Customer**

* **Search customer:** theo Customer name hoặc Phone number.
* **Existing customer:** show customer list bên trái; click để select. Hiển thị Customer name + Masked phone number (vd `(***) ***-2619`).
* **Create new customer:** click "+ Create new client" nếu không tìm thấy.

## **3. Chọn ngày Appointment**

* Date picker phía trên form. Default theo ngày đang chọn trên Calendar.
* Cho phép booking hiện tại và tương lai.
* Không tạo appointment trực tiếp cho ngày quá khứ, nhưng kéo-thả trên calendar thì vẫn được.

## **4. Nhập thông tin Appointment Line**

Mỗi appointment gồm ít nhất 1 line. Mỗi line gồm: Start time, Duration, Staff, Service.

## **5. Start Time**

* Default: nếu click từ calendar slot → lấy đúng selected slot time; nếu click từ header → lấy current time, round lên nearest 15 phút.

## **6. Duration**

* Default theo service duration nếu đã chọn service. User có thể edit.

## **7. Staff**

* User có thể chọn staff cụ thể / Any Staffs / để Unassigned (tự lưu thành Any Staffs sau khi save).
* Filter: All / Staff is available / Staff is currently busy. Search theo staff nickname.
* Status:
  * **Available:** Staff Active, Booking status Active, chưa có appointment trong khoảng thời gian đó.
  * **Busy:** start time không available, ngoài working time, đang apply Block Time. Nếu cố chọn: show "This Staff is not available for this time."

## **8. Service**

* Service không bắt buộc khi create appointment. Cho phép tạo appointment trước, checkout order mới chọn service.
* Show service Active theo Category: Service Name, Duration, Price, trạng thái Available/Busy cho staff đang chọn ("Service unavailable for [Staff]").
* Filter: All / available / busy. Riêng Any Staffs: tất cả service đều available.

## **9. Add More**

* Click "+ Add More" để thêm appointment line. Line tiếp theo default start time = previous line end time. Cho phép khác staff/service/duration.

## **10. Appointment Tags**

* **Requested**, **Highlight**, **No-show**, **Repeat** (recurring appointment khi setting Show Repeat Appointment feature = ON; chọn End date; action Cancel Repeat Appointments hủy cả gốc và repeat; ẩn option Repeat khi update appointment cũ).

## **11. Appointment Note**

* Max length = 255 chars. Hiển thị trong appointment detail, calendar card, hover quick info.

## **12. Validation khi Book**

* Chỉ required: Customer. System validation: Customer tồn tại/tạo mới thành công, Staff availability, Staff Booking Hours, Booking Hours, Business Hours, Duration validity, Appointment overlap.

## **13. Booking Hours Rule**

```
Calendar hiển thị theo Booking Hours ± 1 tiếng.
Booking Hours: 7AM - 9PM => Calendar hiển thị: 6AM - 10PM
Staff chỉ được nhận booking trong: Calendar visible time + Staff Booking Hours
Business Hours không quyết định trực tiếp khung giờ hiển thị Calendar.
```

## **14. Save Appointment**

* User click Book. Warning booking (staff/service không available) → show confirm "There are warnings about these appointments, please check again." và không tạo được appointment.

## **15. Sau khi create thành công**

* Đóng modal; tạo appointment với source = POS / Status = Confirmed.
* Show trên Calendar: Customer Name, Service Name, Tag (nếu có), Appointment note (nếu có), Booking time start-end; đúng staff column (hoặc Unassigned).
* Update Appointment Today nếu appointment date = today; Recalculate count; Show toast "Appointment created successfully".

# **D. Update Appointment**

| Appointment Status / Action | Update | Confirm | Cancel | Checkout |
| -- | -- | -- | -- | -- |
| **Scheduled** | Yes | Yes | Yes | No |
| **Confirmed** | Yes | No | Yes | Yes |
| **Canceled** | No | No | No | No |
| **Done** | No | No | No | No |

1. **Edit appointment** (Confirmed / Scheduled): update tất cả thông tin. Buttons: Cancel, Confirm (nếu Scheduled), Save appointment (show popup "Do you want to send a message to [Customer name] notifying about this change?" — Don't Send / Send).

2. **Confirm appointment** (Scheduled): áp dụng cho appointment book từ Web Booking khi auto-confirm disable. Buttons: Cancel, Save appointment, Confirm (popup "Are you sure to confirm this appointment?" — Cancel / Accept; gửi thông tin đến customer + notification trên POS).

3. **Cancel appointment** (Confirmed / Scheduled): Buttons gồm Confirm (nếu Scheduled), Save appointment, Cancel (popup "Are you sure to cancel this appointment?" — Cancel / Accept).

4. **Checkout Order từ appointment** (Confirmed): Checkout redirect qua màn create order, fill sẵn thông tin appointment. Show "Booking Time: 8:00AM". Sau khi order complete: auto update status appointment = Done, không update được nữa, show Order ID.

## **Một số case đặc biệt**

1. Appointment đã checkout nhưng order chưa Complete → click Checkout lại redirect đến đúng order đã checkout trước đó.
2. Appointment đã checkout, order chưa Complete → Cancel appointment thành công (status Canceled), order không ảnh hưởng; sau đó Complete order → appointment update status Done.
3. Appointment đã checkout, order chưa Complete → Delete Order → appointment không ảnh hưởng, có thể Checkout tiếp tạo order mới.
4. Quá thời gian appointment nhưng khách không đến/không checkout → status giữ nguyên, vẫn cho action.
5. Appointment book trước khi bị set Block Time vẫn action bình thường.

# **E. Go Check-In integrate**

1. **Đã có Appointment_Customer thực hiện link Checkin Today vào Appointment**
   * Phone trùng với phone đã book → hiển thị step để link Checkin vào Appointment.
   * Nếu chọn Yes: gửi noti đến POS, tạo order cho Appointment, gắn tag **Checked in**.

2. **Đã có Appointment_Customer không link Checkin Today vào Appointment**
   * Checkin thành công → tạo order Pending không liên quan appointment. Appointment trước đó không ảnh hưởng. Checkout Order từ Appointment tạo ra order mới hoàn toàn.

3. **Chưa có Appointment**
   * Checkin thành công → tạo order Pending. Calendar có Walk-in Sidebar (Customer Name, Phone, thời gian checkin).
   * Support tạo appointment bằng kéo-thả thông tin checkin vào calendar. Appointment gồm Order ID, service từ Checkin, status Confirmed, tag Checked-in.
   * Checkout redirect đến order đã tạo trước đó.

---

*Source: Google Docs — "Book Appointment from POS" tab in [Volt Pos Documents](https://docs.google.com/document/d/1cwBOliobcnSqxDpH0ZcjKXiHxvGAYlrO7wM95jNKTl4/edit).*
