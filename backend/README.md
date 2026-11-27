# SAWmoto Backend

Backend API untuk sistem pendukung keputusan pemilihan motor menggunakan metode SAW (Simple Additive Weighting) dan PostgreSQL.

## Tech Stack

- Node.js 20.19 atau lebih baru
- Express.js
- PostgreSQL 16
- `pg`
- `node-pg-migrate`
- JWT + bcryptjs
- Helmet + express-rate-limit
- CORS + CSRF token
- dotenv

## Prerequisites

- Node.js 20.19+
- npm
- Docker Desktop atau PostgreSQL 16 lokal

## Instalasi

```bash
npm install
cp .env.example .env
```

Contoh `.env`:

```env
DATABASE_URL=postgresql://sawmoto:sawmoto_local@127.0.0.1:55432/sawmoto
PORT=3000
CORS_ORIGIN=http://localhost:3001
PGSSLMODE=disable
PG_POOL_MAX=10
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=isi-dengan-hasil-npm-run-auth-hash-password
JWT_SECRET=isi-dengan-secret-acak-minimal-32-karakter
```

## Menjalankan PostgreSQL Lokal

Project memiliki cluster PostgreSQL khusus di `.local/postgres`, port `55432`, dan host `127.0.0.1`.

Inisialisasi hanya sekali:

```bash
npm run db:init -- -Password "sawmoto_local"
```

Perintah harian:

```bash
npm run db:start
npm run db:status
npm run db:shell
npm run db:stop
```

`npm run db:shell` membuka `psql` dan akan meminta password. Password lokal default adalah `sawmoto_local`.

Cluster tidak memengaruhi service PostgreSQL lama dan tidak di-commit karena `.local/` masuk `.gitignore`.

Jika ingin menggunakan Docker sebagai alternatif, jalankan dari root project:

```bash
docker compose up -d db
```

Sesuaikan `DATABASE_URL` jika menggunakan Docker pada port `5432`.

## Migrasi Database

Dari folder `backend`:

```bash
npm run db:migrate
```

Rollback satu migrasi:

```bash
npm run db:rollback
```

Membuat migrasi baru:

```bash
npx node-pg-migrate create nama_migrasi
```

## Seed Data

```bash
npm run db:seed
```

Seed bersifat idempotent dan tidak menghapus data yang sudah ada.

## Migrasi Data dari MongoDB

Backup MongoDB terlebih dahulu:

```bash
mongodump --uri "$MONGODB_URI" --out backups/mongo-before-postgresql
```

Tambahkan `MONGODB_URI` ke `.env`, lalu jalankan dry run:

```bash
npm run db:migrate-data
```

Jika validasi dry run berhasil, jalankan impor:

```bash
npm run db:migrate-data -- --apply
```

Script akan:

- memvalidasi field, tipe, angka, ID, key, dan relasi key/type;
- mengimpor `motors` dan `kriterias` ke tabel PostgreSQL;
- membandingkan checksum data hasil impor;
- tidak menghapus data MongoDB;
- tidak menghapus data PostgreSQL yang tidak termasuk dalam sumber.

## Menjalankan Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Server default berjalan di `http://localhost:3000`.

Dokumentasi API tersedia di `http://localhost:3000/docs`.

## Autentikasi Admin

Buat hash password admin:

```bash
npm run auth:hash-password -- "password-anda"
```

Simpan hash tersebut pada `ADMIN_PASSWORD_HASH` dan secret acak minimal 32 karakter pada `JWT_SECRET`.

Endpoint autentikasi:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login admin dan menerbitkan cookie JWT + CSRF |
| GET | `/api/auth/me` | Cek sesi admin aktif |
| POST | `/api/auth/logout` | Logout dan menghapus cookie |

Endpoint mutasi motor/kriteria membutuhkan:

- cookie `sawmoto_admin`;
- header `x-csrf-token` yang cocok dengan cookie `sawmoto_csrf`.

GET data dan perhitungan SAW tetap publik.

## Health Check

```bash
curl http://localhost:3000/health
```

Response HTTP 200 menunjukkan database siap. Response HTTP 503 menunjukkan database tidak dapat dihubungi.

## API Endpoints

### Motors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/motors` | Ambil semua data motor |
| GET | `/api/motors/:id` | Ambil motor berdasarkan ID |
| POST | `/api/motors` | Tambah motor baru |
| PUT | `/api/motors/:id` | Update parsial motor |
| DELETE | `/api/motors/:id` | Hapus motor |
| GET | `/api/motors/calculate/saw` | Hitung ranking SAW |
| POST | `/api/motors/calculate/saw` | Hitung SAW dengan subset dan bobot custom |

### Kriteria

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kriteria` | Ambil semua kriteria |
| POST | `/api/kriteria` | Tambah kriteria |
| PUT | `/api/kriteria/:id` | Update parsial kriteria |
| DELETE | `/api/kriteria/:id` | Hapus kriteria |

## Data Model

### Motor

```text
id      TEXT PRIMARY KEY
nama    TEXT NOT NULL
tipe    TEXT NOT NULL: Matic, Moped, Sport
harga   BIGINT NOT NULL >= 0
tangki  DOUBLE PRECISION NOT NULL >= 0
cc      INTEGER NOT NULL >= 0
```

### Kriteria

```text
id     TEXT PRIMARY KEY
label  TEXT NOT NULL
key    TEXT UNIQUE: harga, tangki, cc
type   TEXT: benefit, cost
bobot  DOUBLE PRECISION NOT NULL >= 0
```

Invariant kriteria:

- `harga` menggunakan `cost`.
- `tangki` menggunakan `benefit`.
- `cc` menggunakan `benefit`.
- Bobot memakai skala relatif, misalnya `5`, `3`, dan `4`.

## Algoritma SAW

1. Normalisasi:
   - Benefit: `r = nilai / max(nilai)`.
   - Cost: `r = min(nilai) / nilai`.
2. Nilai preferensi: `Vi = Σ (bobot × r)`.
3. Urutkan `Vi` menurun.
4. Berikan rank sequential dengan tie-breaker `id`.

## Testing

Unit test:

```bash
npm test
```

Integration test membutuhkan database PostgreSQL test terpisah. Buat database tersebut melalui `npm run db:shell`:

```sql
CREATE DATABASE sawmoto_test;
\q
```

Kemudian jalankan migrasi pada database test:

```bash
$env:DATABASE_URL="postgresql://sawmoto:sawmoto_local@127.0.0.1:55432/sawmoto_test"
npm run db:migrate
```

Jalankan integration test:

```bash
$env:TEST_DATABASE_URL="postgresql://sawmoto:sawmoto_local@127.0.0.1:55432/sawmoto_test"
npm run test:integration
```

Integration test akan men-truncate tabel `motors` dan `criteria`, sehingga jangan gunakan database pengembangan atau produksi.

## Deployment Supabase

1. Buat project Supabase.
2. Buat role database dengan hak minimum.
3. Simpan connection string sebagai secret deployment.
4. Aktifkan TLS dengan `PGSSLMODE=require` atau konfigurasi SSL yang sesuai.
5. Jalankan `npm run db:migrate` terhadap database Supabase.
6. Impor data atau restore backup PostgreSQL.
7. Verifikasi schema, constraint, jumlah data, dan perhitungan SAW.
8. Jangan menaruh service role key di frontend.
9. Set `NODE_ENV=production`, `CORS_ORIGIN` eksplisit, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, dan `JWT_SECRET` yang kuat.
10. Gunakan HTTPS agar cookie `secure` dapat dikirim.

Rencana lengkap migrasi dan perbaikan tersedia di `../PERBAIKAN_DAN_MIGRASI_POSTGRESQL.md`.

## Project Structure

```text
backend/
├── db/
│   └── pool.js
├── migrations/
├── middleware/
│   ├── auth.js
│   └── rateLimit.js
├── public/
├── repositories/
├── routes/
│   ├── auth.js
│   ├── motors.js
│   └── kriteria.js
├── scripts/
├── seeds/
├── lib/
├── test/
│   └── integration/
├── .env.example
├── package.json
└── server.js
```
