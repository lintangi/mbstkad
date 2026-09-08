import React, { useState, useMemo } from 'react';
import {
  Clock,
  Filter,
  CheckCircle2,
  Eye,
  User,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LatexRenderer } from '../utils/latexParser';

export const ReviewQueueView: React.FC = () => {
  const {
    questions,
    categories,
    currentUser,
    setReviewingQuestionId,
    setSelectedQuestionId,
  } = useApp();

  const [selectedSubtest, setSelectedSubtest] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const pendingQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.status !== 'menunggu_review') return false;
      if (selectedSubtest !== 'all' && q.subtest !== selectedSubtest) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      return true;
    });
  }, [questions, selectedSubtest, selectedDifficulty]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Antrian Review Soal TKAD Adiwerna</h1>
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              {pendingQuestions.length} Menunggu
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar soal yang diajukan oleh Pembuat Soal untuk ditinjau kelayakan mutu dan kunci jawabannya.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Antrian:</span>
          </span>

          <select
            value={selectedSubtest}
            onChange={(e) => setSelectedSubtest(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Subtes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Tingkat Kesulitan</option>
            <option value="mudah">Mudah</option>
            <option value="sedang">Sedang</option>
            <option value="sulit">Sulit</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500">
          Prioritas: First-In First-Out (Urutan tanggal pengajuan)
        </span>
      </div>

      {/* Queue Items List */}
      {pendingQuestions.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Antrian Review Kosong!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Semua soal yang diajukan telah selesai ditinjau. Pembuat soal dapat mengajukan butir soal baru kapan saja.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-600 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                    {q.code}
                  </span>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1 border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3 h-3" />
                    <span>Menunggu Review</span>
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded font-medium border border-blue-200 dark:border-blue-800">
                    v{q.version}
                  </span>
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Diajukan: {new Date(q.updatedAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              {/* Subtest and Topics */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{q.subtest}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-400">{q.topic}</span>
                <span className="text-slate-400">•</span>
                <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{q.type.replace(/_/g, ' ')}</span>
                <span className="text-slate-400">•</span>
                <span
                  className={`px-2 py-0.2 rounded font-semibold capitalize text-[10px] ${
                    q.difficulty === 'mudah'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : q.difficulty === 'sedang'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  }`}
                >
                  {q.difficulty}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{q.defaultScore} Poin</span>
              </div>

              {/* Question Text preview with KaTeX */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                <LatexRenderer content={q.prompt} />
              </div>

              {/* Footer info & review action button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Penyusun: <strong className="text-slate-700 dark:text-slate-200">{q.createdByName}</strong></span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedQuestionId(q.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Peserta</span>
                  </button>

                  <button
                    onClick={() => setReviewingQuestionId(q.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mulai Penilaian Mutu</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
