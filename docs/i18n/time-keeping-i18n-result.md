---
title: Kết quả quét Tiếng Việt — Chấm công (Time Keeping)
screen: time-keeping
route: /home?dialog=time-keeping
scanned-at: 2026-07-05
source: MCP Playwright (dialog không phải route — quét trực tiếp EN + VI)
---

# Chấm công (Time Keeping) — Quét Tiếng Việt / UI vỡ / dịch đúng chuẩn

Dialog mở từ **icon đồng hồ trên header** màn Home. Có **deep-link**:
`/home?dialog=time-keeping` (mở thẳng dialog — dùng cho scan tự động, ổn định hơn
click theo vị trí icon). Trước đây chỉ được đụng gián tiếp qua `HEADER_PANELS`
(idx 1, click mù theo vị trí) trong [`src/utils/i18nHome.ts`](../../src/utils/i18nHome.ts);
nay có scan riêng `scanTimeKeepingDialog`.

## Tổng quan

> tổng 6 nhãn chrome · ❌ chưa dịch **1** · ⚠️ sai chuẩn **0** · 📐 UI vỡ **0**

## 1. ❌ Chưa dịch (còn tiếng Anh)

| Chuỗi (EN)         | Đang hiển thị (VI)              | Nên dịch                      | Nguồn (app)                                                |
| ------------------ | ------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| `No staffs found.` | `No staffs found.` (giữ nguyên) | **Không tìm thấy nhân viên.** | `src/components/time-keeping/time-keeping-section.tsx:104` |

> Empty state của cột **"Nhân viên sẵn sàng"** khi chưa ai check-in. Đã có bản sửa ở
> **PR #1947** (app `volt-pos`): `t("global.noStaffsFound")` + key `vi` = "Không tìm thấy nhân viên."
> — PR chưa merge nên app đang chạy vẫn hiển thị tiếng Anh.

## 2. ⚠️ Dịch chưa đúng chuẩn

Không có. Các thuật ngữ đều khớp glossary / văn phong POS.

## 3. 📐 Vỡ giao diện (chỉ báo cáo)

Không phát hiện tràn ngang hay cắt chữ. Lưu ý theo dõi: nhãn cột tiếng Việt
("Nhân viên chưa sẵn sàng") dài hơn EN ("Unavailable Staff") ~1.6× — hiện vẫn vừa khung
ở 1920px; cần kiểm tra lại ở màn hẹp.

## 4. ✅ Đã dịch đúng (mẫu)

| EN                | VI                      |
| ----------------- | ----------------------- |
| Time Keeping      | Chấm công               |
| Search staff      | Tìm nhân viên           |
| Unavailable Staff | Nhân viên chưa sẵn sàng |
| Available Staff   | Nhân viên sẵn sàng      |
| OUT (trạng thái)  | RA                      |
| Close             | Đóng                    |

Số đếm badge ("15" / "0"), tên nhân viên (Andy, Bob…), chữ cái avatar (A/B…) và
mốc thời gian (06/29/2026 11:42 AM) là **dữ liệu**, không tính vào lỗi dịch.

## 5. Ghi chú / đề xuất

- **Code-gen**: thêm `scanTimeKeepingDialog()` vào `src/utils/i18nHome.ts` (mở qua
  deep-link `/home?dialog=time-keeping`, quét portal dialog) và gọi trong
  `tests/regression/i18n/TC-i18n-home-vietnamese-scan.spec.ts`. Ổn định hơn
  `HEADER_PANELS` (click mù theo vị trí icon).
- **Glossary**: cân nhắc chốt cặp trạng thái chấm công **IN → VÀO**, **OUT → RA**
  vào `GLOSSARY` (`src/utils/i18nCompare.ts`) để lần sau tự phân loại `ok`.
- Sau khi PR #1947 merge, chạy lại scan để xác nhận "No staffs found." đã hết.
