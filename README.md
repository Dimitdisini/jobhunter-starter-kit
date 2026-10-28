# 🚀 JobHunter Starter Kit
> **Turnkey Automated Job Search & Cold Email Outreach System**  
> *Sistem otomasi pencari lowongan kerja & pengirim lamaran personal via Google Sheets & Gmail dengan jeda anti-spam 50 detik dan lampiran CV resmi.*

Dirancang khusus untuk pengguna umum (**Non-IT Friendly**). Kamu **tidak perlu bisa ngoding sama sekali** — jika menggunakan [Google Antigravity](https://antigravity.google), AI Agent akan memandu dan mengeksekusi seluruh proses setup secara otomatis!

---

## ⚡ Cara Paling Cepat (Cukup Pakai Antigravity AI)

Jika kamu membuka repositori ini di dalam **Google Antigravity**, kamu tinggal menyapa AI di kolom chat dengan mengetik pesan seperti ini:

```text
Halo Antigravity! Tolong bantu aku setup sistem JobHunter ini dari nol sampai siap dipakai.

Ini data singkatku:
- Nama Lengkap: [Nama Kamu]
- No HP & Gmail: [Nomor WhatsApp & Email]
- Lulusan: [Jurusan & Kampus Kamu]
- Link Portofolio / LinkedIn: [Link LinkedIn/Website]
- Posisi yang Aku Incar: [Contoh: Project Coordinator, Marketing Specialist, Business Analyst]
- Lokasi Target: [Contoh: Jakarta / Bandung / Remote]
- Link PDF CV di Google Drive: [Link Google Drive CV Kamu]
- Link Google Sheet Baruku: [Link Google Sheet Kosong Kamu]
```

**Antigravity akan otomatis:**
1. Mengisi file profil konfigurasi (`profile.json`).
2. Menghubungkan ID CV Google Drive kamu ke script Google Sheets.
3. Mencari lowongan kerja aktif terbaru yang mencantumkan email HRD sesuai posisi incaranmu.
4. Menyiapkan surat lamaran (*cover letter*) otomatis yang sopan dan profesional.
5. Memasang menu pengiriman email di Google Sheet kamu.

---

## 🛠️ Setup Mandiri (Tanpa Antigravity)

Jika kamu ingin menyiapkannya secara manual tanpa bantuan AI, ikuti 4 langkah mudah di bawah ini:

### 1. Siapkan CV di Google Drive
1. Upload file PDF CV kamu ke [Google Drive](https://drive.google.com).
2. Klik kanan pada file CV > **Bagikan (Share)** > ubah akses menjadi **Siapa saja yang memiliki tautan (Anyone with the link - Viewer)**.
3. Salin tautan dan ambil kode acak di antara `/d/` dan `/view`:
   - Contoh URL: `https://drive.google.com/file/d/1NA83Rqj7D9uydwv-E5ZnJfvQ9bn4IKI6/view`
   - **ID File CV Kamu:** `1NA83Rqj7D9uydwv-E5ZnJfvQ9bn4IKI6`

### 2. Siapkan Google Spreadsheet Baru
1. Buat spreadsheet baru di [sheets.new](https://sheets.new).
2. Beri nama sheet: **`Database Lamaran Kerja`**.
3. Beri nama tab di pojok kiri bawah: **`Scraping data Loker`**.
4. Buat 10 judul kolom di Baris 1:
   | A | B | C | D | E | F | G | H | I | J |
   | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
   | **No** | **Link Postingan** | **Posisi** | **Perusahaan** | **Email Perusahaan** | **Subjek Email** | **Kategori** | **Draft Cover Letter** | **Keterangan Blast** | **Waktu Blast** |

### 3. Pasang Script Otomasi di Google Sheets
1. Di Google Sheet kamu, klik menu **Ekstensi** > **Apps Script**.
2. Hapus seluruh isi editor, lalu Copy-Paste seluruh isi file [`sheets/Code.gs`](sheets/Code.gs).
3. Di baris paling atas `Code.gs`, ganti `CV_DRIVE_FILE_ID` dengan ID file CV kamu dari Langkah 1:
   ```javascript
   const CV_DRIVE_FILE_ID = "MASUKKAN_ID_FILE_GOOGLE_DRIVE_CV_KAMU_DISINI";
   ```
4. Klik tombol **Simpan (Ikon Disket / Ctrl+S)**, lalu kembali ke Google Sheets dan **Refresh halaman**.
5. Menu baru **`🚀 Blast Lamaran`** akan muncul di baris menu atas!

### 4. Cari Lowongan & Kirim Lamaran
1. Salin file `profile.example.json` menjadi `profile.json`, lalu isi dengan data profil dan posisi incaranmu.
2. Jalankan mesin pencari loker di terminal:
   ```bash
   pip install -r engine/requirements.txt
   python3 engine/scraper.py --profile profile.json --max-jobs 40 --output-csv output_loker.csv
   ```
3. Buka Google Sheet kamu > **File** > **Impor** > Upload file `output_loker.csv`.
4. Untuk mulai mengirim lamaran, klik menu **`🚀 Blast Lamaran`** > **`⏱️ Blast SEMUA Loker Sekarang (Jeda 50 Detik - Live Modal UI)`**.

---

## ⚖️ Aturan Emas Anti-Spam (SOP Wajib Dipatuhi)

Agar email lamaranmu selalu masuk ke **Primary Inbox** HRD (bukan folder Spam/Promosi) dan akun Gmail kamu tetap aman:

- ⏳ **Jeda 50 Detik Antar Email:** Jangan pernah mempercepat pengiriman email. Jeda 50 detik meniru pola pengiriman manusia yang alami di mata filter keamanan Google.
- 🎯 **Kirim di Jam Kerja (Golden Window):** Waktu terbaik mengirim email lamaran adalah pukul **08:30 – 10:30 WIB** (pagi saat rekruter baru membuka email kerja).
- 📊 **Batas Harian (Daily Cap):** Cukup kirim **30 hingga 40 email per hari**. Konsistensi harian jauh lebih efektif dan aman dibanding mem-blast ratusan email sekaligus.

---

## 📁 Struktur Repositori

```text
jobhunter-starter-kit/
├── README.md               # Panduan ramah pemula (Dokumen ini)
├── AGENT_INSTRUCTIONS.md   # Prosedur otomatis untuk Antigravity AI Agent
├── profile.example.json    # Template data profil pencari kerja
├── .gitignore              # Menjaga file pribadi tetap privat
├── sheets/
│   └── Code.gs             # Google Apps Script (Modal UI, jeda 50s, auto-cloud blast)
└── engine/
    ├── scraper.py          # Mesin pencari loker Indeed GraphQL mandiri
    └── requirements.txt    # Dependensi minimal Python (hanya requests)
```

---

## 🔒 Privasi & Keamanan
- File `profile.json`, file CV PDF, dan file CSV hasil scraping secara otomatis diabaikan oleh `.gitignore` sehingga data pribadi kamu tidak akan pernah bocor ke internet saat repo di-push ke GitHub.
- Pengiriman email berlangsung langsung dari akun Gmail pribadimu melalui Google Apps Script resmi tanpa perantara pihak ketiga.
