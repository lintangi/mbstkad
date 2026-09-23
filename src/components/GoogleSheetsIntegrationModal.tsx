import React, { useState } from 'react';
import {
  Database,
  Code2,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Radio,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
} from 'lucide-react';
import { useApp, DEFAULT_SPREADSHEET_ID, DEFAULT_GAS_URL } from '../context/AppContext';

export const GoogleSheetsIntegrationModal: React.FC = () => {
  const {
    spreadsheetId,
    setSpreadsheetId,
    autoSyncEnabled,
    setAutoSyncEnabled,
    gasWebhookUrl,
    setGasWebhookUrl,
    lastGasSyncTime,
    isSyncing,
    syncStatus,
    syncMessage,
    syncWithGoogleSheets,
    pullFromGoogleSheets,
    questions,
    currentUser,
    setActiveTab: setAppTab,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'connect' | 'code_gs' | 'schema'>('connect');
  const [copied, setCopied] = useState(false);
  const [localMessage, setLocalMessage] = useState<{ success: boolean; text: string } | null>(null);

  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pengaturan integrasi Google Sheets & Google Apps Script (GAS) hanya dapat diakses oleh Administrator.
          </p>
          <button
            onClick={() => setAppTab('dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const defaultId = DEFAULT_SPREADSHEET_ID;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId || defaultId}/edit`;

  const googleAppsScriptCode = `/**
 * ==============================================================================
 * SISTEM MANAJEMEN BANK SOAL TKAD-ADIWERNA - GOOGLE APPS SCRIPT CONNECTOR
 * MODEL: SINKRONISASI APPEND-ONLY & ARSIP RIWAYAT OTOMATIS (NON-DESTRUCTIVE)
 * ==============================================================================
 * Basis Data Default: Google Spreadsheet
 * ID: ${spreadsheetId || defaultId}
 * Link: https://docs.google.com/spreadsheets/d/${spreadsheetId || defaultId}/edit
 * ==============================================================================
 * PRINSIP KERJA SINKRONISASI:
 * 1. Data lama yang sudah dipush ke Spreadsheet TIDAK AKAN HILANG / TERTIMPA.
 * 2. Setiap pembaruan butir soal akan menambahkan baris baru dengan status 'AKTIF',
 *    sedangkan baris versi lama diubah statusnya menjadi 'TIDAK_AKTIF' (Arsip Riwayat).
 * 3. Butir soal yang dihapus dari aplikasi diubah status datanya menjadi 'TIDAK_AKTIF' / 'DIHAPUS'.
 * 4. Aplikasi hanya memuat dan menampilkan butir soal dengan status data 'AKTIF'.
 * ==============================================================================
 */

const DEFAULT_SPREADSHEET_ID = '${spreadsheetId || defaultId}';

const SHEET_NAMES = {
  SOAL: 'Soal_TKAD',
  USERS: 'Pengguna_Sistem',
  VERSI: 'Versi_Log',
  REVIEW: 'Review_History',
  AUDIT: 'Audit_Trail',
  CONFIG: 'System_Config'
};

const SOAL_HEADERS = [
  'ID', 'Kode', 'Subtes', 'Topik', 'Tipe', 'Kesulitan', 'Bobot_Skor',
  'Teks_Soal', 'Kunci_Jawaban', 'Pembahasan', 'Status_Review', 'Versi', 
  'Penyusun', 'Status_Data', 'Dibuat_Pada', 'Diperbarui_Pada', 'Waktu_Sinkron'
];

function getDatabaseSpreadsheet(e) {
  try {
    if (e && e.parameter && e.parameter.spreadsheetId) {
      return SpreadsheetApp.openById(e.parameter.spreadsheetId);
    }
    return SpreadsheetApp.openById(DEFAULT_SPREADSHEET_ID);
  } catch (err) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Endpoint GET: Membaca data bank soal aktif dari Spreadsheet
 */
function doGet(e) {
  try {
    const ss = getDatabaseSpreadsheet(e);
    initDatabaseSheets(ss);

    const sheetSoal = ss.getSheetByName(SHEET_NAMES.SOAL);
    const rows = sheetSoal.getDataRange().getValues();
    
    if (rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        total: 0,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const headers = rows[0];
    const includeInactive = e && e.parameter && e.parameter.includeInactive === 'true';
    const statusDataIdx = headers.indexOf('Status_Data');
    
    const activeMap = new Map();
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const id = row[0];
      if (!id || String(id).toLowerCase() === 'id') continue;

      const statusDataVal = statusDataIdx !== -1 ? String(row[statusDataIdx]).trim().toUpperCase() : 'AKTIF';
      
      // Jika includeInactive false, abaikan baris yang TIDAK_AKTIF / DIHAPUS / TERGANTIKAN
      if (!includeInactive && (statusDataVal === 'TIDAK_AKTIF' || statusDataVal === 'DIHAPUS' || statusDataVal === 'TERGANTIKAN')) {
        continue;
      }

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      
      // Simpan item aktif terbaru
      activeMap.set(String(id), obj);
    }

    const resultList = Array.from(activeMap.values());

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      total: resultList.length,
      data: resultList
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST: Menangani sinkronisasi non-destruktif (Append-Only) dari aplikasi
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (t) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Server Google Apps Script sedang sibuk mengunci database, silakan coba lagi.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const ss = getDatabaseSpreadsheet(e);
    initDatabaseSheets(ss);

    let payload = {};
    const rawContent = e && e.postData && e.postData.contents ? e.postData.contents : '';
    
    if (rawContent) {
      try {
        payload = JSON.parse(rawContent);
      } catch (err) {
        if (e.parameter && e.parameter.payload) {
          payload = JSON.parse(e.parameter.payload);
        }
      }
    } else if (e.parameter && e.parameter.payload) {
      payload = JSON.parse(e.parameter.payload);
    }

    const action = payload.action || (e.parameter ? e.parameter.action : '');

    if (action === 'SYNC_ALL' || action === 'PUSH_DATA' || action === 'PUSH_QUESTION') {
      const sheetSoal = ss.getSheetByName(SHEET_NAMES.SOAL);
      const incomingQuestions = payload.questions || [];
      const deletedIds = new Set(payload.deletedQuestionIds || []);
      const syncTime = new Date().toISOString();

      // Baca seluruh data baris yang sudah ada di sheet
      const existingDataRange = sheetSoal.getDataRange();
      const existingValues = existingDataRange.getValues();

      // Cari indeks kolom Status_Data, ID, dan Versi
      let headers = existingValues[0] || [];
      let statusDataColIndex = headers.indexOf('Status_Data');
      
      // Jika kolom Status_Data belum ada (misal versi lama sheet), upgrade header
      if (statusDataColIndex === -1) {
        sheetSoal.clearContents();
        sheetSoal.appendRow(SOAL_HEADERS);
        sheetSoal.getRange(1, 1, 1, SOAL_HEADERS.length).setFontWeight('bold').setBackground('#E2E8F0');
        headers = SOAL_HEADERS;
        statusDataColIndex = 13; // index 13 = kolom 14
      }

      // Pemetaan baris-baris aktif saat ini berdasarkan ID
      // Map<QuestionID, Array<{ rowIndex: number, version: string, text: string }>>
      const activeRowsMap = new Map();
      for (let i = 1; i < existingValues.length; i++) {
        const row = existingValues[i];
        const rowId = String(row[0]);
        if (!rowId) continue;
        
        const currentStatusData = String(row[statusDataColIndex] || 'AKTIF').trim().toUpperCase();
        if (currentStatusData === 'AKTIF') {
          if (!activeRowsMap.has(rowId)) {
            activeRowsMap.set(rowId, []);
          }
          activeRowsMap.get(rowId).push({
            sheetRowNumber: i + 1, // 1-based index untuk SpreadsheetApp
            version: String(row[11] || '1.0'),
            text: String(row[7] || ''),
            reviewStatus: String(row[10] || '')
          });
        }
      }

      const rowsToAppend = [];
      const rowsToMarkInactive = [];

      // 1. Proses setiap butir soal dari aplikasi
      incomingQuestions.forEach(q => {
        const qId = String(q.id);
        let answerData = '';
        if (q.options) answerData = JSON.stringify(q.options);
        else if (q.matchingPairs) answerData = JSON.stringify(q.matchingPairs);
        else if (q.trueFalseItems) answerData = JSON.stringify(q.trueFalseItems);
        else if (q.shortAnswerKey) answerData = q.shortAnswerKey;
        else if (q.essayRubric) answerData = q.essayRubric;

        const existingActiveEntries = activeRowsMap.get(qId);

        if (existingActiveEntries && existingActiveEntries.length > 0) {
          // Soal ini sudah pernah ada di sheet.
          // Cek apakah ada perubahan versi, teks soal, atau status review
          const latestEntry = existingActiveEntries[existingActiveEntries.length - 1];
          const hasChanged = (latestEntry.version !== String(q.version)) || 
                             (latestEntry.text !== String(q.prompt)) || 
                             (latestEntry.reviewStatus !== String(q.status));

          if (hasChanged) {
            // Tandai baris lama sebagai 'TIDAK_AKTIF'
            existingActiveEntries.forEach(entry => {
              rowsToMarkInactive.push(entry.sheetRowNumber);
            });

            // Tambahkan baris versi terbaru sebagai 'AKTIF'
            rowsToAppend.push([
              q.id,
              q.code,
              q.subtest,
              q.topic,
              q.type,
              q.difficulty,
              q.defaultScore,
              q.prompt,
              answerData,
              q.explanation || '',
              q.status,
              q.version,
              q.createdByName,
              'AKTIF',
              q.createdAt || syncTime,
              q.updatedAt || syncTime,
              syncTime
            ]);
          }
        } else {
          // Soal baru yang belum pernah tercatat di sheet
          rowsToAppend.push([
            q.id,
            q.code,
            q.subtest,
            q.topic,
            q.type,
            q.difficulty,
            q.defaultScore,
            q.prompt,
            answerData,
            q.explanation || '',
            q.status,
            q.version,
            q.createdByName,
            'AKTIF',
            q.createdAt || syncTime,
            q.updatedAt || syncTime,
            syncTime
          ]);
        }
      });

      // 2. Tandai soal yang dihapus dari aplikasi sebagai 'TIDAK_AKTIF' / 'DIHAPUS'
      deletedIds.forEach(delId => {
        const activeEntries = activeRowsMap.get(String(delId));
        if (activeEntries) {
          activeEntries.forEach(entry => {
            rowsToMarkInactive.push(entry.sheetRowNumber);
          });
        }
      });

      // 3. Terapkan perubahan status 'TIDAK_AKTIF' pada baris-baris lama tanpa menghapus datanya
      rowsToMarkInactive.forEach(rowNum => {
        sheetSoal.getRange(rowNum, statusDataColIndex + 1).setValue('TIDAK_AKTIF');
      });

      // 4. Tambahkan seluruh baris baru ke akhir sheet
      rowsToAppend.forEach(row => {
        sheetSoal.appendRow(row);
      });

      // 5. Catat Versi Log Riwayat ke Sheet Versi_Log jika tersedia
      const sheetVersi = ss.getSheetByName(SHEET_NAMES.VERSI);
      if (sheetVersi) {
        incomingQuestions.forEach(q => {
          if (q.versions && Array.isArray(q.versions) && q.versions.length > 0) {
            const latestVer = q.versions[q.versions.length - 1];
            sheetVersi.appendRow([
              'ver-' + Date.now() + '-' + Math.floor(Math.random()*1000),
              q.id,
              q.code,
              latestVer.versionNumber || q.version,
              latestVer.timestamp || syncTime,
              latestVer.modifiedBy || q.createdByName,
              latestVer.changeSummary || 'Pembaruan data soal',
              JSON.stringify(latestVer.snapshot || {})
            ]);
          }
        });
      }

      // 6. Catat Audit Trail ke Sheet Audit_Trail
      if (payload.auditLogs && Array.isArray(payload.auditLogs) && payload.auditLogs.length > 0) {
        const sheetAudit = ss.getSheetByName(SHEET_NAMES.AUDIT);
        if (sheetAudit) {
          payload.auditLogs.slice(0, 30).forEach(log => {
            sheetAudit.appendRow([
              log.id,
              log.timestamp,
              log.userName,
              log.userRole,
              log.action,
              log.questionCode || '-',
              log.details
            ]);
          });
        }
      }

      // 7. Perbarui / Merge Pengguna Sistem tanpa menghapus pengguna lama
      if (payload.users && Array.isArray(payload.users) && payload.users.length > 0) {
        const sheetUsers = ss.getSheetByName(SHEET_NAMES.USERS);
        if (sheetUsers) {
          const userRows = sheetUsers.getDataRange().getValues();
          const existingEmails = new Set();
          for (let u = 1; u < userRows.length; u++) {
            if (userRows[u][2]) existingEmails.add(String(userRows[u][2]).toLowerCase());
          }

          payload.users.forEach(u => {
            if (!existingEmails.has(String(u.email).toLowerCase())) {
              sheetUsers.appendRow([
                u.id,
                u.name,
                u.email,
                u.role,
                u.department || '',
                u.status || 'aktif',
                u.avatar || '',
                u.createdAt || syncTime
              ]);
            }
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Sinkronisasi non-destruktif sukses: ' + rowsToAppend.length + ' baris baru ditambahkan (AKTIF), ' + rowsToMarkInactive.length + ' baris diarsipkan (TIDAK_AKTIF). Data lama tetap aman tersimpan.',
        appended: rowsToAppend.length,
        archived: rowsToMarkInactive.length,
        timestamp: syncTime
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'UPLOAD_MEDIA' || action === 'UPLOAD_FILE') {
      const folderId = payload.folderId || '1Adx3ZBQrcOx_X2iWWzag05xsywaHyOoC';
      let targetFolder;
      try {
        targetFolder = DriveApp.getFolderById(folderId);
      } catch (fErr) {
        targetFolder = DriveApp.getRootFolder();
      }

      const rawBase64 = (payload.base64 || '').replace(/^data:.*?;base64,/, '');
      const decodedBytes = Utilities.base64Decode(rawBase64);
      const mimeType = payload.filetype || 'image/png';
      const fileName = payload.filename || ('media_' + Date.now() + '.png');
      const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      const file = targetFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const fileId = file.getId();
      const directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
      const viewUrl = file.getUrl();

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        fileId: fileId,
        name: file.getName(),
        url: directUrl,
        viewUrl: viewUrl,
        size: (file.getSize() / 1024).toFixed(1) + ' KB',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Aksi tidak dikenal: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inisialisasi struktur sheet dan format kolom otomatis jika belum ada
 */
function initDatabaseSheets(ss) {
  Object.values(SHEET_NAMES).forEach(name => {
    let s = ss.getSheetByName(name);
    if (!s) {
      s = ss.insertSheet(name);
      if (name === SHEET_NAMES.SOAL) {
        s.appendRow(SOAL_HEADERS);
        s.getRange(1, 1, 1, SOAL_HEADERS.length).setFontWeight('bold').setBackground('#E2E8F0');
      } else if (name === SHEET_NAMES.USERS) {
        s.appendRow(['ID', 'Nama_Lengkap', 'Email', 'Role', 'Departemen', 'Status', 'Inisial', 'Dibuat_Pada']);
        s.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E2E8F0');
      } else if (name === SHEET_NAMES.VERSI) {
        s.appendRow(['ID_Log', 'ID_Soal', 'Kode_Soal', 'Versi', 'Waktu_Revisi', 'Diubah_Oleh', 'Ringkasan_Perubahan', 'Snapshot_Data']);
        s.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#E2E8F0');
      } else if (name === SHEET_NAMES.AUDIT) {
        s.appendRow(['ID_Log', 'Waktu', 'Pengguna', 'Peran', 'Aksi', 'Kode_Soal', 'Deskripsi']);
        s.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E2E8F0');
      }
    }
  });
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTriggerPush = async () => {
    setLocalMessage(null);
    const res = await syncWithGoogleSheets();
    setLocalMessage({ success: res.success, text: res.message });
  };

  const handleTriggerPull = async () => {
    setLocalMessage(null);
    const res = await pullFromGoogleSheets();
    setLocalMessage({ success: res.success, text: res.message });
  };

  const handleResetToDefault = () => {
    setSpreadsheetId(defaultId);
    setLocalMessage({ success: true, text: `ID Spreadsheet diatur ulang ke default: ${defaultId}` });
  };

  const downloadStarterSheetsCSV = () => {
    const headers = [
      'ID', 'Kode', 'Subtes', 'Topik', 'Tipe', 'Kesulitan', 'Bobot_Skor',
      'Teks_Soal', 'Kunci_Jawaban', 'Pembahasan', 'Status_Review', 'Versi', 
      'Penyusun', 'Status_Data', 'Dibuat_Pada', 'Diperbarui_Pada', 'Waktu_Sinkron'
    ];
    const rows = questions.map((q) => [
      `"${q.id}"`,
      `"${q.code}"`,
      `"${q.subtest}"`,
      `"${q.topic}"`,
      `"${q.type}"`,
      `"${q.difficulty}"`,
      q.defaultScore,
      `"${q.prompt.replace(/"/g, '""')}"`,
      `"${JSON.stringify(q.options || []).replace(/"/g, '""')}"`,
      `"${(q.explanation || '').replace(/"/g, '""')}"`,
      `"${q.status}"`,
      `"${q.version}"`,
      `"${q.createdByName}"`,
      `"AKTIF"`,
      `"${q.createdAt}"`,
      `"${q.updatedAt}"`,
      `"${new Date().toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `template_db_tkad_adiwerna_append_only.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header & Status Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Basis Data Google Spreadsheet & Otomatis Sinkron
            </h1>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Otomatis Sinkron</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Basis data utama terhubung ke Google Spreadsheet ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{spreadsheetId}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Google Sheets</span>
          </a>

          <button
            onClick={downloadStarterSheetsCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Sync & Status Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-850 dark:to-slate-800/80 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-slate-700/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Basis Data Aktif: <span className="font-mono text-xs text-blue-700 dark:text-blue-400">{spreadsheetId}</span>
              </p>
              {autoSyncEnabled && (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  Auto-Sync Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lastGasSyncTime ? `Terakhir sinkronisasi: ${lastGasSyncTime}` : 'Otomatis tersinkron setiap perubahan butir soal & interval 60 detik'}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleTriggerPull}
            disabled={isSyncing}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <ArrowDownToLine className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : 'text-blue-600 dark:text-blue-400'}`} />
            <span>Tarik dari Sheets (Pull)</span>
          </button>

          <button
            onClick={handleTriggerPush}
            disabled={isSyncing}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Local Notification / Status Message */}
      {(localMessage || syncMessage) && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start space-x-3 transition ${
            (localMessage?.success ?? syncStatus === 'success')
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          {(localMessage?.success ?? syncStatus === 'success') ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">
              {(localMessage?.success ?? syncStatus === 'success') ? 'Sinkronisasi Otomatis Sukses' : 'Catatan Sinkronisasi'}
            </p>
            <p className="mt-0.5">{localMessage?.text || syncMessage}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('connect')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'connect'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Konfigurasi & Auto-Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('code_gs')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'code_gs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Skrip Google Apps Script (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'schema'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Struktur Tabel & Relasi Sheets</span>
        </button>
      </div>

      {/* TAB 1: CONNECT & CONFIG */}
      {activeTab === 'connect' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Pengaturan Basis Data Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ID Google Spreadsheet ini digunakan sebagai basis data default untuk seluruh operasi butir soal dan catatan audit.
              </p>
            </div>

            {/* Auto-sync Toggle Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Sinkronisasi Otomatis (Auto-Sync)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Secara otomatis menyinkronkan data setiap ada perubahan pada bank soal dan interval berkala 60 detik.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Spreadsheet ID Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Google Spreadsheet ID (Default)
                </label>
                {spreadsheetId !== defaultId && (
                  <button
                    onClick={handleResetToDefault}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Reset ke Default ({defaultId.slice(0, 10)}...)
                  </button>
                )}
              </div>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value.trim())}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Spreadsheet ID diambil dari URL Google Sheets: <code className="text-slate-600 dark:text-slate-300">/spreadsheets/d/<strong>{spreadsheetId}</strong>/edit</code>
              </p>
            </div>

            {/* Web App Deployment URL Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <span>Google Apps Script Web App URL (Default Aktif)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Otomatis Live Push
                  </span>
                </label>
                <div className="flex items-center space-x-2">
                  {gasWebhookUrl !== DEFAULT_GAS_URL && (
                    <button
                      onClick={() => setGasWebhookUrl(DEFAULT_GAS_URL)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset ke Default
                    </button>
                  )}
                  {gasWebhookUrl && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>
              </div>
              <input
                type="url"
                placeholder={DEFAULT_GAS_URL}
                value={gasWebhookUrl}
                onChange={(e) => setGasWebhookUrl(e.target.value.trim())}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alamat Web App untuk transmisi otomatis seluruh perubahan data ke Google Spreadsheet. Seluruh penambahan, pengeditan, persetujuan review, revisi, serta <strong>manajemen akun pengguna</strong> akan otomatis tersimpan langsung ke lembar kerja <strong>Soal_TKAD</strong>, <strong>Pengguna_Sistem</strong>, dan <strong>Audit_Trail</strong>.
              </p>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Panduan Setup Otomatis Google Apps Script</span>
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>
                Buka lembar kerja <a href={spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold underline">Spreadsheet TKAD ({spreadsheetId.slice(0, 10)}...)</a>.
              </li>
              <li>
                Masuk ke menu <strong>Ekstensi &gt; Apps Script</strong> pada spreadsheet.
              </li>
              <li>
                Buka tab <strong>Skrip Code.gs</strong> di atas, klik tombol <strong>Salin Seluruh Code.gs</strong>, lalu tempelkan di editor Apps Script dan Simpan.
              </li>
              <li>
                Klik tombol <strong>Deploy &gt; New deployment</strong>, pilih jenis <strong>Web app</strong>, atur <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>.
              </li>
              <li>
                Salin Web App URL yang dihasilkan ke kolom input di atas. Sistem proxy server akan otomatis mengirim setiap perubahan data soal secara langsung tanpa kendala CORS.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 2: CODE.GS */}
      {activeTab === 'code_gs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 dark:bg-slate-850 p-4 rounded-xl border border-blue-200/60 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Skrip Google Apps Script (Telah Dikonfigurasi untuk Spreadsheet ID: {spreadsheetId.slice(0, 12)}...)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Salin skrip ini ke menu <em>Ekstensi &gt; Apps Script</em> pada Google Spreadsheet Anda untuk mengaktifkan Web App dua arah.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Seluruh Code.gs'}</span>
            </button>
          </div>

          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner">
            <pre className="leading-relaxed">{googleAppsScriptCode}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: SHEETS SCHEMA */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table 1: Soal_TKAD */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sheet 1: Soal_TKAD (Append-Only & Versi)</span>
              </h3>
              <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                17 Kolom
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Menyimpan seluruh riwayat butir soal secara append-only. Baris versi lama ditandai <code>TIDAK_AKTIF</code>, baris baru ditambahkan sebagai <code>AKTIF</code>.
            </p>

            <div className="space-y-1.5 text-xs">
              {[
                { col: 'ID', desc: 'UUID unik butir soal (Primary Key)' },
                { col: 'Kode', desc: 'Kode soal resmi (TKAD-BIN-101, dll)' },
                { col: 'Subtes', desc: 'Bahasa Indonesia, Matematika, IPAS' },
                { col: 'Topik', desc: 'Topik pokok bahasan' },
                { col: 'Tipe', desc: 'pilihan_ganda, menjodohkan, benar_salah, isian, esai' },
                { col: 'Kesulitan', desc: 'mudah | sedang | sulit' },
                { col: 'Bobot_Skor', desc: 'Nilai poin butir soal' },
                { col: 'Teks_Soal', desc: 'Konten pertanyaan (KaTeX & Markdown)' },
                { col: 'Kunci_Jawaban', desc: 'JSON array pilihan jawaban & kunci' },
                { col: 'Pembahasan', desc: 'Teks penjelasan jawaban' },
                { col: 'Status_Review', desc: 'draft | menunggu_review | disetujui | perlu_revisi' },
                { col: 'Versi', desc: 'Nomor versi (v1.0, v1.1, v2.0)' },
                { col: 'Penyusun', desc: 'Nama guru pembuat soal' },
                { col: 'Status_Data', desc: 'AKTIF (tampil di app) | TIDAK_AKTIF (arsip riwayat) | DIHAPUS' },
                { col: 'Dibuat_Pada', desc: 'Timestamp pembuatan pertama kali' },
                { col: 'Diperbarui_Pada', desc: 'Timestamp pembaruan versi terakhir' },
                { col: 'Waktu_Sinkron', desc: 'Waktu sinkronisasi ke Google Sheets' },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 mr-2">{item.col}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table 2: Pengguna_Sistem */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Sheet 2: Pengguna_Sistem (Data Akun & Guru)</span>
              </h3>
              <span className="text-[11px] bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded font-semibold border border-purple-200 dark:border-purple-800">
                8 Kolom
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Daftar seluruh akun pengguna (Administrator, Penelaah, Penyusun) untuk sinkronisasi RBAC.
            </p>

            <div className="space-y-1.5 text-xs">
              {[
                { col: 'ID', desc: 'UUID unik pengguna' },
                { col: 'Nama_Lengkap', desc: 'Nama guru/admin dengan gelar' },
                { col: 'Email', desc: 'Alamat email terdaftar @tkad.adiwerna' },
                { col: 'Role', desc: 'admin | reviewer | pembuat' },
                { col: 'Departemen', desc: 'Mata pelajaran / bidang tugas' },
                { col: 'Status', desc: 'aktif | nonaktif' },
                { col: 'Inisial', desc: 'Inisial avatar pengguna' },
                { col: 'Dibuat_Pada', desc: 'Waktu registrasi akun' },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 mr-2">{item.col}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table 3: Versi_Log */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Sheet 3: Versi_Log (Riwayat Revisi Soal)</span>
              </h3>
              <span className="text-[11px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-semibold border border-amber-200 dark:border-amber-800">
                8 Kolom
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Catatan lengkap setiap versi perubahan soal, pembuat perubahan, dan snapshot revisi.
            </p>

            <div className="space-y-1.5 text-xs">
              {[
                { col: 'ID_Log', desc: 'ID unik pencatatan versi' },
                { col: 'ID_Soal', desc: 'ID referensi butir soal' },
                { col: 'Kode_Soal', desc: 'Kode butir soal' },
                { col: 'Versi', desc: 'Nomor versi hasil revisi' },
                { col: 'Waktu_Revisi', desc: 'Timestamp revisi dibuat' },
                { col: 'Diubah_Oleh', desc: 'Nama penyusun / perevisi' },
                { col: 'Ringkasan_Perubahan', desc: 'Catatan ringkas revisi' },
                { col: 'Snapshot_Data', desc: 'JSON snapshot teks & opsi soal' },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 mr-2">{item.col}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table 4: Audit_Trail */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Sheet 4: Audit_Trail (Log Aktivitas)</span>
              </h3>
              <span className="text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-semibold border border-blue-200 dark:border-blue-800">
                7 Kolom
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mencatat jejak digital setiap aksi create, edit, review, approve, reject, atau sinkronisasi.
            </p>

            <div className="space-y-1.5 text-xs">
              {[
                { col: 'ID_Log', desc: 'ID unik log aktivitas' },
                { col: 'Waktu', desc: 'Timestamp ISO 8601' },
                { col: 'Pengguna', desc: 'Nama akun pelaksana aksi' },
                { col: 'Peran', desc: 'admin | reviewer | pembuat' },
                { col: 'Aksi', desc: 'Jenis tindakan (APPROVE, EDIT, PUSH, dll)' },
                { col: 'Kode_Soal', desc: 'Referensi kode butir soal' },
                { col: 'Deskripsi', desc: 'Uraian detail aktivitas' },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 mr-2">{item.col}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

