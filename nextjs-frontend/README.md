# SAWmoto Frontend

Frontend aplikasi Sistem Pendukung Keputusan pemilihan motor menggunakan metode SAW (Simple Additive Weighting). Dibangun dengan Next.js 16 dan TypeScript.

## Tech Stack

- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Chart.js** + **react-chartjs-2** - Visualisasi grafik
- **jsPDF** + **jspdf-autotable** - Export PDF
- **React Icons** - Icon library
- **Font Awesome** - Icon library
- **Iconify** - Icon library

## Prerequisites

Pastikan sudah terinstall:

1. **Node.js** (v20.9 atau lebih baru)
   ```bash
   node --version
   ```

2. **npm** (biasanya sudah termasuk dengan Node.js)
   ```bash
   npm --version
   ```

3. **Backend API** sudah berjalan
   - Pastikan backend SAWmoto sudah running di `http://localhost:3000`
   - Lihat README backend untuk instalasi

## Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/bastiandev9-dotcom/SAWmoto.git
cd SAWmoto/nextjs-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Salin environment contoh:

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Untuk production, ganti dengan URL backend yang sesuai:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi berjalan di: `http://localhost:3001` (atau port lain jika 3000 terpakai)

### 5. Build untuk Production

```bash
npm run build
npm start
```

## Fitur

### Halaman Utama (/)
- Hero section dengan animasi
- Penjelasan metode SAW
- Card fitur utama

### Data Motor (/data)
- Tabel data motor Honda
- CRUD motor untuk admin yang sudah login
- 17 jenis motor tersedia

### Kalkulator SAW (/hitung)
- Input bobot kriteria
- Input nilai alternatif
- Kalkulasi otomatis normalisasi dan ranking

### Hasil Ranking (/hasil)
- Tabel ranking motor
- Visualisasi chart
- Export ke PDF

### Bandingkan (/bandingkan)
- Perbandingan motor side-by-side

### Login Admin (/login)
- Login admin untuk mengakses tambah/edit/hapus data
- Cookie JWT HTTP-only dan proteksi CSRF

### Tentang (/tentang)
- Informasi aplikasi
- Penjelasan metode SAW

## Project Structure

```
nextjs-frontend/
├── app/
│   ├── bandingkan/
│   │   └── page.tsx
│   ├── data/
│   │   └── page.tsx
│   ├── hasil/
│   │   └── page.tsx
│   ├── hitung/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── tentang/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.module.css
│   └── page.tsx
├── components/
│   ├── AnimationScript.tsx
│   ├── AuthProvider.tsx
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   ├── ThemeToggle.tsx
│   └── Toast.tsx
├── lib/
│   └── api.ts
├── public/
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

## API Integration

Frontend berkomunikasi dengan backend melalui endpoint:

- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Cek sesi admin
- `POST /api/auth/logout` - Logout admin
- `GET /api/motors` - Ambil semua motor
- `POST /api/motors` - Tambah motor baru, butuh admin + CSRF
- `PUT /api/motors/:id` - Update motor, butuh admin + CSRF
- `DELETE /api/motors/:id` - Hapus motor, butuh admin + CSRF
- `POST /api/motors/calculate/saw` - Hitung SAW ranking
- `GET /api/kriteria` - Ambil semua kriteria

Request frontend menggunakan `credentials: 'include'` agar cookie admin dikirim.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm start` | Jalankan production server |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL backend API | `http://localhost:3000/api` |
