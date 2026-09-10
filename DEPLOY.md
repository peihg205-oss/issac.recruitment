# 🚀 Hướng Dẫn Deploy iSSAC Recruitment lên Vercel + Supabase

## Yêu cầu

- Node.js 18+
- Tài khoản [Supabase](https://supabase.com)
- Tài khoản [Vercel](https://vercel.com)
- Tài khoản [GitHub](https://github.com)

---

## BƯỚC 1: Chuẩn Bị Supabase Database

### 1.1. Tạo Project Supabase

1. Vào https://supabase.com/dashboard
2. Click **"New Project"**
3. Điền thông tin:
   - **Name**: `issac-recruitment`
   - **Database Password**: Tạo password mạnh (lưu lại!)
   - **Region**: Singapore (gần nhất với VN)
4. Click **"Create new project"** → Chờ khoảng 2 phút

### 1.2. Chạy Schema SQL

1. Trong Supabase Dashboard → Vào **SQL Editor** (menu bên trái)
2. Click **"New Query"**
3. Copy toàn bộ nội dung file [`supabase/schema.sql`](./supabase/schema.sql)
4. Paste vào editor
5. Click **"Run"** (hoặc Ctrl+Enter)
6. ✅ Phải thấy thông báo **"Success. No rows returned"**

### 1.3. Lấy API Keys

1. Vào **Project Settings** → **API**
2. Copy 2 thông tin:
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (key dài)

---

## BƯỚC 2: Cấu Hình Local

### 2.1. Tạo file `.env.local`

Sửa file `.env.local` với thông tin Supabase của bạn:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_BCN_ADMIN_PASSWORD=ISSAC2026@tuyenquan
```

> ⚠️ **Thay** `xxxxxx` bằng Project ID thực của bạn, và key thật từ Supabase

### 2.2. Cài đặt và test local

```bash
cd issac-recruitment
npm install
npm run dev
```

Mở http://localhost:3000 → Kiểm tra trang chủ load OK.

### 2.3. Test build production

```bash
npm run build
```

✅ Build phải thành công **không có lỗi**.

---

## BƯỚC 3: Cấu Hình Supabase Auth

### 3.1. Thiết lập Email Auth

1. Supabase Dashboard → **Authentication** → **Providers**
2. Đảm bảo **Email** đang enabled (mặc định có)
3. Bật hoặc tắt **"Confirm email"** tùy nhu cầu:
   - Bật: User phải xác nhận email trước khi đăng nhập
   - Tắt: Đăng nhập ngay sau khi đăng ký

### 3.2. Cấu hình URL (quan trọng!)

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://your-app.vercel.app` (sẽ cập nhật sau khi có URL Vercel)
3. **Redirect URLs**: Thêm:
   - `https://your-app.vercel.app/**`
   - `http://localhost:3000/**` (cho local dev)

---

## BƯỚC 4: Push Code lên GitHub

### 4.1. Khởi tạo Git (nếu chưa có)

```bash
git init
git add .
git commit -m "Initial commit: iSSAC Recruitment System"
```

### 4.2. Tạo GitHub Repository

1. Vào https://github.com/new
2. Tạo repository **private** (khuyến nghị vì có credentials)
3. Copy URL repository

### 4.3. Push code

```bash
git remote add origin https://github.com/YOUR_USERNAME/issac-recruitment.git
git branch -M main
git push -u origin main
```

> ⚠️ `.gitignore` đã exclude `.env.local` → Credentials **không** bị push lên GitHub

---

## BƯỚC 5: Deploy lên Vercel

### 5.1. Import Project

1. Vào https://vercel.com/new
2. Click **"Import Git Repository"**
3. Chọn GitHub repository `issac-recruitment`
4. Click **"Import"**

### 5.2. Cấu hình Environment Variables

Trong trang configure, mở rộng **"Environment Variables"** và thêm:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key từ Supabase) |
| `NEXT_PUBLIC_BCN_ADMIN_PASSWORD` | Mật khẩu BCN của bạn |

### 5.3. Deploy

1. Click **"Deploy"**
2. Chờ build hoàn tất (~2-3 phút)
3. ✅ Bạn sẽ nhận được URL dạng: `https://issac-recruitment-xxx.vercel.app`

### 5.4. Cập nhật Supabase Auth URL

Quay lại Bước 3.2 → Cập nhật **Site URL** và **Redirect URLs** bằng URL Vercel thực của bạn.

---

## BƯỚC 6: Tạo Tài Khoản Admin Đầu Tiên

### Cách 1: Đăng nhập với tài khoản BCN (Hardcoded)

Tài khoản mặc định có sẵn:
- **Email**: `ambassadors.club@vnuis.edu.vn`
- **Password**: (giá trị bạn đặt trong `NEXT_PUBLIC_BCN_ADMIN_PASSWORD`)

→ Đăng nhập tại `/login` → Tab **"Ban Tuyển quân"**

### Cách 2: Tạo tài khoản Supabase Auth cho Admin

1. Vào Supabase Dashboard → **Authentication** → **Users**
2. Click **"Invite user"** → nhập email admin
3. Sau khi user xác nhận email, vào **SQL Editor** và chạy:

```sql
UPDATE profiles
SET role = 'admin', admin_role = 'truyen-thong'  -- hoặc 'tu-van', 'nhan-su', 'chu-nhiem'
WHERE email = 'admin@example.com';
```

---

## BƯỚC 7: Xác Nhận Hệ Thống Hoạt Động

Kiểm tra các chức năng chính:

- [ ] Trang chủ `/` load được
- [ ] `/login` → Đăng nhập ứng viên với Supabase Auth
- [ ] `/login` → Đăng nhập admin với email BCN hardcoded
- [ ] `/register` → Đăng ký tài khoản mới không crash
- [ ] `/member/dashboard` → Redirect về login nếu chưa đăng nhập
- [ ] `/admin/dashboard` → Redirect về login nếu chưa đăng nhập
- [ ] Admin dashboard load sau khi đăng nhập

---

## Tài Khoản Admin Mặc Định

| Email | Role | Mật khẩu |
|-------|------|-----------|
| `ambassadors.club@vnuis.edu.vn` | Chủ nhiệm (Super Admin) | `BCN_ADMIN_PASSWORD` env var |
| `bcn@issac.vnu.edu.vn` | Chủ nhiệm (Dự phòng) | `BCN_ADMIN_PASSWORD` env var |
| `truyenthong@issac.vnu.edu.vn` | Ban Truyền thông | Không cần mật khẩu |
| `dinhhai.issac@vnu.edu.vn` | Ban Truyền thông | Không cần mật khẩu |
| `tuvan@issac.vnu.edu.vn` | Ban Tư vấn | Không cần mật khẩu |
| `haiyen.issac@vnu.edu.vn` | Ban Tư vấn | Không cần mật khẩu |
| `nhansu@issac.vnu.edu.vn` | Ban Nhân sự | Không cần mật khẩu |
| `minhduc.issac@vnu.edu.vn` | Ban Nhân sự | Không cần mật khẩu |

> ⚠️ Các tài khoản không có mật khẩu có thể đăng nhập với bất kỳ mật khẩu nào. Trong production, nên thêm password hoặc chuyển sang Supabase Auth.

---

## Troubleshooting

### Lỗi: "Invalid Supabase URL"
→ Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` trong Vercel Environment Variables không có ký tự thừa.

### Lỗi: "Invalid login credentials"
→ User chưa xác nhận email (nếu bật confirm email trong Supabase).

### Admin đăng nhập nhưng bị redirect về login
→ Cookie `issac_admin_role` không được set. Kiểm tra browser có block third-party cookies không.

### Build thất bại trên Vercel
→ Kiểm tra build logs → Tìm lỗi TypeScript hoặc missing env vars.

---

## Cấu Trúc Quyền Hạn

```
Super Admin (Chủ nhiệm)
├── Xem tất cả hồ sơ
├── Chấm điểm tất cả ban
├── Xuất bản kết quả cuối
├── Quản lý cài đặt hệ thống
└── Quản lý tài khoản admin

Admin (Trưởng/Phó ban)
├── Xem hồ sơ của ban mình
├── Chấm điểm ứng viên ban mình
└── Quản lý câu hỏi của ban mình

Member (Ứng viên)
├── Nộp hồ sơ ứng tuyển
├── Đặt lịch phỏng vấn
└── Xem kết quả (khi được công bố)
```
