import React, { useState } from 'react';
import {
  BookOpen,
  UserCheck,
  Edit3,
  Search,
  CheckCircle2,
  ListChecks,
  FileSpreadsheet,
  Layers,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  HelpCircle,
  Clock,
  RotateCcw,
  Download,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const RoleGuideCard: React.FC = () => {
  const { currentUser, setActiveTab, setEditingQuestionId } = useApp();
  const [activeAdminTab, setActiveAdminTab] = useState<'admin' | 'pembuat' | 'reviewer' | 'workflow'>('admin');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  // ----------------------------------------------------
  // 1. PANDUAN PENYUSUN (PEMBUAT SOAL)
  // ----------------------------------------------------
  const renderPenyusunGuide = (isNested: boolean = false) => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 dark:bg-blue-950/40 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-blue-900/60">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-300">
            <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <h3 className="font-bold text-base">Panduan Penyusun Butir Soal (Penyusun)</h3>
          </div>
          <p className="text-xs text-blue-900/80 dark:text-blue-200 leading-relaxed">
            Panduan lengkap menyusun naskah butir soal terstandar TKAD, penulisan formula matematika/sains dengan LaTeX KaTeX, hingga pengajuan telaah mutu.
          </p>
        </div>
        {!isNested && (
          <button
            onClick={() => {
              setEditingQuestionId(null);
              setActiveTab('buat_soal');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <span>Mulai Susun Soal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Step 1 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
              1
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white">Taksonomi & Metadata</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Pilih <strong>Mata Pelajaran (Subtes)</strong>, tentukan <strong>Elemen / Materi Pokok</strong>, <strong>Sub-elemen</strong>, <strong>Kompetensi</strong>, serta <strong>Level Kognitif</strong> (C1–C6: Mengingat, Memahami, Menerapkan, Menganalisis, Mengevaluasi, Mengkreasi).
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
              2
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white">Stimulus & Formula LaTeX</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Tulis stimulus bacaan kontekstual atau kasus. Untuk simbol & rumus matematika/IPA, gunakan sintaks KaTeX diapit tanda dolar: <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">$f(x) = ax^2 + bx + c$</code>.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
              3
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white">Bentuk Soal & Kunci</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Dukung multi-bentuk: <em>Pilihan Ganda</em>, <em>PG Kompleks (Multi Kunci)</em>, <em>Menjodohkan</em>, <em>Benar/Salah</em>, <em>Isian Singkat</em>, dan <em>Esai</em>. Tetapkan kunci jawaban valid dan pembahasan tuntas.
          </p>
        </div>

        {/* Step 4 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
              4
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white">Simpan Draf / Ajukan Telaah</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Pilih <strong>Simpan Draf</strong> jika naskah belum final. Bila sudah siap diperiksa, klik <strong>Ajukan untuk Review</strong> agar soal masuk ke antrean Penelaah Mutu.
          </p>
        </div>

        {/* Step 5 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
              5
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white">Tindak Lanjut Revisi</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Jika Penelaah memberikan status <em>Perlu Revisi</em>, baca catatan perbaikan di dashboard / notifikasi, klik <strong>Perbaiki</strong>, lakukan penyesuaian, lalu ajukan ulang.
          </p>
        </div>

        {/* Step 6 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
              6
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white">Status Disetujui</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Soal yang telah disetujui (Approved) secara otomatis masuk ke Bank Soal Aktif dan siap dirakit ke dalam Paket Soal Ujian TKAD Adiwerna.
          </p>
        </div>
      </div>

      {/* Quick LaTeX & Content Tips Collapsible */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-4 space-y-3">
        <button
          onClick={() => toggleSection('latex_tips')}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tips Cepat Penulisan Rumus LaTeX KaTeX untuk Penyusun</span>
          </div>
          {expandedSection === 'latex_tips' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSection === 'latex_tips' && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">Pecahan & Akar:</span>
              <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] block">$\frac&#123;a&#125;&#123;b&#125;$</code>
              <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] block">$\sqrt&#123;x^2 + y^2&#125;$</code>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">Pangkat & Indeks:</span>
              <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] block">$x^2 + 5x_1 - 6 = 0$</code>
              <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] block">$10^&#123;-3&#125; \text&#123; kg&#125;$</code>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white block mb-1">Simbol Operasi & Relasi:</span>
              <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] block">$\pm, \times, \div, \leq, \geq$</code>
              <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] block">$\alpha, \beta, \pi, \theta, \Delta$</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 2. PANDUAN PENELAAH (REVIEWER MUTU)
  // ----------------------------------------------------
  const renderPenelaahGuide = (isNested: boolean = false) => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
            <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h3 className="font-bold text-base">Panduan Penelaah Mutu Butir Soal (Penelaah)</h3>
          </div>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-200 leading-relaxed">
            Pedoman evaluasi penjaminan mutu naskah soal berdasarkan 4 pilar standar: materi/kisi-kisi, konstruksi stimulus, keterbacaan bahasa EBI, dan validitas kunci jawaban.
          </p>
        </div>
        {!isNested && (
          <button
            onClick={() => setActiveTab('antrian_review')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <span>Buka Antrian Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Pillars Quality Rubric */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Pilar 1 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <ListChecks className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">1. Kesesuaian Kisi-kisi</h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Pastikan butir soal sesuai dengan subtes, kompetensi dasar, elemen materi, dan tingkat kesulitan yang ditetapkan.
          </p>
        </div>

        {/* Pilar 2 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">2. Konstruksi Stimulus</h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Stimulus harus kontekstual, menarik, informatif, gambar/diagram memiliki resolusi jelas, dan tidak menimbulkan multitafsir.
          </p>
        </div>

        {/* Pilar 3 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">3. Validitas Kunci & Distraktor</h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Hanya ada satu jawaban yang tepat (atau sesuai kunci kompleks), distraktor pengecoh homogen dan logis, serta pembahasan akurat.
          </p>
        </div>

        {/* Pilar 4 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">4. Kaidah Bahasa & EBI</h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Menggunakan bahasa baku Indonesia yang baik dan benar, penulisan rumus KaTeX rapi, serta tidak mengandung unsur SARA/bias.
          </p>
        </div>
      </div>

      {/* Action Decisions Explanation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Keputusan Telaah Mutu</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Setujui (Approve)</span>
            </span>
            <p className="text-[11px] text-emerald-900/80 dark:text-emerald-200">
              Soal memenuhi seluruh kriteria mutu dan langsung siap dipakai dalam perakitan paket ujian.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Perlu Revisi</span>
            </span>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-200">
              Soal dikembalikan kepada penyusun disertai catatan spesifik (koreksi redaksi, rumus, atau opsi) untuk disempurnakan.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1">
            <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Tolak (Reject)</span>
            </span>
            <p className="text-[11px] text-rose-900/80 dark:text-rose-200">
              Soal tidak layak digunakan (plagiasi fatal, keluar kurikulum) dan tidak dilanjutkan ke tahap berikutnya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 3. PANDUAN ADMINISTRATOR (ADMIN)
  // ----------------------------------------------------
  const renderAdminGuide = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/70 dark:bg-purple-950/40 p-4 sm:p-5 rounded-2xl border border-purple-100 dark:border-purple-900/60">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-purple-800 dark:text-purple-300">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <h3 className="font-bold text-base">Panduan Administrator Pengelola Sistem (Admin)</h3>
          </div>
          <p className="text-xs text-purple-900/80 dark:text-purple-200 leading-relaxed">
            Kontrol terpusat atas tata kelola pengguna (RBAC), integrasi basis data Google Sheets, master kategori taksonomi, perakitan paket soal, dan ekspor naskah Microsoft Word.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Kelola Pengguna</span>
          </button>
          <button
            onClick={() => setActiveTab('gas_sync')}
            className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Google Sheets Sync</span>
          </button>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Module 1 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
            <UserCheck className="w-4 h-4" />
            <h4 className="font-bold text-slate-900 dark:text-white">1. Manajemen Pengguna & RBAC</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Tambah, edit, dan atur peran pengguna: <strong>Penyusun</strong>, <strong>Penelaah</strong>, atau <strong>Administrator</strong>. Dukungan import/export data guru via file Excel (.xlsx).
          </p>
        </div>

        {/* Module 2 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
            <FileSpreadsheet className="w-4 h-4" />
            <h4 className="font-bold text-slate-900 dark:text-white">2. Sinkronisasi Google Sheets & GAS</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Sinkronisasi cloud 2 arah otomatis ke Google Spreadsheet Database aktif (Sheet Butir_Soal, Pengguna_Sistem, dan Audit_Log) dengan Apps Script Engine.
          </p>
        </div>

        {/* Module 3 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
            <Download className="w-4 h-4" />
            <h4 className="font-bold text-slate-900 dark:text-white">3. Paket Soal & Ekspor Microsoft Word</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Kelola pembuatan Paket Soal (misal Paket A, Paket B) dan ekspor naskah soal lengkap ke format <strong>Microsoft Word (.docx)</strong> dengan tabel detail metadata (Nomor, Elemen, Sub-elemen, Kompetensi, Level Kognitif, Bentuk Soal).
          </p>
        </div>

        {/* Module 4 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
            <Layers className="w-4 h-4" />
            <h4 className="font-bold text-slate-900 dark:text-white">4. Master Kategori & Taksonomi</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Konfigurasi mata pelajaran TKAD (Bahasa Indonesia, Matematika, IPAS), penataan bobot penilaian, dan aturan workflow validasi butir soal.
          </p>
        </div>

        {/* Module 5 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="font-bold text-slate-900 dark:text-white">5. Audit Trail & Log Keamanan</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Pencatatan real-time setiap aksi penambahan, revisi, keputusan telaah, penguncian status, dan pembaruan versi soal secara kronologis dan transparan.
          </p>
        </div>

        {/* Module 6 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5">
          <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="font-bold text-slate-900 dark:text-white">6. Pengawasan Antrean Seluruh Mapel</h4>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Administrator memiliki hak peninjauan menyeluruh melintasi seluruh departemen mata pelajaran dan dapat mengambil tindakan penyesuaian darurat kapan saja.
          </p>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 4. ALUR KERJA PENJAMINAN MUTU (END-TO-END WORKFLOW)
  // ----------------------------------------------------
  const renderEndToEndWorkflow = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl space-y-2">
        <h3 className="font-bold text-base flex items-center space-x-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <span>Alur Penjaminan Mutu & Siklus Butir Soal Terintegrasi</span>
        </h3>
        <p className="text-xs text-blue-100 leading-relaxed">
          Diagram tahapan dari pembuatan naskah awal oleh Penyusun hingga disetujui Penelaah, masuk bank soal, dirakit ke paket ujian, dan diekspor ke Microsoft Word.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Step 1: Inisiasi */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-t-4 border-blue-600 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-wider">Tahap 1</span>
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-semibold">Penyusun</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">Penyusunan & Draf</h4>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Guru penyusun mengisi metadata taksonomi, stimulus bacaan, rumus KaTeX, kunci jawaban, dan pembahasan mendalam.
          </p>
        </div>

        {/* Step 2: Telaah */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-t-4 border-amber-500 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider">Tahap 2</span>
            <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold">Penelaah</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">Telaah Mutu & Review</h4>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Penelaah memeriksa butir soal pada antrian review berdasarkan 4 pilar mutu dan menetapkan keputusan: Setujui atau Revisi.
          </p>
        </div>

        {/* Step 3: Perbaikan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-t-4 border-indigo-500 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider">Tahap 3</span>
            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold">Penyusun</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">Perbaikan Revisi (Jika Ada)</h4>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Jika ada catatan perbaikan, penyusun merevisi naskah dan mengajukan ulang ke antrian telaah hingga disetujui.
          </p>
        </div>

        {/* Step 4: Rilis & Ekspor */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-t-4 border-emerald-500 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-wider">Tahap 4</span>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold">Admin / Tim</span>
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">Paket & Ekspor Word</h4>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Soal disetujui dirakit ke Paket Soal dan diekspor ke Microsoft Word (.docx) lengkap dengan tabel detail kisi-kisi dan lembar kunci.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Guide Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Panduan Penggunaan Aplikasi TKAD Adiwerna
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser.role === 'admin'
                  ? 'Akses panduan seluruh peran: Administrator, Penyusun, dan Penelaah'
                  : currentUser.role === 'pembuat'
                  ? 'Petunjuk kerja dan standar operasional bagi Penyusun Butir Soal'
                  : 'Petunjuk kerja dan standar penjaminan mutu bagi Penelaah Butir Soal'}
              </p>
            </div>
          </div>
        </div>

        {/* Role Indicator Badge */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400 dark:text-slate-500">Akses Pengguna:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              currentUser.role === 'pembuat'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : currentUser.role === 'reviewer'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
            }`}
          >
            {currentUser.role === 'pembuat' ? 'Penyusun' : currentUser.role === 'reviewer' ? 'Penelaah' : 'Administrator'}
          </span>
        </div>
      </div>

      {/* ADMIN VIEW: Interactive Role Tabs */}
      {currentUser.role === 'admin' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveAdminTab('admin')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminTab === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Panduan Administrator</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('pembuat')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminTab === 'pembuat'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Panduan Penyusun</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('reviewer')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminTab === 'reviewer'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Panduan Penelaah</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('workflow')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                activeAdminTab === 'workflow'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Alur Penjaminan Mutu</span>
            </button>
          </div>

          <div className="pt-2">
            {activeAdminTab === 'admin' && renderAdminGuide()}
            {activeAdminTab === 'pembuat' && renderPenyusunGuide(true)}
            {activeAdminTab === 'reviewer' && renderPenelaahGuide(true)}
            {activeAdminTab === 'workflow' && renderEndToEndWorkflow()}
          </div>
        </div>
      ) : currentUser.role === 'pembuat' ? (
        // PENYUSUN VIEW
        renderPenyusunGuide(false)
      ) : (
        // PENELAAH VIEW
        renderPenelaahGuide(false)
      )}
    </div>
  );
};
