import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  X,
  CheckCircle2,
  Filter,
  Layers,
  Clock,
  School,
  Settings,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportQuestionsToWord, WordExportConfig } from '../utils/wordExport';

interface WordExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubtest?: string;
}

export const WordExportModal: React.FC<WordExportModalProps> = ({
  isOpen,
  onClose,
  initialSubtest = 'all',
}) => {
  const { questions, categories, logAudit } = useApp();

  const [documentTitle, setDocumentTitle] = useState('NASKAH SOAL ASESMEN KOMPETENSI TKAD-ADIWERNA');
  const [institutionName, setInstitutionName] = useState('TIM PENGEMBANG BANK SOAL TKAD-ADIWERNA');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [subtestFilter, setSubtestFilter] = useState<string>(initialSubtest);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(90);
  const [answerKeyMode, setAnswerKeyMode] = useState<'inline' | 'end_section' | 'none'>('none');
  const [generalInstructions, setGeneralInstructions] = useState(
    '1. Berdoalah sebelum mengerjakan soal. 2. Pilihlah satu jawaban yang paling tepat dengan menghitamkan bulatan pada lembar jawaban. 3. Periksa kembali pekerjaan Anda sebelum diserahkan.'
  );

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);

  // Available subtests list with counts
  const subtestStats = useMemo(() => {
    const list: { name: string; count: number }[] = [];
    const map = new Map<string, number>();

    questions.forEach((q) => {
      const current = map.get(q.subtest) || 0;
      map.set(q.subtest, current + 1);
    });

    categories.forEach((cat) => {
      if (!map.has(cat.name)) {
        map.set(cat.name, 0);
      }
    });

    map.forEach((count, name) => {
      list.push({ name, count });
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [questions, categories]);

  // Count matches
  const matchingQuestionsCount = useMemo(() => {
    return questions.filter((q) => {
      if (subtestFilter !== 'all' && q.subtest !== subtestFilter) return false;
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
      return true;
    }).length;
  }, [questions, subtestFilter, statusFilter, difficultyFilter]);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccessMsg(null);
      setExportErrorMsg(null);

      const config: WordExportConfig = {
        documentTitle,
        institutionName,
        academicYear,
        subtestFilter,
        statusFilter,
        difficultyFilter,
        includeAnswerKey: answerKeyMode !== 'none',
        answerKeyMode,
        timeLimitMinutes: timeLimitMinutes > 0 ? timeLimitMinutes : undefined,
        generalInstructions: generalInstructions.trim() || undefined,
      };

      const result = await exportQuestionsToWord(questions, config);

      logAudit(
        'DUPLICATE',
        undefined,
        undefined,
        `Ekspor naskah soal Word (.docx): ${result.totalExported} butir soal, Subtes: ${subtestFilter}, Mode Kunci: ${answerKeyMode}`
      );

      setExportSuccessMsg(`Berhasil mengekspor ${result.totalExported} butir soal ke file "${result.fileName}"!`);
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    } catch (err: any) {
      setIsExporting(false);
      setExportErrorMsg(err.message || 'Gagal mengekspor dokumen Word.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ekspor Naskah Soal ke Microsoft Word (.docx)</h3>
              <p className="text-xs text-blue-100/90">
                Cetak naskah ujian standar dengan tata letak rapi, KOP soal, dan filter mata pelajaran
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Notification / Alert messages */}
          {exportSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {exportErrorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-3 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{exportErrorMsg}</span>
            </div>
          )}

          {/* SECTION 1: FILTER MATA PELAJARAN / SUBTES (Primary Feature) */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Mata Pelajaran / Subtes</span>
              </label>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                Terpilih: {matchingQuestionsCount} butir soal
              </span>
            </div>

            <select
              value={subtestFilter}
              onChange={(e) => setSubtestFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="all">🌐 Semua Mata Pelajaran / Subtes ({questions.length} Soal)</option>
              {subtestStats.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  📚 {sub.name} ({sub.count} Butir Soal)
                </option>
              ))}
            </select>

            {/* Sub-Filters: Status & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Status Kelayakan Soal:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="disetujui">✔ Hanya yang Disetujui (Rekomendasi Naskah)</option>
                  <option value="menunggu_review">⏳ Menunggu Review</option>
                  <option value="draft">📝 Draf</option>
                  <option value="perlu_revisi">⚠️ Perlu Revisi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tingkat Kesulitan:
                </label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Tingkat Kesulitan</option>
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: MODE LEMBAR JAWABAN & PEMBAHASAN */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Format Kunci Jawaban & Pembahasan</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setAnswerKeyMode('none')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  answerKeyMode === 'none'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">1. Soal Siswa</span>
                  {answerKeyMode === 'none' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Naskah murni untuk ujian, tanpa kunci jawaban & pembahasan.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAnswerKeyMode('end_section')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  answerKeyMode === 'end_section'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">2. Kunci Terpisah</span>
                  {answerKeyMode === 'end_section' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kunci & pembahasan dicetak di halaman paling belakang.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAnswerKeyMode('inline')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  answerKeyMode === 'inline'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">3. Pedoman Lengkap</span>
                  {answerKeyMode === 'inline' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kunci & pembahasan langsung di bawah setiap nomor soal.
                </p>
              </button>
            </div>
          </div>

          {/* SECTION 3: KOP SURAT & ATRIBUT DOKUMEN */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <School className="w-3.5 h-3.5 text-slate-500" />
              <span>Atribut KOP Dokumen Word</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nama Lembaga / Instansi:
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Contoh: BANK SOAL ASESMEN TKAD-ADIWERNA"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Judul Naskah Soal:
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Contoh: NASKAH ASESMEN KOMPETENSI AKHIR"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tahun Ajaran / Sesi:
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="Contoh: 2025/2026"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Alokasi Waktu (Menit):
                </label>
                <input
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  min={10}
                  max={300}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Petunjuk Pengerjaan:
              </label>
              <textarea
                rows={2}
                value={generalInstructions}
                onChange={(e) => setGeneralInstructions(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Soal Siap Ekspor: <strong className="text-blue-600 dark:text-blue-400">{matchingQuestionsCount} Butir</strong>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || matchingQuestionsCount === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 shadow-md shadow-blue-500/20 transition flex items-center space-x-2 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Membuat Dokumen Word...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download File Word (.docx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
