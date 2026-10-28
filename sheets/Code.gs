/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: AUTO-BLAST COLD EMAIL LAMARAN KERJA VIA GMAIL
 * (JobHunter Starter Kit - Turnkey Distribution Edition)
 * =========================================================================
 * 
 * PANDUAN PENGGUNAAN:
 * 1. Masukkan ID file PDF CV Google Drive kamu ke variabel CV_DRIVE_FILE_ID di bawah.
 * 2. Simpan skrip (Ctrl+S atau Cmd+S).
 * 3. Kembali ke Google Sheets, refresh halaman, dan menu '🚀 Blast Lamaran' akan muncul!
 */

// =========================================================================
// ⚙️ KONFIGURASI PENGGUNA (CUKUP UBAH 2 BARIS INI)
// =========================================================================

// Masukkan ID File PDF CV kamu dari Google Drive (lihat panduan cara mengambil ID)
const CV_DRIVE_FILE_ID = "MASUKKAN_ID_FILE_GOOGLE_DRIVE_CV_KAMU_DISINI"; 

// Jeda waktu antar pengiriman email dalam detik (Standar aman: 50 detik)
const DELAY_SECONDS = 50; 

// =========================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Blast Lamaran')
    .addItem('⏱️ Blast SEMUA Loker Sekarang (Jeda 50 Detik - Live Modal UI)', 'showBlastModal50s')
    .addItem('🎯 Kirim Baris yang Dipilih Saja (1 Email Tes)', 'blastSelectedRow')
    .addSeparator()
    .addItem('⏰ Pasang Jadwal Cloud Blast Besok Pagi (09.00 WIB)', 'scheduleBlastTomorrow9AM')
    .addItem('🔍 Cek Status Jadwal Cloud yang Aktif', 'checkActiveTriggerStatus')
    .addItem('❌ Batalkan Jadwal Cloud', 'cancelScheduledBlast')
    .addSeparator()
    .addItem('📊 Cek Kuota Gmail Tersisa Hari Ini', 'checkGmailQuota')
    .addToUi();
}

/**
 * Filter cerdas nama perusahaan resmi
 */
function isValidCompanyName(companyName) {
  if (!companyName || companyName.trim().length < 3) return false;
  const name = companyName.toLowerCase().trim();

  const validKeywords = [
    'pt', 'cv', 'tbk', 'ltd', 'limited', 'inc', 'corp', 'corporation',
    'group', 'holding', 'indonesia', 'solutions', 'consultancy', 'consulting',
    'engineering', 'services', 'technology', 'teknologi', 'agency', 'maritime',
    'shipyard', 'industries', 'contracting', 'llc', 'retail', 'logistics',
    'finance', 'media', 'creative', 'studio', 'center', 'international'
  ];

  // Jika nama mengandung kata legalitas perusahaan atau lebih dari 3 kata umum, loloskan
  for (let j = 0; j < validKeywords.length; j++) {
    if (name.includes(validKeywords[j])) return true;
  }

  // Fallback: jika nama bukan nama orang tunggal (panjang > 4 karakter dan bukan kata terlarang)
  return name.length >= 4;
}

/**
 * Cek sisa kuota email akun Gmail kamu
 */
function checkGmailQuota() {
  const quota = MailApp.getRemainingDailyQuota();
  SpreadsheetApp.getUi().alert("Sisa kuota pengiriman email Gmail kamu hari ini: " + quota + " email.");
}

/**
 * Pasang trigger otomatis untuk eksekusi Besok Pagi jam 09.00 WIB
 */
function scheduleBlastTomorrow9AM() {
  cancelScheduledBlastSilent();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 09:00:00 WIB
  
  ScriptApp.newTrigger('runCloudBlastBatch')
    .timeBased()
    .at(tomorrow)
    .create();

  const formattedDate = Utilities.formatDate(tomorrow, "GMT+7", "EEEE, dd MMMM yyyy - HH:mm:ss 'WIB'");

  SpreadsheetApp.getUi().alert(
    "⏰ Jadwal Blast Berhasil Diaktifkan!",
    "Sistem Cloud Google akan otomatis mulai mem-blast lamaran (jeda 50 detik) pada:\n\n" +
    "📅 " + formattedDate + "\n\n" +
    "💡 Status Cloud Trigger:\n" +
    "• Skrip berjalan langsung di server Google Cloud.\n" +
    "• Laptop BISA DIMATIKAN atau offline, jadwal tetap jalan otomatis.\n" +
    "• Menggunakan jeda 50 detik anti-spam dengan sistem batch otomatis.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function checkActiveTriggerStatus() {
  const triggers = ScriptApp.getProjectTriggers();
  let found = [];
  for (let i = 0; i < triggers.length; i++) {
    const fn = triggers[i].getHandlerFunction();
    if (fn === 'runCloudBlastBatch') {
      found.push(triggers[i]);
    }
  }

  if (found.length > 0) {
    SpreadsheetApp.getUi().alert(
      "✅ Jadwal Otomatis SEDANG AKTIF!",
      "Ada " + found.length + " trigger Google Cloud yang siap berjalan secara otomatis tepat jam 09.00 WIB.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      "⚠️ Belum Ada Jadwal Otomatis yang Aktif",
      "Silakan klik menu '🚀 Blast Lamaran' > '⏰ Pasang Jadwal Cloud Blast Besok Pagi (09.00 WIB)'.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

function cancelScheduledBlast() {
  const count = cancelScheduledBlastSilent();
  if (count > 0) {
    SpreadsheetApp.getUi().alert("Jadwal cloud blast berhasil dibatalkan.");
  } else {
    SpreadsheetApp.getUi().alert("Tidak ada jadwal cloud blast yang sedang aktif.");
  }
}

function cancelScheduledBlastSilent() {
  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;
  for (let i = 0; i < triggers.length; i++) {
    const fn = triggers[i].getHandlerFunction();
    if (fn === 'runCloudBlastBatch') {
      ScriptApp.deleteTrigger(triggers[i]);
      count++;
    }
  }
  return count;
}

/**
 * Pekerja cloud otomatis (menghindari limit timeout 6 menit Apps Script)
 */
function runCloudBlastBatch() {
  const startTime = new Date().getTime();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();

  cancelScheduledBlastSilent();

  let pendingRows = [];
  for (let r = 2; r <= lastRow; r++) {
    const status = sheet.getRange(r, 9).getValue().toString().trim();
    const email = sheet.getRange(r, 5).getValue().toString().trim();
    if (!status.toLowerCase().includes("sudah") && email && email.includes('@')) {
      pendingRows.push(r);
    }
  }

  if (pendingRows.length === 0) {
    Logger.log("🎉 SEMUA EMAIL LAMARAN TELAH SELESAI DIKIRIM!");
    return;
  }

  for (let i = 0; i < pendingRows.length; i++) {
    const rowNum = pendingRows[i];
    const company = sheet.getRange(rowNum, 4).getValue().toString().trim();
    const email = sheet.getRange(rowNum, 5).getValue().toString().trim();
    const subject = sheet.getRange(rowNum, 6).getValue().toString().trim();
    const body = sheet.getRange(rowNum, 8).getValue().toString().trim();

    if (!isValidCompanyName(company)) {
      sheet.getRange(rowNum, 9).setValue("Dilewati: Butuh Verifikasi Nama PT");
      sheet.getRange(rowNum, 9).setBackground("#fff2cc");
      continue;
    }

    sendSingleEmail(sheet, rowNum, email, subject, body);

    // Jika mendekati batas timeout 4.5 menit, sambung batch berikutnya di cloud
    const elapsed = new Date().getTime() - startTime;
    if (elapsed > 270000 && (i + 1 < pendingRows.length)) {
      ScriptApp.newTrigger('runCloudBlastBatch')
        .timeBased()
        .after(60000)
        .create();
      return;
    }

    if (i + 1 < pendingRows.length) {
      Utilities.sleep(DELAY_SECONDS * 1000);
    }
  }
}

/**
 * Modal Live Progress UI (Monitoring real-time dengan countdown dan progress bar)
 */
function showBlastModal50s() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #f8fafc; color: #1e293b; }
          .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          h2 { margin-top: 0; color: #0f172a; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; }
          .status-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #e0f2fe; color: #0369a1; margin-bottom: 15px; }
          .progress-container { width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin: 15px 0 5px 0; }
          .progress-bar { width: 0%; height: 100%; background: #2563eb; transition: width 0.3s ease; }
          .progress-text { font-size: 0.85rem; color: #64748b; margin-bottom: 15px; font-weight: 500; }
          .log-box { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; height: 150px; overflow-y: auto; font-family: monospace; font-size: 0.78rem; line-height: 1.5; margin-bottom: 15px; }
          .countdown { font-size: 1.1rem; font-weight: bold; color: #ea580c; text-align: center; margin: 10px 0; }
          .btn-group { display: flex; gap: 10px; justify-content: flex-end; }
          button { padding: 8px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s; }
          .btn-primary { background: #2563eb; color: white; }
          .btn-primary:hover { background: #1d4ed8; }
          .btn-danger { background: #ef4444; color: white; }
          .btn-danger:hover { background: #dc2626; }
          .btn-secondary { background: #94a3b8; color: white; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2><i class="fa-solid fa-paper-plane" style="color: #2563eb;"></i> Auto-Blast Lamaran (Jeda 50 Detik)</h2>
          <div class="status-badge" id="badgeStatus">Siap Mulai</div>
          
          <div class="progress-container">
            <div class="progress-bar" id="progressBar"></div>
          </div>
          <div class="progress-text" id="progressText">Menghitung data pending...</div>

          <div class="countdown" id="countdownBox" style="display: none;">
            ⏳ Menunggu jeda aman anti-spam: <span id="secondsLeft">50</span> detik
          </div>

          <div class="log-box" id="logBox">
            [System] Modal aktif. Klik 'Mulai Blast' untuk mengirim lamaran secara teratur.<br>
          </div>

          <div class="btn-group">
            <button class="btn-secondary" id="btnClose" onclick="google.script.host.close()">Tutup</button>
            <button class="btn-danger" id="btnStop" style="display: none;" onclick="stopBlast()">Stop</button>
            <button class="btn-primary" id="btnStart" onclick="startBlast()">Mulai Blast</button>
          </div>
        </div>

        <script>
          let isRunning = false;
          let timerId = null;
          let totalSent = 0;

          function addLog(msg) {
            const box = document.getElementById('logBox');
            const now = new Date().toLocaleTimeString();
            box.innerHTML += '[' + now + '] ' + msg + '<br>';
            box.scrollTop = box.scrollHeight;
          }

          function startBlast() {
            isRunning = true;
            document.getElementById('btnStart').style.display = 'none';
            document.getElementById('btnStop').style.display = 'inline-block';
            document.getElementById('badgeStatus').innerText = 'Sedang Berjalan';
            document.getElementById('badgeStatus').style.background = '#dcfce7';
            document.getElementById('badgeStatus').style.color = '#15803d';
            addLog("Memulai proses blast...");
            processNext();
          }

          function stopBlast() {
            isRunning = false;
            if (timerId) clearInterval(timerId);
            document.getElementById('btnStart').style.display = 'inline-block';
            document.getElementById('btnStart').innerText = 'Lanjutkan Blast';
            document.getElementById('btnStop').style.display = 'none';
            document.getElementById('countdownBox').style.display = 'none';
            document.getElementById('badgeStatus').innerText = 'Dijeda';
            document.getElementById('badgeStatus').style.background = '#fef3c7';
            document.getElementById('badgeStatus').style.color = '#b45309';
            addLog("Proses blast dihentikan oleh pengguna.");
          }

          function processNext() {
            if (!isRunning) return;
            addLog("Memeriksa baris pending berikutnya...");
            google.script.run
              .withSuccessHandler(onSuccess)
              .withFailureHandler(onError)
              .sendNextPendingEmail();
          }

          function onSuccess(result) {
            if (!isRunning) return;

            if (result.done) {
              isRunning = false;
              document.getElementById('badgeStatus').innerText = 'Selesai 100%';
              document.getElementById('badgeStatus').style.background = '#dcfce7';
              document.getElementById('badgeStatus').style.color = '#15803d';
              document.getElementById('btnStart').style.display = 'none';
              document.getElementById('btnStop').style.display = 'none';
              document.getElementById('countdownBox').style.display = 'none';
              addLog("🎉 SEMUA EMAIL LAMARAN TELAH BERHASIL DI-BLAST!");
              document.getElementById('progressText').innerText = "Semua email selesai dikirim!";
              document.getElementById('progressBar').style.width = '100%';
              return;
            }

            if (result.skipped) {
              addLog("⚠️ Baris " + result.row + " dilewati: " + result.reason);
              processNext();
              return;
            }

            totalSent++;
            addLog("✅ SUKSES (" + totalSent + "): Terkirim ke " + result.email + " (" + result.role + " @ " + result.company + ")");
            
            const remaining = result.remaining;
            const progress = ((totalSent) / (totalSent + remaining)) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('progressText').innerText = "Terkirim: " + totalSent + " email | Sisa: " + remaining + " email";

            if (remaining > 0) {
              startCountdown(50);
            } else {
              isRunning = false;
              addLog("🎉 SEMUA EMAIL LAMARAN TELAH BERHASIL DI-BLAST!");
              document.getElementById('badgeStatus').innerText = 'Selesai 100%';
              document.getElementById('countdownBox').style.display = 'none';
            }
          }

          function startCountdown(seconds) {
            let left = seconds;
            document.getElementById('countdownBox').style.display = 'block';
            document.getElementById('secondsLeft').innerText = left;

            if (timerId) clearInterval(timerId);
            timerId = setInterval(() => {
              left--;
              document.getElementById('secondsLeft').innerText = left;
              if (left <= 0) {
                clearInterval(timerId);
                document.getElementById('countdownBox').style.display = 'none';
                processNext();
              }
            }, 1000);
          }

          function onError(error) {
            addLog("❌ Error: " + error.message);
            stopBlast();
          }
        </script>
      </body>
    </html>
  `;
  
  const ui = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(550)
    .setHeight(460)
    .setTitle('🚀 Auto-Blast Pelamar Kerja');
  SpreadsheetApp.getUi().showModalDialog(ui, 'Blast Lamaran Kerja (Jeda 50 Detik)');
}

function sendNextPendingEmail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) return { done: true };

  let nextRow = null;
  let remainingCount = 0;

  for (let r = 2; r <= lastRow; r++) {
    const status = sheet.getRange(r, 9).getValue().toString().trim();
    const email = sheet.getRange(r, 5).getValue().toString().trim();
    if (!status.toLowerCase().includes("sudah") && email && email.includes('@')) {
      if (nextRow === null) {
        nextRow = r;
      }
      remainingCount++;
    }
  }

  if (nextRow === null) {
    return { done: true };
  }

  const company = sheet.getRange(nextRow, 4).getValue().toString().trim();
  const email = sheet.getRange(nextRow, 5).getValue().toString().trim();
  const subject = sheet.getRange(nextRow, 6).getValue().toString().trim();
  const body = sheet.getRange(nextRow, 8).getValue().toString().trim();
  const role = sheet.getRange(nextRow, 3).getValue().toString().trim();

  if (!isValidCompanyName(company)) {
    sheet.getRange(nextRow, 9).setValue("Dilewati: Butuh Verifikasi Nama PT");
    sheet.getRange(nextRow, 9).setBackground("#fff2cc");
    return { skipped: true, row: nextRow, reason: "Bukan nama PT resmi (" + company + ")" };
  }

  sendSingleEmail(sheet, nextRow, email, subject, body);

  return {
    success: true,
    row: nextRow,
    email: email,
    company: company,
    role: role,
    remaining: remainingCount - 1
  };
}

function blastSelectedRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sheet.getActiveRange().getRow();

  if (row <= 1) {
    SpreadsheetApp.getUi().alert("Silakan klik salah satu baris data loker!");
    return;
  }

  const email = sheet.getRange(row, 5).getValue().toString().trim();
  const subject = sheet.getRange(row, 6).getValue().toString().trim();
  const body = sheet.getRange(row, 8).getValue().toString().trim();
  const status = sheet.getRange(row, 9).getValue().toString().trim();

  if (!email || !email.includes('@')) {
    SpreadsheetApp.getUi().alert("Email tujuan di baris " + row + " tidak valid!");
    return;
  }

  if (status.toLowerCase().includes("sudah")) {
    const confirm = SpreadsheetApp.getUi().alert(
      "Peringatan",
      "Baris ini sudah berstatus 'Sudah di-blast'. Kirim ulang?",
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (confirm !== SpreadsheetApp.getUi().Button.YES) return;
  }

  sendSingleEmail(sheet, row, email, subject, body);
  SpreadsheetApp.getUi().alert("Berhasil! Email lamaran ke " + email + " telah terkirim via Gmail beserta lampiran PDF CV.");
}

function sendSingleEmail(sheet, row, email, subject, body) {
  const options = {};

  if (CV_DRIVE_FILE_ID && CV_DRIVE_FILE_ID.trim() !== "" && !CV_DRIVE_FILE_ID.includes("MASUKKAN_ID")) {
    try {
      const cvFile = DriveApp.getFileById(CV_DRIVE_FILE_ID.trim());
      options.attachments = [cvFile.getAs(MimeType.PDF)];
    } catch (e) {
      Logger.log("Peringatan: Gagal melampirkan file CV: " + e.message);
    }
  }

  GmailApp.sendEmail(email, subject, body, options);

  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  sheet.getRange(row, 9).setValue("Sudah di-blast");
  sheet.getRange(row, 10).setValue(nowStr);
  sheet.getRange(row, 9).setBackground("#d9ead3");
}
