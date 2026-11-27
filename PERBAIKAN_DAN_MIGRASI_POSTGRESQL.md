# Rencana Perbaikan SAWmoto dan Migrasi MongoDB ke PostgreSQL

## 1. Tujuan

Dokumen ini menjadi acuan perbaikan SAWmoto secara bertahap. Prioritas pertama adalah memindahkan penyimpanan data dari MongoDB/Mongoose ke PostgreSQL tanpa kehilangan data dan tanpa mengubah kontrak API yang digunakan frontend.

Target akhir:

- PostgreSQL menjadi satu-satunya database aplikasi.
- Pengembangan menggunakan PostgreSQL lokal.
- Deployment menggunakan Supabase PostgreSQL.
- Data motor dan kriteria lama tetap utuh.
- Backend, frontend, keamanan, testing, dan dokumentasi diperbaiki setelah migrasi database.

## 2. Keputusan Teknis

| Area | Keputusan |
|---|---|
| Branch | `feat/postgresql-migration` |
| Database target | PostgreSQL 16 |
| Database client | `pg` |
| Migrasi schema | SQL migration berversi |
| Pengembangan | PostgreSQL lokal melalui Docker Compose |
| Deployment | Supabase PostgreSQL |
| Data lama | Diekspor dari MongoDB, divalidasi, lalu diimpor ke PostgreSQL |
| ORM | Tidak menggunakan ORM baru |
| API | Pertahankan path, method, field bisnis, dan status response utama |
| MongoDB | Tetap tersedia untuk rollback sampai validasi selesai |

## 2.1 Status Implementasi

Sudah selesai dan diuji pada cluster sementara:

- branch `feat/postgresql-migration`;
- Docker Compose PostgreSQL 16;
- cluster PostgreSQL 17 lokal khusus SAWmoto di `.local/postgres`, port `55432`;
- script `db:init`, `db:start`, `db:stop`, `db:status`, dan `db:shell`;
- dependency `pg` dan migrasi SQL;
- tabel `motors` dan `kriteria` beserta constraint;
- repository PostgreSQL dan refactor route;
- health check readiness;
- seed idempotent dan non-destruktif;
- script migrasi MongoDB ke PostgreSQL dengan dry run, checksum, dan validasi;
- 17 unit test dan 1 integration test PostgreSQL;
- pengujian rollback, seed ulang, serta migrasi 17 motor dan 3 kriteria;
- migrasi data MongoDB aktual ke PostgreSQL dengan checksum yang sama;
- smoke test backend, frontend, dan perhitungan SAW;
- upgrade Next.js/jsPDF hingga audit frontend dan backend 0 kerentanan;
- autentikasi admin JWT dengan cookie HTTP-only dan CSRF token;
- CORS origin eksplisit, rate limit, Helmet, dan security header frontend;
- halaman login/logout serta proteksi kontrol CRUD di frontend;
- perbaikan logika harga cost pada halaman perbandingan;
- integration test untuk login, CSRF, CORS, duplicate, dan readiness database.

Belum dilakukan karena membutuhkan perubahan produk atau kredensial:

- deployment Supabase;
- perbaikan frontend lanjutan seperti loading/error boundary, validasi `localStorage`, dan aksesibilitas.

## 3. Kondisi Saat Ini

### Backend

- Express dan Mongoose berada langsung di route.
- Koleksi MongoDB: `motors` dan `kriterias`.
- Seed menghapus seluruh koleksi sebelum mengisi data.
- Tidak ada autentikasi atau otorisasi pada endpoint mutasi.
- Health check tidak memverifikasi koneksi database secara aktif.
- Default port backend `8080`, sedangkan frontend memakai `3000`.
- Perhitungan SAW membaca seluruh data dan menghitung ulang min/max untuk setiap motor.

### Frontend

- Next.js App Router dengan state lokal per halaman.
- Hasil SAW disimpan di `localStorage`.
- Kontrak utama API masih menggunakan field bisnis `id`, `nama`, `tipe`, `harga`, `tangki`, dan `cc`.
- Halaman perbandingan masih menganggap harga lebih mahal sebagai pemenang.
- Belum ada loading/error boundary, test frontend, serta script lint/typecheck.

### Database

- Skema sederhana dan cocok untuk dataset kecil.
- Unique index dideklarasikan melalui Mongoose.
- Tidak ada timestamp, audit trail, migrasi schema, backup, atau restore.
- `Kriteria.key` belum dibatasi pada field motor yang valid.
- Data motor dan kriteria dibaca terpisah tanpa snapshot bersama.

## 4. Arsitektur Target

```text
Next.js Frontend
      |
      | HTTP/JSON
      v
Express API
      |
      +-- Route dan validasi input
      +-- Repository PostgreSQL
      +-- Engine SAW murni
      |
      v
PostgreSQL
  - motors
  - criteria
```

Prinsip:

- Route tidak lagi mengetahui detail Mongoose atau SQL.
- Repository menangani query database.
- Engine SAW tetap menjadi fungsi murni tanpa I/O.
- Semua query menggunakan parameter binding.
- Schema PostgreSQL menjadi sumber validasi integritas data.

## 5. Fase 0: Persiapan dan Keamanan Data

1. Pastikan working tree bersih.
2. Buat branch `feat/postgresql-migration` dari `origin/main`.
3. Backup repository dan konfigurasi deployment.
4. Buat backup penuh MongoDB sebelum ekspor.
5. Catat jumlah dokumen, ID, key, dan checksum data sumber.
6. Jangan menjalankan seed lama karena bersifat destruktif.
7. Simpan MongoDB tetap aktif dan tidak diubah selama proses migrasi.

Perintah backup MongoDB contoh:

```bash
mongodump --uri "$MONGODB_URI" --out backups/mongo-before-postgresql
```

Sesuaikan perintah dengan MongoDB lokal atau Atlas yang digunakan.

## 6. Fase 1: Setup PostgreSQL Lokal

### 6.1 Cluster Lokal Khusus SAWmoto

Cluster utama pengembangan menggunakan PostgreSQL 17 yang sudah terpasang, tanpa mengubah service PostgreSQL lama:

- lokasi: `.local/postgres`;
- host: `127.0.0.1`;
- port: `55432`;
- user: `sawmoto`;
- password lokal: `sawmoto_local`;
- database: `sawmoto`;
- autentikasi: `scram-sha-256`.

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

### 6.2 Docker Compose

Docker Compose tersedia sebagai alternatif dengan:

- image `postgres:16-alpine`;
- database, user, dan password dari environment;
- volume persisten;
- healthcheck;
- port default `5432`.

### 6.3 Environment

Contoh konfigurasi pengembangan:

```env
DATABASE_URL=postgresql://sawmoto:sawmoto_local@127.0.0.1:55432/sawmoto
PORT=3000
CORS_ORIGIN=http://localhost:3001
PGSSLMODE=disable
```

Selama masa migrasi, `MONGODB_URI` masih diperlukan untuk ekspor data:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/sawmoto
```

### 6.4 Perintah Database

Script backend:

```bash
npm run db:migrate
npm run db:rollback
npm run db:seed
npm run db:migrate-data
```

Gunakan database test terpisah agar integration test tidak menyentuh data pengembangan.

## 7. Rancangan Schema PostgreSQL

### 7.1 Tabel `motors`

| Field | Tipe | Constraint |
|---|---|---|
| `id` | `TEXT` | Primary key, tidak kosong |
| `nama` | `TEXT` | Not null, tidak kosong |
| `tipe` | `TEXT` | `Matic`, `Moped`, atau `Sport` |
| `harga` | `BIGINT` | Tidak negatif, dalam rentang aman JavaScript |
| `tangki` | `DOUBLE PRECISION` | Tidak negatif dan finite |
| `cc` | `INTEGER` | Tidak negatif |
| `created_at` | `TIMESTAMPTZ` | Default waktu sekarang |
| `updated_at` | `TIMESTAMPTZ` | Diperbarui saat data berubah |

### 7.2 Tabel `kriteria`

| Field | Tipe | Constraint |
|---|---|---|
| `id` | `TEXT` | Primary key, tidak kosong |
| `label` | `TEXT` | Not null, tidak kosong |
| `key` | `TEXT` | Unique dan hanya `harga`, `tangki`, `cc` |
| `type` | `TEXT` | `benefit` atau `cost` |
| `bobot` | `DOUBLE PRECISION` | Tidak negatif dan finite |
| `created_at` | `TIMESTAMPTZ` | Default waktu sekarang |
| `updated_at` | `TIMESTAMPTZ` | Diperbarui saat data berubah |

Invariant domain:

- `harga` harus bertipe `cost`.
- `tangki` harus bertipe `benefit`.
- `cc` harus bertipe `benefit`.
- Bobot menggunakan skala relatif yang konsisten dengan seed dan slider frontend.
- Urutan query default menggunakan `id` agar hasil tie lebih deterministik.

Catatan implementasi:

- Driver `pg` dapat mengembalikan `BIGINT` sebagai string.
- Repository harus mengonversi `harga` menjadi number setelah memastikan nilainya aman.
- Jangan bergantung pada field `_id` atau `__v` dari MongoDB.

## 8. Refactor Backend

File yang akan diubah:

- `backend/server.js`
- `backend/routes/motors.js`
- `backend/routes/kriteria.js`
- `backend/seeds/seedData.js`
- `backend/package.json`
- `backend/.env.example`
- `backend/README.md`

Struktur baru:

```text
backend/
├── db/
│   └── pool.js
├── migrations/
├── repositories/
│   ├── motorRepository.js
│   └── kriteriaRepository.js
├── routes/
├── lib/
│   └── saw.js
├── seeds/
│   └── seedData.js
└── test/
```

Tanggung jawab:

- `pool.js`: connection pool dan konfigurasi TLS.
- Repository: query SQL parameterized.
- Route: validasi HTTP dan pemetaan error.
- `saw.js`: normalisasi dan perankingan.
- Seed: upsert non-destruktif.

Pemetaan error PostgreSQL:

| Kode | HTTP | Keterangan |
|---|---:|---|
| `23505` | 409 | Duplikat ID atau key |
| `23514` | 400 | Pelanggaran check constraint |
| `22P02` | 400 | Format angka tidak valid |
| lainnya | 500 | Error database internal |

Health check harus:

- menjalankan query ringan seperti `SELECT 1`;
- mengembalikan HTTP 503 ketika database tidak siap;
- membedakan liveness dan readiness bila diperlukan.

## 9. Migrasi Data MongoDB ke PostgreSQL

### 9.1 Preflight Validation

Sebelum ekspor/impor, periksa:

- dokumen motor memiliki seluruh field wajib;
- `id` motor unik dan tidak kosong;
- `harga`, `tangki`, dan `cc` numerik serta tidak negatif;
- tipe motor sesuai enum;
- `id` dan `key` kriteria unik;
- key kriteria sesuai field motor;
- type kriteria sesuai invariant domain;
- bobot numerik, finite, dan tidak negatif.

Data yang tidak valid harus dilaporkan dan diperbaiki sebelum cutover.

### 9.2 Ekspor

Ekspor koleksi `motors` dan `kriterias` ke JSON. Alternatif:

- `mongoexport`;
- script Node satu kali menggunakan driver MongoDB;
- backup `mongodump` yang direstore ke database staging.

Simpan hasil ekspor di luar direktori yang di-commit karena dapat memuat data produksi.

### 9.3 Impor

- Jalankan migrasi schema terlebih dahulu.
- Gunakan staging table atau proses idempotent.
- Masukkan data dalam transaksi.
- Gunakan `ON CONFLICT` hanya setelah aturan konflik ditetapkan.
- Jangan menghapus data PostgreSQL yang sudah ada tanpa persetujuan eksplisit.

### 9.4 Validasi

Bandingkan MongoDB dan PostgreSQL:

1. Jumlah motor.
2. Jumlah kriteria.
3. Himpunan ID motor.
4. Himpunan ID dan key kriteria.
5. Nilai nama, tipe, harga, tangki, CC, type, dan bobot.
6. Hasil perhitungan SAW dengan bobot default.
7. Hasil perhitungan SAW untuk subset dan bobot override.

Bila hasil berbeda, hentikan cutover dan simpan MongoDB sebagai sumber aktif.

## 10. Seed PostgreSQL

Seed baru harus:

- menggunakan data 17 motor dan 3 kriteria yang sama;
- idempotent;
- tidak menjalankan `TRUNCATE` atau `DELETE`;
- menampilkan jumlah data yang ditambahkan atau diperbarui;
- dapat dijalankan pada database kosong tanpa error;
- memiliki opsi reset terpisah yang hanya boleh digunakan pada database test.

## 11. Testing

### 11.1 Unit Test

Pertahankan test `lib/saw.js` dan tambahkan:

- key tidak valid;
- nilai nonfinite;
- cost ketika minimum nol;
- tie ranking;
- subset motor;
- bobot nol dan bobot ekstrem.

### 11.2 Integration Test PostgreSQL

Gunakan database test nyata untuk menguji:

- migrasi schema;
- CRUD motor;
- CRUD kriteria;
- unique constraint;
- check constraint;
- duplicate response 409;
- subset SAW;
- seed idempotent;
- health check ketika database tersedia dan terputus.

### 11.3 Smoke Test Frontend

Pastikan halaman berikut tetap bekerja:

- `/data`: memuat, menambah, mengedit, dan menghapus motor.
- `/hitung`: memilih motor dan menghitung SAW.
- `/hasil`: menampilkan ranking, chart, dan PDF.
- `/api/health`: melaporkan readiness database.

## 12. Cutover dan Rollback

### Cutover

1. Selesaikan migrasi schema.
2. Impor dan validasi data.
3. Jalankan integration test.
4. Deploy backend PostgreSQL sebagai instance terpisah atau versi baru.
5. Arahkan frontend ke backend PostgreSQL.
6. Amati error, latency, dan hasil API.
7. Setelah stabil, buat MongoDB menjadi read-only.

### Rollback

Rollback dapat dilakukan selama:

- backend versi MongoDB masih tersedia;
- MongoDB belum dihentikan;
- backup MongoDB valid;
- tidak ada penulisan baru yang hanya ada di PostgreSQL.

Jika sudah ada penulisan baru di PostgreSQL, rollback memerlukan ekspor data terbaru atau dual-write. Untuk project ini, lakukan cutover pada jendela pemeliharaan singkat agar risiko tersebut tidak muncul.

## 13. Deployment ke Supabase

1. Buat project Supabase.
2. Buat role database dengan hak minimum.
3. Simpan password dan connection string sebagai secret deployment.
4. Aktifkan TLS dan pembatasan jaringan bila tersedia.
5. Jalankan migrasi SQL yang sama dengan lokal.
6. Impor data atau restore backup PostgreSQL lokal.
7. Verifikasi schema, indeks, constraint, jumlah data, dan SAW.
8. Konfigurasi backup dan retention sesuai layanan yang dipilih.
9. Jangan menaruh `service_role key` di frontend.
10. Frontend tetap mengakses backend Express, bukan database Supabase secara langsung.

Gunakan koneksi yang mendukung migration dan query biasa. Hindari menggunakan transaction pooler untuk proses yang membutuhkan sesi atau advisory lock jika tooling tidak mendukungnya.

## 14. Backlog Setelah Migrasi Database

### Prioritas Tinggi

1. Deployment Supabase dengan secret, TLS, dan CORS produksi.
2. Backup, restore, dan prosedur insiden database.
3. Audit trail untuk perubahan data admin.
4. CI untuk test, audit, build, dan migrasi.

### Prioritas Menengah

1. Tambahkan loading, error, retry, dan pending state.
2. Validasi respons API dan `localStorage`.
3. Hapus interceptor navigasi full-page reload.
4. Tambahkan pagination dan projection query.

### Prioritas Rendah

1. Perbaiki aksesibilitas keyboard dan screen reader.
2. Hormati `prefers-reduced-motion`.
3. Kurangi animasi global dan konsumsi CPU.
4. Rapikan dependency ikon dan font.
5. Selaraskan README, OpenAPI, port, dan versi Node.
6. Tambahkan metadata frontend dan konfigurasi deployment.

## 15. Acceptance Criteria Migrasi Database

- [x] Branch `feat/postgresql-migration` digunakan untuk seluruh perubahan.
- [x] PostgreSQL lokal dapat dijalankan melalui Docker Compose.
- [x] Migrasi schema dapat dijalankan dan di-rollback.
- [x] Tabel `motors` dan `kriteria` memiliki constraint yang diuji.
- [x] Backend tidak lagi menggunakan Mongoose.
- [x] API mempertahankan kontrak yang digunakan frontend.
- [x] Data MongoDB aktual terimpor dengan jumlah dan isi yang sesuai.
- [x] Hasil SAW sebelum dan sesudah cutover data aktual identik.
- [x] Seed idempotent dan non-destruktif.
- [x] Health check mengembalikan 503 saat database tidak siap.
- [x] Integration test PostgreSQL lulus.
- [x] Smoke test frontend terhadap database PostgreSQL aktual lulus.
- [x] Prosedur backup, cutover, dan rollback terdokumentasi.
- [x] MongoDB tidak dihentikan sebelum validasi cutover selesai.

## 16. Definition of Done

Migrasi database dianggap selesai apabila aplikasi berjalan penuh dengan PostgreSQL, data lama tervalidasi, frontend tetap berfungsi, test lulus, dan prosedur operasional Supabase telah terdokumentasi. Perbaikan frontend, autentikasi, dan optimasi lanjutan dapat dikerjakan setelah milestone ini.
