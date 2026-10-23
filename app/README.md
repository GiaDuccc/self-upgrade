# Self Upgrade - Mobile Companion App 📱

Ứng dụng di động chuyên dụng xây dựng bằng **React Native (Expo)** dành cho dự án **Self Upgrade**. Kết nối trực tiếp vào MongoDB Backend (`api/`) và đồng bộ 2 chiều với nền tảng Web (`web/`).

---

## 🌟 Tính năng nổi bật

1. **🌙 Đồng bộ giấc ngủ tự động (Xiaomi Band 10 & Apple Health)**:
   - Dữ liệu giấc ngủ từ Xiaomi Band 10 được Mi Fitness đẩy vào ứng dụng **Apple Health (Sức khỏe)** trên iPhone.
   - App đọc dữ liệu giấc ngủ (giờ ngủ, giờ dậy, tổng thời lượng, deep sleep, điểm ngủ) và tự động đồng bộ lên máy chủ.
   - Hỗ trợ cả chế độ nhập tay hoặc chỉnh sửa nhanh.
2. **💧 Theo dõi nước uống 1-chạm (One-tap Water Logger)**:
   - Thêm nhanh 1 ly nước (+250ml), bình nước (+500ml), nhấp ngụm (+100ml) hoặc trừ bớt (-250ml).
   - Thanh tiến độ hiển thị trực quan theo mục tiêu tính theo cân nặng cá nhân.
3. **✅ Tích kỷ luật & Nhiệm vụ hàng ngày (Daily Checklist)**:
   - Danh sách công việc theo từng khung giờ trong ngày.
   - Chạm để chuyển nhanh các mức độ kỷ luật: `NONE` (Chưa tích) ➔ `BAD` (Tệ) ➔ `GOOD` (Tốt) ➔ `PERFECT` (Hoàn hảo).
4. **🌐 Kết nối mạng LAN trực tiếp**:
   - Tích hợp cửa sổ cấu hình IP máy chủ (ví dụ `http://192.168.1.5:2004/api/v1`) ngay trong ứng dụng, không cần build lại code khi đổi mạng Wi-Fi.

---

## 🚀 Hướng dẫn chạy thử nghiệm trên iPhone (Không cần Mac, không mất phí)

### Bước 1: Cài đặt Expo Go trên iPhone
- Vào **App Store** trên iPhone, tìm và cài đặt ứng dụng: **Expo Go** (miễn phí).

### Bước 2: Kiểm tra IP mạng Wi-Fi của máy tính
- Đảm bảo iPhone và máy tính chạy Windows đang kết nối vào **cùng 1 mạng Wi-Fi**.
- Mở PowerShell trên máy tính và gõ:
  ```powershell
  ipconfig
  ```
- Tìm mục **IPv4 Address** của card Wi-Fi (ví dụ: `192.168.1.15`).

### Bước 3: Khởi động Backend API & Mobile App
1. **Khởi động Backend API**:
   ```powershell
   cd api
   npm run dev
   ```
   *(Backend chạy ở cổng `2004`)*

2. **Khởi động Mobile App**:
   ```powershell
   cd app
   npx expo start
   ```
- Màn hình terminal sẽ xuất hiện một mã **QR code**.

### Bước 4: Mở app trên iPhone
- Mở camera của iPhone hoặc app **Expo Go** ➔ Quét mã QR code trên màn hình máy tính.
- Expo Go sẽ tự động tải ứng dụng về máy và hiển thị ngay lập tức!
- Trên app, nhấn vào biểu tượng bánh răng ⚙️ ở góc phải trên ➔ Nhập địa chỉ máy chủ:
  ```
  http://<IP_MÁY_TÍNH>:2004/api/v1
  ```
  (Ví dụ: `http://192.168.1.15:2004/api/v1`) ➔ Nhấn **Lưu cấu hình**.

---

## ⌚ Quy trình đồng bộ giấc ngủ từ Xiaomi Band 10

```
┌──────────────────┐
│  Xiaomi Band 10  │
└────────┬─────────┘
         │ (Bluetooth - Tự động đồng bộ khi ngủ dậy)
         ▼
┌──────────────────┐
│ App Mi Fitness   │ (Trên iPhone)
└────────┬─────────┘
         │ (Tự động chia sẻ vào Apple Health)
         ▼
┌──────────────────┐
│   Apple Health   │ (Ứng dụng Sức khỏe gốc iOS)
└────────┬─────────┘
         │ (Đọc dữ liệu giấc ngủ)
         ▼
┌──────────────────┐
│ Self Upgrade App │ ──[HTTP PUT]──► Backend API (Node.js/MongoDB)
└──────────────────┘                      │
                                          ▼
                                   Web Desktop Dashboard
```

### Cấu hình Mi Fitness liên kết Apple Health:
1. Mở app **Mi Fitness** trên iPhone ➔ Vào mục **Hồ sơ (Profile)**.
2. Chọn **Dữ liệu được kết nối (Connected Data)** ➔ Chọn **Apple Health (Sức khỏe)** ➔ Bật cấp quyền chia sẻ mục **Giấc ngủ (Sleep)**.
3. Khi bạn thức dậy, Mi Fitness đồng bộ từ vòng đeo tay ➔ Apple Health nhận dữ liệu ➔ Mở Self Upgrade App nhấn **Đồng bộ Apple Health** để đẩy dữ liệu lên máy chủ!
