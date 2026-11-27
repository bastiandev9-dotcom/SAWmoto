# SAWmoto

Sistem pendukung keputusan pemilihan motor Honda menggunakan metode SAW (Simple Additive Weighting).

## Komponen

- `backend/`: Express API, engine SAW, repository PostgreSQL, migrasi, dan seed.
- `nextjs-frontend/`: Next.js App Router untuk data motor, kalkulator, ranking, chart, dan PDF.
- `docker-compose.yml`: PostgreSQL 16 lokal sebagai alternatif.
- `.local/postgres`: cluster PostgreSQL 17 khusus SAWmoto, tidak di-commit.
- `PERBAIKAN_DAN_MIGRASI_POSTGRESQL.md`: rencana perbaikan dan migrasi MongoDB ke PostgreSQL.

## Quick Start

### 1. Database lokal khusus SAWmoto

Inisialisasi hanya sekali dari root project:

```bash
cd backend
npm run db:init -- -Password "sawmoto_local"
```

Setelah itu gunakan perintah harian dari folder `backend`:

```bash
npm run db:start
npm run db:status
npm run db:shell
npm run db:stop
```

Cluster disimpan di `.local/postgres`, berjalan di `127.0.0.1:55432`, dan tidak di-commit ke Git.

### 2. Backend

Dari root project:

```bash
cd backend
npm install
cp .env.example .env
npm run auth:hash-password -- "ganti-password-admin"
npm run db:migrate
npm run db:seed
npm run dev
```

### 3. Frontend

Dari root project:

```bash
cd nextjs-frontend
npm install
cp .env.example .env
npm run dev
```

Backend default berjalan di port `3000`, frontend di port `3001`.

Login admin tersedia di `http://localhost:3001/login`. Data motor dan perhitungan SAW dapat dilihat publik, tetapi tambah/edit/hapus membutuhkan login admin.

Alternatif Docker bila tersedia:

```bash
docker compose up -d db
```

## Migrasi Data MongoDB

Backup MongoDB terlebih dahulu, lalu jalankan dari folder `backend`:

```bash
npm run db:migrate-data
npm run db:migrate-data -- --apply
```

Perintah pertama melakukan dry run dan validasi. Perintah kedua menulis data yang sudah tervalidasi ke PostgreSQL.
