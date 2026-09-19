# SAWmoto Backend

Backend API untuk sistem pendukung keputusan pemilihan motor menggunakan metode SAW (Simple Additive Weighting).

## Tech Stack

- **Node.js** (v16+)
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM MongoDB
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables

## Prerequisites

Pastikan sudah terinstall:

1. **Node.js** (v16 atau lebih baru)
   ```bash
   node --version
   ```

2. **MongoDB** (local atau cloud)
   - Local: Install MongoDB Community Server
   - Cloud: Gunakan MongoDB Atlas

3. **npm** (biasanya sudah termasuk dengan Node.js)
   ```bash
   npm --version
   ```

## Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/bastiandev9-dotcom/SAWmoto.git
cd SAWmoto/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di folder `backend/`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/sawmoto
PORT=3000
```

Untuk MongoDB Atlas, ganti `MONGODB_URI` dengan connection string dari Atlas:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sawmoto
```

### 4. Jalankan MongoDB (jika menggunakan local)

```bash
# Windows
net start MongoDB

# macOS/Linux
mongod
```

### 5. Jalankan Server

Development mode (dengan auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server berjalan di: `http://localhost:3000`

## API Endpoints

### Motors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/motors` | Ambil semua data motor |
| GET | `/api/motors/:id` | Ambil motor berdasarkan ID |
| GET | `/api/motors/calculate/saw` | Hitung ranking SAW |
| POST | `/api/motors` | Tambah motor baru |
| PUT | `/api/motors/:id` | Update data motor |
| DELETE | `/api/motors/:id` | Hapus motor |

### Kriteria

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kriteria` | Ambil semua kriteria |

## Data Model

### Motor

```javascript
{
  id: String,
  nama: String,
  tipe: String,
  harga: Number,
  tangki: Number,
  cc: Number
}
```

### Kriteria

```javascript
{
  id: String,
  label: String,
  key: String,
  type: String,  // "benefit" atau "cost"
  bobot: Number  // 0-1
}
```

## Algoritma SAW

Simple Additive Weighting (SAW) adalah metode pengambilan keputusan dengan langkah:

1. **Normalisasi** - Konversi nilai kriteria ke skala 0-1
   - Benefit: `r = nilai / max(nilai)`
   - Cost: `r = min(nilai) / nilai`

2. **Perankingan** - Hitung nilai preferensi
   - `V = Σ (bobot × r)` untuk setiap alternatif

3. **Sorting** - Urutkan berdasarkan nilai V tertinggi

## Project Structure

```
backend/
├── models/
│   ├── Motor.js
│   └── Kriteria.js
├── routes/
│   ├── motors.js
│   └── kriteria.js
├── .env
├── package.json
└── server.js
```
