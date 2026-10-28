# 🤖 Agent Instructions: Automated JobHunter Setup & Onboarding Wizard

Dokumen ini adalah instruksi operasional untuk AI Agent (Antigravity) yang menjalankan workspace ini.
Saat pengguna (user) membuka workspace ini atau meminta bantuan setup (misal: *"Halo Antigravity, tolong setup sistem job hunter ini buat aku"*), ikuti langkah-langkah di bawah ini secara ramah, terstruktur, dan proaktif.

---

## 🎯 Tujuan Utama Agent
Membantu pengguna (terutama pemula/non-IT) menyiapkan mesin otomasi pencarian kerja pribadi mereka dari nol hingga siap kirim email lamaran, **tanpa membebani pengguna dengan hal-hal teknis**.

---

## 📋 Prosedur Langkah Demi Langkah (Step-by-Step)

### LANGKAH 1: Sambut & Kumpulkan Data Profil Pengguna
Sapa pengguna dengan ramah dan jelaskan bahwa sistem ini akan bekerja secara privat menggunakan akun Google dan Google Sheet baru milik pengguna sendiri.

Minta pengguna memberikan data berikut (bisa bertahap atau sekaligus):
1. **Nama Lengkap:** (Contoh: Budi Pratama)
2. **Nomor WhatsApp & Email Gmail:** (Contoh: 0812xxxx & budi@gmail.com)
3. **Latar Belakang Pendidikan / Jurusan & Kampus:** (Contoh: S1 Manajemen Bisnis Universitas Padjadjaran)
4. **Portofolio / LinkedIn (Opsional):** Link LinkedIn atau website portofolio.
5. **Posisi/Lowongan yang Diincar:** (Contoh: *Marketing Specialist, Admin Operasional, Business Development*)
6. **Kota / Wilayah Target:** (Contoh: *Jakarta, Bandung, atau Remote*)
7. **Link File PDF CV di Google Drive:** (Pastikan pengguna sudah mengubah akses ke *"Siapa saja yang memiliki link / Anyone with the link (Viewer)"*).
8. **Link Google Sheet Baru:** (Minta pengguna membuat sheet kosong di `sheets.new` atau duplikasi template sheet, lalu berikan link-nya ke kamu).

---

### LANGKAH 2: Otomasi File Konfigurasi (`profile.json`)
Setelah mendapatkan data di atas:
1. Ekstrak **File ID CV Google Drive** dari URL yang diberikan pengguna:
   - Pola: Di antara `/d/` dan `/view` pada URL `https://drive.google.com/file/d/<CV_FILE_ID>/view...`
2. Simpan seluruh data tersebut ke file `profile.json` di root workspace:
   ```json
   {
     "full_name": "<NAMA_USER>",
     "phone": "<PHONE>",
     "email": "<EMAIL>",
     "portfolio_or_linkedin": "<LINK>",
     "education_background": "<JURUSAN>",
     "university": "<UNIVERSITAS>",
     "target_roles": ["<ROLE_1>", "<ROLE_2>"],
     "target_locations": ["<LOKASI>"],
     "cv_drive_file_id": "<CV_FILE_ID>",
     "google_sheet_url": "<SHEET_URL>"
   }
   ```
3. Buka file `sheets/Code.gs` dan otomatis ganti nilai konstanta:
   ```javascript
   const CV_DRIVE_FILE_ID = "<CV_FILE_ID_USER>";
   ```
   sehingga pengguna tidak perlu repot mengedit kode script sendiri!

---

### LANGKAH 3: Jalankan Mesin Scraper
Jalankan script pencari lowongan secara lokal di terminal Antigravity:
```bash
python3 engine/scraper.py --profile profile.json --max-jobs 40 --output-csv output_loker.csv
```
- Mesin ini akan menyaring lowongan aktif Indeed di Indonesia yang mencantumkan email HRD.
- Otomatis membuatkan draft cover letter sopan berbahasa Indonesia yang sudah disesuaikan dengan nama, gelar, dan kontak pengguna.

---

### LANGKAH 4: Masukkan Data ke Google Sheet Pengguna
1. Jika agent memiliki akses tools Google Sheets (`gsheets`), masukkan data langsung ke tab `Scraping data Loker` di Spreadsheet pengguna.
2. Jika pengguna belum menghubungkan integrasi CLI, instruksikan pengguna cara tercepat mengimpor file:
   - *"Buka Google Sheet kamu > Klik File > Impor > Upload file `output_loker.csv` > Pilih 'Gantikan spreadsheet' atau 'Sisipkan sheet baru'."*

---

### LANGKAH 5: Setup Apps Script di Google Sheet Pengguna
Pandu pengguna memasang menu blasting:
1. Di Google Sheet milik pengguna, klik menu atas: **Ekstensi** > **Apps Script**.
2. Hapus semua tulisan di editor Apps Script, lalu Copy-Paste seluruh isi file `sheets/Code.gs` yang sudah terisi ID CV miliknya.
3. Klik tombol **Simpan (Ikon Disket / Ctrl+S)**.
4. Kembali ke tab Google Sheet, lalu tekan **Refresh / F5**.
5. Menu baru **`🚀 Blast Lamaran`** akan muncul di bar atas!

---

### LANGKAH 6: Aturan Emas & Waktu Blasting
Ingatkan pengguna tentang SOP Anti-Spam Google:
- **Jeda Aman:** Selalu gunakan opsi **50 Detik** antar email (sudah disetel otomatis di script).
- **Golden Window:** Kirim lamaran pada jam kerja rekruter (**08:30 – 10:30 WIB**).
- **Batas Harian:** Maksimal 30–40 lamaran per hari untuk menjaga reputasi akun Gmail tetap bersih.
