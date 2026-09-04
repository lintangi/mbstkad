import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  ArrowRight,
  Database,
  TrendingUp,
  Layers,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LatexRenderer } from '../utils/latexParser';

export const DashboardView: React.FC = () => {
  const {
    questions,
    categories,
    setActiveTab,
    setSelectedQuestionId,
    setReviewingQuestionId,
    setEditingQuestionId,
    currentUser,
    auditLogs,
    spreadsheetId,
  } = useApp();

  // Metrics
  const totalQuestions = questions.length;
  const approvedCount = questions.filter((q) => q.status === 'disetujui').length;
  const pendingReviewCount = questions.filter((q) => q.status === 'menunggu_review').length;
  const revisionCount = questions.filter((q) => q.status === 'perlu_revisi').length;
  const draftCount = questions.filter((q) => q.status === 'draft').length;

  const pendingQuestions = questions.filter((q) => q.status === 'menunggu_review');
  const myRevisionQuestions = questions.filter((q) => q.status === 'perlu_revisi');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 bg-blue-700/60 border border-blue-500/40 px-3 py-1 rounded-full text-xs font-medium text-blue-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Peran: {currentUser.role.toUpperCase()} ({currentUser.name})</span>
            </div>
            {currentUser.role === 'admin' && (
              <div
                onClick={() => setActiveTab('gas_sync')}
                className="inline-flex items-center space-x-1.5 bg-indigo-900/60 hover:bg-indigo-900/80 border border-indigo-400/40 px-3 py-1 rounded-full text-xs font-medium text-indigo-200 cursor-pointer transition"
                title="Basis Data Aktif: JSON Document Store & Relational SQL Generator"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Basis Data: JSON & SQL Engine (Aktif)</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Pusat Repositori & Penjaminan Mutu Soal TKAD-Adiwerna
          </h1>

          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
            Sistem kolaboratif penyusunan bank soal ujian akademik terintegrasi Google Spreadsheet DB. Menjamin akurasi kunci, keterbacaan formula LaTeX, dan versioning data secara transparan.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                setEditingQuestionId(null);
                setActiveTab('buat_soal');
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-900 font-semibold text-xs hover:bg-blue-50 transition shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-700" />
              <span>Susun Soal Baru</span>
            </button>

            {pendingReviewCount > 0 && (
              <button
                onClick={() => setActiveTab('antrian_review')}
                className="px-4 py-2.5 rounded-xl bg-blue-700/80 border border-blue-400/30 text-white font-semibold text-xs hover:bg-blue-700 transition flex items-center space-x-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Tinjau Antrian ({pendingReviewCount})</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('gas_sync')}
                className="px-4 py-2.5 rounded-xl bg-blue-950/60 border border-blue-400/20 text-blue-200 font-medium text-xs hover:bg-blue-950 transition flex items-center space-x-2 cursor-pointer"
              >
                <Database className="w-4 h-4 text-sky-400" />
                <span>Google Sheets & GAS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total */}
        <div
          onClick={() => setActiveTab('bank_soal')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Soal</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalQuestions}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Seluruh butir tersimpan</span>
        </div>

        {/* Metric 2: Approved (Siap Ujian) */}
        <div
          onClick={() => setActiveTab('bank_soal')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">{approvedCount}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">Siap rilis ujian</span>
        </div>

        {/* Metric 3: Menunggu Review */}
        <div
          onClick={() => setActiveTab('antrian_review')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500 transition cursor-pointer relative"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Menunggu Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight">{pendingReviewCount}</div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block font-medium">Dalam antrian review</span>
        </div>

        {/* Metric 4: Perlu Revisi */}
        <div
          onClick={() => setActiveTab('bank_soal')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Perlu Revisi</span>
            <RotateCcw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-400 tracking-tight">{revisionCount}</div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 block">Memerlukan perbaikan</span>
        </div>

        {/* Metric 5: Draf */}
        <div
          onClick={() => setActiveTab('bank_soal')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Draf Pembuat</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tight">{draftCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Belum diajukan</span>
        </div>
      </div>

      {/* Two Columns: Category Breakdown + Review Queue Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Subtest & Difficulty Distributions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Subtests Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Distribusi Mata Pelajaran TKAD-Adiwerna
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">{categories.length} Mata Uji</span>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => {
                const count = questions.filter((q) => q.subtest === cat.name).length;
                const percent = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">{cat.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">{count} soal ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty Level Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tingkat Kesulitan Soal
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-lg block">
                  {questions.filter((q) => q.difficulty === 'mudah').length}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">Mudah</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800">
                <span className="font-bold text-blue-800 dark:text-blue-300 text-lg block">
                  {questions.filter((q) => q.difficulty === 'sedang').length}
                </span>
                <span className="text-blue-700 dark:text-blue-400 text-[11px] font-medium">Sedang</span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800">
                <span className="font-bold text-purple-800 dark:text-purple-300 text-lg block">
                  {questions.filter((q) => q.difficulty === 'sulit').length}
                </span>
                <span className="text-purple-700 dark:text-purple-400 text-[11px] font-medium">Sulit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pending Action Queue & Recent Audits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Reviews Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Antrian Menunggu Review ({pendingQuestions.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('antrian_review')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <span>Lihat Semua Antrian</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
                Tidak ada soal yang sedang menunggu review. Semua soal telah ditinjau!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingQuestions.slice(0, 3).map((q) => (
                  <div key={q.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {q.code}
                        </span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{q.subtest}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">• {q.difficulty}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 font-sans">
                        {q.prompt.replace(/\$+/g, '')}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        Oleh: {q.createdByName} • v{q.version}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedQuestionId(q.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => setReviewingQuestionId(q.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Questions Needing Revision (If any) */}
          {myRevisionQuestions.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200">
                <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Soal Perlu Revisi ({myRevisionQuestions.length})
                </h3>
              </div>

              <div className="space-y-2">
                {myRevisionQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mr-2">{q.code}</span>
                      <span className="text-slate-600 dark:text-slate-400">{q.subtest}</span>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 italic mt-0.5">
                        &ldquo;{q.reviews[0]?.generalComment || 'Mohon periksa catatan review.'}&rdquo;
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingQuestionId(q.id);
                        setActiveTab('buat_soal');
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition shrink-0 ml-2 cursor-pointer"
                    >
                      Perbaiki
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log Activity Feed (Khusus Admin) */}
          {currentUser.role === 'admin' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Aktivitas & Audit Trail Terkini
                </h3>
                <button
                  onClick={() => setActiveTab('audit_log')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <span>Lihat Semua Log</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span>: {log.description}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
