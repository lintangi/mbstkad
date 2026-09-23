import React, { useState, useRef } from 'react';
import {
  Database,
  FileCode,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Table,
  Layers,
  Code2,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Sliders,
  Terminal,
  ShieldCheck,
  Users,
  HelpCircle,
  FolderArchive,
  ArrowUpDown,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  generateSQLScript,
  generateJSONDatabase,
  validateAndParseJSONDatabase,
} from '../utils/databaseUtils';

export const DatabaseManagementView: React.FC = () => {
  const {
    questions,
    users,
    categories,
    packets,
    auditLogs,
    currentUser,
    exportFullSystemBackup,
    restoreFullSystemBackup,
    logAudit,
    spreadsheetId,
    setSpreadsheetId,
    gasWebhookUrl,
    setGasWebhookUrl,
    autoSyncEnabled,
    setAutoSyncEnabled,
    syncWithGoogleSheets,
    pullFromGoogleSheets,
    isSyncing,
    dualSyncStatus,
    isDualSyncing,
    lastDualSyncTime,
    dualSyncDatabases,
  } = useApp();

  const [activeEngineTab, setActiveEngineTab] = useState<'backup_restore' | 'json' | 'sql' | 'sheets'>('backup_restore');
  const [sqlDialect, setSqlDialect] = useState<'postgres' | 'mysql' | 'sqlite'>('postgres');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Restore Modal / Preview State
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    valid: boolean;
    data?: any;
    message: string;
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSON Preview state
  const jsonString = React.useMemo(() => {
    return JSON.stringify(generateJSONDatabase(questions, users, categories, auditLogs, packets), null, 2);
  }, [questions, users, categories, auditLogs, packets]);

  // SQL Preview state
  const sqlString = React.useMemo(() => {
    return generateSQLScript(questions, users, categories, auditLogs, sqlDialect);
  }, [questions, users, categories, auditLogs, sqlDialect]);

  // Handle Download Full Backup
  const handleDownloadFullBackup = () => {
    const res = exportFullSystemBackup();
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Backup data lengkap (Bank Soal, Pengguna, Paket, Kategori) berhasil diunduh.' });
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Handle JSON file selection for restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreFileContent(content);
      const validation = validateAndParseJSONDatabase(content);
      setRestorePreview(validation);
      if (!validation.valid) {
        setFeedbackMsg({ type: 'error', text: validation.message });
      } else {
        setFeedbackMsg({
          type: 'info',
          text: `File valid terdeteksi: ${validation.data?.questions.length || 0} soal, ${validation.data?.users.length || 0} pengguna. Silakan tinjau dan konfirmasi pemulihan.`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!restoreFileContent || !restorePreview?.data) return;

    setIsRestoring(true);
    try {
      const res = await restoreFullSystemBackup(restoreFileContent, restoreMode);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `${res.message} Berhasil memuat ${res.counts.questions} soal, ${res.counts.users} pengguna, ${res.counts.packets} paket, ${res.counts.categories} subtes.`,
        });
        setRestoreFileContent(null);
        setRestorePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Gagal memulihkan data: ${err.message || err}` });
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Download SQL
  const handleDownloadSQL = () => {
    try {
      const blob = new Blob([sqlString], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tkad_database_${sqlDialect}_${Date.now()}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logAudit(
        'CONFIG_CHANGE',
        undefined,
        undefined,
        `Mengunduh skrip SQL dump basis data dialek ${sqlDialect.toUpperCase()}.`
      );
      setFeedbackMsg({
        type: 'success',
        text: `Skrip SQL Dump (${sqlDialect.toUpperCase()}) berhasil diunduh.`,
      });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Gagal mengunduh file SQL: ${err.message}` });
    }
  };

  // Handle Copy SQL
  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlString);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
      setFeedbackMsg({ type: 'success', text: 'Skrip SQL berhasil disalin ke clipboard.' });
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Gagal menyalin teks ke clipboard.' });
    }
  };

  // Handle Copy JSON
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      setFeedbackMsg({ type: 'success', text: 'Data JSON berhasil disalin ke clipboard.' });
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Gagal menyalin teks ke clipboard.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Backup, Restore & Manajemen Basis Data
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Admin Full Control
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                Cadangkan (Download) dan Pulihkan (Upload) seluruh data Bank Soal, Daftar Pengguna, Paket Soal, Kategori, serta Ekspor SQL Relasional.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadFullBackup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Backup Seluruh Data (.JSON)</span>
            </button>
            <button
              onClick={() => setActiveEngineTab('backup_restore')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Data</span>
            </button>
          </div>
        </div>

        {/* Database Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px] flex items-center justify-between">
              <span>Total Butir Soal</span>
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            </p>
            <p className="text-lg font-bold text-white mt-0.5">{questions.length} Butir</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px] flex items-center justify-between">
              <span>Pengguna Terdaftar</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </p>
            <p className="text-lg font-bold text-white mt-0.5">{users.length} Akun</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px] flex items-center justify-between">
              <span>Paket Soal</span>
              <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
            </p>
            <p className="text-lg font-bold text-white mt-0.5">{packets.length} Paket</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px] flex items-center justify-between">
              <span>Kategori Subtes</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </p>
            <p className="text-lg font-bold text-white mt-0.5">{categories.length} Subtes</p>
          </div>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : feedbackMsg.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : feedbackMsg.type === 'info' ? (
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ENGINE TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveEngineTab('backup_restore')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeEngineTab === 'backup_restore'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>1. Backup & Restore Sistem (Bank Soal & Pengguna)</span>
        </button>

        <button
          onClick={() => setActiveEngineTab('json')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeEngineTab === 'json'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>2. JSON Schema Viewer</span>
        </button>

        <button
          onClick={() => setActiveEngineTab('sql')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeEngineTab === 'sql'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>3. SQL Relational Dump (Postgres, MySQL, SQLite)</span>
        </button>

        <button
          onClick={() => setActiveEngineTab('sheets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeEngineTab === 'sheets'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>4. Sinkronisasi Database Ganda (Cloud & Sheets)</span>
        </button>
      </div>

      {/* TAB 1: BACKUP & RESTORE SISTEM */}
      {activeEngineTab === 'backup_restore' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Download Backup Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Backup Seluruh Data Sistem (Download)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Unduh arsip basis data lengkap berformat JSON standar yang mencakup seluruh butir bank soal, seluruh data akun pengguna & hak akses, paket soal, kategori subtes, dan catatan audit log.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Butir Bank Soal:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{questions.length} Butir</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Daftar Pengguna:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{users.length} Akun</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Paket Soal:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{packets.length} Paket</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Kategori Subtes:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{categories.length} Subtes</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadFullBackup}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Backup Lengkap (.json)</span>
              </button>
            </div>

            {/* Upload & Restore Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Restore Seluruh Data Sistem (Upload)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Unggah file backup JSON untuk memulihkan Bank Soal dan Daftar Pengguna. Sistem secara otomatis mencatat snapshot sebelum pemulihan sehingga Anda dapat melakukan rollback kapan saja jika diperlukan.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pilih Metode Pemulihan (Restore Mode):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer ${
                        restoreMode === 'replace'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Timpa Penuh (Replace)</div>
                      <div className="text-[10px] opacity-80">Menggantikan seluruh data dengan data backup</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer ${
                        restoreMode === 'merge'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Gabungkan (Merge)</div>
                      <div className="text-[10px] opacity-80">Memperbarui & menambah data tanpa menghapus</div>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="restore-file-input"
                />
                <label
                  htmlFor="restore-file-input"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Backup JSON untuk Dipulihkan</span>
                </label>
              </div>
            </div>
          </div>

          {/* Preview & Confirmation Modal/Section if file selected */}
          {restorePreview && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-500/50 p-6 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pratinjau & Konfirmasi Pemulihan Data
                  </h4>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  restorePreview.valid
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}>
                  {restorePreview.valid ? 'Format File Valid' : 'Format File Tidak Sesuai'}
                </span>
              </div>

              {restorePreview.valid && restorePreview.data ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    File cadangan berhasil diverifikasi. Rincian data yang akan dimuat ke dalam sistem dengan mode <strong>{restoreMode === 'replace' ? 'Timpa Penuh' : 'Penggabungan'}</strong>:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Butir Bank Soal:</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {restorePreview.data.questions?.length || 0} Soal
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Daftar Pengguna:</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {restorePreview.data.users?.length || 0} Akun
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Paket Soal:</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {restorePreview.data.packets?.length || 0} Paket
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Kategori Subtes:</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {restorePreview.data.categories?.length || 0} Subtes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRestoreFileContent(null);
                        setRestorePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memproses Pemulihan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Konfirmasi & Pulihkan Basis Data</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-600 dark:text-rose-400">
                  {restorePreview.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JSON SCHEMA VIEWER */}
      {activeEngineTab === 'json' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>Struktur Dokumen JSON Database</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format JSON portable untuk pencadangan, pemulihan instan, dan pertukaran data antar sistem.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyJSON}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Tersalin' : 'Salin JSON'}</span>
                </button>

                <button
                  onClick={handleDownloadFullBackup}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download database.json</span>
                </button>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 mb-2 font-mono">
                <span>database_tkad_schema.json</span>
                <span>Ukuran: ~{(jsonString.length / 1024).toFixed(1)} KB</span>
              </div>
              <pre className="text-xs text-blue-300 font-mono overflow-x-auto max-h-96 leading-relaxed">
                {jsonString}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SQL DATABASE */}
      {activeEngineTab === 'sql' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  <span>Skrip SQL DDL & DML Schema Generator</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hasilkan skrip SQL relasional lengkap dengan tabel, relasi, tipe data terindeks, dan data record.
                </p>
              </div>

              {/* Dialect Selector */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <button
                    onClick={() => setSqlDialect('postgres')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      sqlDialect === 'postgres' ? 'bg-indigo-600 text-white shadow-xs' : ''
                    }`}
                  >
                    PostgreSQL
                  </button>
                  <button
                    onClick={() => setSqlDialect('mysql')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      sqlDialect === 'mysql' ? 'bg-indigo-600 text-white shadow-xs' : ''
                    }`}
                  >
                    MySQL / MariaDB
                  </button>
                  <button
                    onClick={() => setSqlDialect('sqlite')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      sqlDialect === 'sqlite' ? 'bg-indigo-600 text-white shadow-xs' : ''
                    }`}
                  >
                    SQLite
                  </button>
                </div>

                <button
                  onClick={handleCopySQL}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin' : 'Salin SQL'}</span>
                </button>

                <button
                  onClick={handleDownloadSQL}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>

            {/* SQL Preview Box */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 mb-2 font-mono">
                <span>tkad_database_{sqlDialect}.sql</span>
                <span>Dialek: {sqlDialect.toUpperCase()} • Tabel: tb_users, tb_categories, tb_questions, tb_audit_logs</span>
              </div>
              <pre className="text-xs text-emerald-300 font-mono overflow-x-auto max-h-96 leading-relaxed">
                {sqlString}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SHEETS & DUAL SYNC */}
      {activeEngineTab === 'sheets' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Konektor Database Ganda (Cloud & Google Spreadsheet)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sinkronisasi simultan antara Firebase Firestore Cloud dan Google Spreadsheet via Webhook GAS.
                </p>
              </div>

              <button
                onClick={() => dualSyncDatabases()}
                disabled={isDualSyncing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDualSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Sekarang</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Spreadsheet ID:
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Apps Script Web App URL:
                </label>
                <input
                  type="text"
                  value={gasWebhookUrl}
                  onChange={(e) => setGasWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Aktifkan Sinkronisasi Otomatis</span>
                </label>
                {lastDualSyncTime && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Terakhir disinkronkan: {lastDualSyncTime}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => pullFromGoogleSheets()}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Tarik Data dari Spreadsheet</span>
                </button>

                <button
                  onClick={() => syncWithGoogleSheets({ silent: false })}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Kirim Data ke Spreadsheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

