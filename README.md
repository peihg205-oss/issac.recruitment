# 🚀 iSSAC Recruitment Management Portal
### Hệ Thống Tuyển Thành Viên Chính Thức - VNU-IS Ambassadors Club (iSSAC)
*Bridge to Success*

---

## 📌 Giới Thiệu Dự Án

Hệ thống **iSSAC Recruitment Portal** là nền tảng quản lý tuyển dụng toàn diện được thiết kế và phát triển chuyên biệt cho **Câu lạc bộ Đại sứ Sinh viên - VNU-IS (iSSAC)**. Nền tảng quản lý toàn bộ vòng đời tuyển dụng của ứng viên từ khâu tiếp cận, nộp hồ sơ, chọn lịch phỏng vấn, chấm điểm đánh giá tự động, xếp hạng Top 15 cho đến phê duyệt và gửi thông báo kết quả.

---

## 🌟 Tính Năng Nổi Bật

### 1. Dành cho Ứng viên (Member Portal)
- 🎯 **Landing Page trực quan**: Thiết kế hiện đại theo phong cách Brand Identity của iSSAC (Navy `#0f1b4c`, Blue `#1e40af`, Gold `#f59e0b`). Tích hợp lộ trình tuyển dụng Odyssey Map và giới thiệu 4 ban chuyên môn.
- 📝 **Đăng ký & Đăng nhập**: Xác thực an toàn qua Supabase Auth, hỗ trợ ghi nhớ phiên đăng nhập.
- 👤 **Hồ sơ cá nhân đa năng**: Cập nhật thông tin sinh viên VNU-IS (Khoa, ngành, MSSV, link CV, Facebook/LinkedIn, kinh nghiệm hoạt động).
- 📋 **Ứng tuyển & Trả lời câu hỏi**:
  - Chọn 1 trong 3 ban chuyên môn: Ban Truyền thông, Ban Tư vấn, Ban Nhân sự.
  - Trả lời bộ câu hỏi phỏng vấn vòng đơn được phân loại theo ban đã chọn.
  - Tự động lưu bản nháp (Draft) và xác nhận nộp chính thức.
- 📅 **Đặt lịch Phỏng vấn thông minh**:
  - Xem danh sách ca phỏng vấn khả dụng theo thời gian thực (Online qua Google Meet / Offline tại VNU-IS).
  - Đặt chỗ và hủy/đổi lịch linh hoạt trước giờ G.
- 🏆 **Xem Kết quả & Xác nhận**:
  - Tra cứu kết quả sau khi Ban Tuyển dụng công bố.
  - Nút xác nhận nhận vị trí / từ chối phản hồi tức thì về hệ thống.

---

### 2. Dành cho Ban Tuyển dụng (Admin Dashboard)
- 📊 **Dashboard Tổng quan**:
  - Thống kê thời gian thực: Tổng ứng viên, tỷ lệ nộp theo ban, tỷ lệ qua từng vòng.
  - Biểu đồ phân bổ hồ sơ và trạng thái xử lý.
- 👥 **Quản lý Hồ sơ Ứng viên**:
  - Bộ lọc đa chiều theo: Ban ứng tuyển, Vòng hiện tại, Trạng thái phê duyệt, Từ khóa tìm kiếm.
  - Chi tiết hồ sơ ứng viên với đầy đủ câu trả lời, link CV, thông tin liên lạc.
  - Chuyển vòng hàng loạt hoặc từng cá nhân (Vòng đơn ➡️ Vòng phỏng vấn ➡️ Vòng thử thách ➡️ Kết quả).
- ⚖️ **Hệ thống Đánh giá & Chấm điểm (Evaluation)**:
  - Form chấm điểm chuyên nghiệp theo các tiêu chí chuẩn hóa (Thái độ, Kỹ năng giao tiếp, Năng lực chuyên môn, Tiềm năng phát triển, Điểm cộng).
  - Tự động tính điểm trung bình từ nhiều giám khảo.
- 🥇 **Xếp hạng & Tự động chọn TOP 15**:
  - Thuật toán tự động tổng hợp điểm và xếp thứ hạng từ cao xuống thấp.
  - Nút **"Tự động chọn TOP 15"** đánh dấu Đạt cho 15 ứng viên xuất sắc nhất.
  - Ban Chủ nhiệm có thể điều chỉnh và phê duyệt danh sách chính thức trước khi công bố.
- 🗓️ **Quản lý Lịch Phỏng vấn (Interview Slots)**:
  - Tạo ca phỏng vấn (ngày, giờ bắt đầu/kết thúc, hình thức Online/Offline, phòng phỏng vấn/link Meet, số lượng tối đa).
  - Theo dõi danh sách ứng viên đã đăng ký trong từng ca.
- ❓ **Ngân hàng Câu hỏi Tuyển dụng**:
  - Quản lý bộ câu hỏi theo từng ban và câu hỏi chung.
  - Tùy chỉnh loại câu hỏi (Văn bản tự luận, Trắc nghiệm, Thang điểm).
- 📥 **Xuất Dữ liệu (Export CSV/Excel)**:
  - Xuất danh sách ứng viên đầy đủ thông tin để lưu trữ nội bộ hoặc báo cáo Nhà trường.
  - Xuất bảng điểm chi tiết và danh sách trúng tuyển chính thức.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism & Micro-animations
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL với Row-Level Security)
- **Authentication**: Supabase Auth (Email & Password với Session Cookie Server-side)
- **Bundler & Build Tool**: Turbopack

---

## 📁 Cấu Trúc Dự Án

```
issac-recruitment/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page tuyển sinh iSSAC
│   │   ├── login/                    # Đăng nhập
│   │   ├── register/                 # Đăng ký tài khoản
│   │   ├── member/                   # Portal ứng viên
│   │   │   ├── dashboard/            # Tổng quan tiến trình hồ sơ
│   │   │   ├── profile/              # Cập nhật hồ sơ cá nhân
│   │   │   ├── application/          # Chọn ban & trả lời câu hỏi
│   │   │   ├── interview/            # Đặt lịch ca phỏng vấn
│   │   │   └── result/               # Xem kết quả tuyển dụng
│   │   └── admin/                    # Admin Portal
│   │       ├── dashboard/            # Thống kê tổng quan
│   │       ├── candidates/           # Quản lý danh sách hồ sơ
│   │       │   └── [id]/             # Chi tiết hồ sơ ứng viên
│   │       ├── evaluation/           # Danh sách chấm điểm
│   │       │   └── [id]/             # Form chấm điểm chi tiết
│   │       ├── ranking/              # Xếp hạng & chọn Top 15
│   │       ├── interviews/           # Quản lý ca phỏng vấn
│   │       ├── questions/            # Quản lý bộ câu hỏi
│   │       ├── admin-users/          # Phân quyền giám khảo/admin
│   │       ├── export/               # Xuất file CSV/Excel
│   │       └── settings/             # Cài đặt đợt tuyển
│   ├── components/
│   │   ├── ui/                       # Button, Card, Badge, Modal, Input, Toast...
│   │   ├── Navbar.tsx                # Thanh điều hướng
│   │   └── Footer.tsx                # Chân trang
│   ├── lib/
│   │   ├── supabase/                 # Supabase client, server, middleware
│   │   └── utils.ts                  # Helper functions, formatters, CSV export
│   └── types/
│       └── database.ts               # Type definitions đầy đủ
├── supabase/
│   └── schema.sql                    # Full PostgreSQL Schema, RLS, Triggers & Dữ liệu mẫu
├── .env.example                      # Mẫu biến môi trường
└── README.md                         # Hướng dẫn sử dụng chi tiết
```

---

## ⚡ Hướng Dẫn Cài Đặt & Chạy Local

### Bước 1: Clone và Cài đặt Dependencies

```bash
cd issac-recruitment
npm install
```

### Bước 2: Thiết lập Cơ sở dữ liệu Supabase

1. Truy cập [Supabase](https://supabase.com) và tạo một Project mới (miễn phí).
2. Vào mục **SQL Editor** trong thanh công cụ bên trái của Supabase Dashboard.
3. Mở file `supabase/schema.sql` trong dự án, copy toàn bộ nội dung và dán vào SQL Editor, sau đó nhấn **Run**.
   - *File này sẽ tự động khởi tạo đầy đủ các bảng dữ liệu, RLS Policies, Triggers tính điểm, phân quyền, dữ liệu ban chuyên môn và bộ câu hỏi mẫu.*

### Bước 3: Cấu hình Biến môi trường

Tạo hoặc cập nhật file `.env.local` ở thư mục gốc:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```
*(Lấy URL và Anon Key tại **Supabase Dashboard ➡️ Project Settings ➡️ API**)*

### Bước 4: Khởi chạy Ứng dụng

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt của bạn! 🎉

### Bước 5: Cấp Quyền Admin Ban Đầu

1. Đăng ký một tài khoản mới qua trang `/register`.
2. Vào **Supabase Dashboard ➡️ Table Editor ➡️ `profiles`**.
3. Tìm dòng tài khoản vừa đăng ký, đổi cột `role` thành `'admin'` hoặc `'super_admin'`.
4. Đăng nhập lại tại `/login`, hệ thống sẽ tự động chuyển hướng bạn vào `/admin/dashboard`.

---

## ☁️ Hướng Dẫn Deploy lên Vercel

Hệ thống được tối ưu 100% để deploy trực tiếp lên Vercel:

1. Đẩy mã nguồn lên GitHub/GitLab của bạn:
   ```bash
   git add .
   git commit -m "feat: complete iSSAC Recruitment Portal"
   git push origin main
   ```
2. Đăng nhập vào [Vercel](https://vercel.com) và chọn **"Add New..." ➡️ "Project"**.
3. Chọn Repository vừa đẩy lên.
4. Thêm 2 Environment Variables trong cài đặt Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL dự án Supabase của bạn
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key dự án Supabase của bạn
5. Nhấn **Deploy**! Dự án sẽ tự động build và cung cấp domain production miễn phí (HTTPS) trong vòng 1-2 phút.

---

## 📞 Hỗ Trợ & Bản Quyền

- **Tổ chức**: CLB Đại sứ Sinh viên VNU-IS (iSSAC)
- **Trường**: Trường Quốc tế - Đại học Quốc gia Hà Nội (VNU-IS)
- **Khẩu hiệu**: *Bridge to Success*
