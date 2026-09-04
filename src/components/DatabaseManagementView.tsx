import React, { useState } from 'react';
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
    auditLogs,
    currentUser,
    setQuestions,
    setUsers,
    setCategories,
    setAuditLogs,
    logAudit,
    spreadsheetId,
    setSpreadsheetId,
    gasWebhookUrl,
    setGasWebhookUrl,
    autoSyncEnabled,
    setAutoSyncEnabled,
    syncToGoogleSheets,
    pullFromGoogleSheets,
    isSyncingWithGas,
    lastGasSyncTime,
  } = useApp();

  const [activeEngineTab, setActiveEngineTab] = useState<'json' | 'sql' | 'sheets'>('json');
  const [sqlDialect, setSqlDialect] = useState<'postgres' | 'mysql' | 'sqlite'>('postgres');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // JSON Preview state
  const jsonString = React.useMemo(() => {
    return JSON.stringify(generateJSONDatabase(questions, users, categories, auditLogs), null, 2);
  }, [questions, users, categories, auditLogs]);

  // SQL Preview state
  const sqlString = React.useMemo(() => {
    return generateSQLScript(questions, users, categories, auditLogs, sqlDialect);
  }, [questions, users, categories, auditLogs, sqlDialect]);

  // Handle Download JSON
  const handleDownloadJSON = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_tkad_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logAudit('CONFIG_CHANGE', undefined, undefined, 'Mengunduh backup database format JSON.');
      setFeedbackMsg({ type: 'success', text: 'Backup file database JSON berhasil diunduh.' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Gagal mengunduh file JSON: ${err.message}` });
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

  // Handle Upload & Restore JSON Database
  const handleUploadJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseJSONDatabase(content);

      if (!res.valid || !res.data) {
        setFeedbackMsg({ type: 'error', text: res.message });
        return;
      }

      if (window.confirm(`Yakin ingin memulihkan basis data? Tindakan ini akan memuat ${res.data.questions.length} soal.`)) {
        if (res.data.questions.length > 0) setQuestions(res.data.questions);
        if (res.data.users && res.data.users.length > 0) setUsers(res.data.users);
        if (res.data.categories && res.data.categories.length > 0) setCategories(res.data.categories);
        if (res.data.auditLogs && res.data.auditLogs.length > 0) setAuditLogs(res.data.auditLogs);

        logAudit(
          'CONFIG_CHANGE',
          undefined,
          undefined,
          `Restore Basis Data JSON: ${res.data.questions.length} butir soal, ${res.data.users?.length || 0} pengguna.`
        );

        setFeedbackMsg({
          type: 'success',
          text: `Basis data JSON berhasil dipulihkan! (${res.data.questions.length} butir soal dimuat).`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
                  Manajemen Basis Data (JSON & SQL Database)
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Multi-Engine Ready
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                Pengelolaan penyimpanan data terstruktur Bank Soal dengan format JSON Document Store, Skema SQL Relasional (PostgreSQL, MySQL, SQLite), dan Sinkronisasi Cloud.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>
            <button
              onClick={handleDownloadSQL}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Dump SQL</span>
            </button>
          </div>
        </div>

        {/* Database Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px]">Total Butir Soal (tb_soal)</p>
            <p className="text-lg font-bold text-white mt-0.5">{questions.length} Records</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px]">Pengguna (tb_users)</p>
            <p className="text-lg font-bold text-white mt-0.5">{users.length} Akun</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px]">Kategori / Mapel (tb_categories)</p>
            <p className="text-lg font-bold text-white mt-0.5">{categories.length} Mata Pelajaran</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-slate-400 font-medium text-[11px]">Audit Logs (tb_audit)</p>
            <p className="text-lg font-bold text-white mt-0.5">{auditLogs.length} Entri</p>
          </div>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
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
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveEngineTab('json')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeEngineTab === 'json'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>1. JSON Database Engine (Document Store)</span>
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
          <span>2. SQL Database Engine (Relational DDL & DML)</span>
        </button>

        <button
          onClick={() => setActiveEngineTab('sheets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeEngineTab === 'sheets'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>3. Google Sheets & GAS Connector</span>
        </button>
      </div>

      {/* TAB 1: JSON DATABASE */}
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
                <label className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Restore JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadJSONFile}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleCopyJSON}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Tersalin' : 'Salin JSON'}</span>
                </button>

                <button
                  onClick={handleDownloadJSON}
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

      {/* TAB 2: SQL DATABASE */}
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

      {/* TAB 3: SHEETS CONNECTOR */}
      {activeEngineTab === 'sheets' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Konektor Google Sheets & Web App Google Apps Script (Opsional)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubungkan basis data aplikasi dengan Google Spreadsheet untuk kolaborasi lembar kerja daring.
              </p>
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
                {lastGasSyncTime && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Terakhir disinkronkan: {lastGasSyncTime}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => pullFromGoogleSheets()}
                  disabled={isSyncingWithGas}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithGas ? 'animate-spin' : ''}`} />
                  <span>Tarik Data</span>
                </button>

                <button
                  onClick={() => syncToGoogleSheets()}
                  disabled={isSyncingWithGas}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Kirim Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
