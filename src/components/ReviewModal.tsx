import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  User,
  Clock,
  Layers,
  Sparkles,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReviewCriteriaRating } from '../types';
import { LatexRenderer } from '../utils/latexParser';

export const ReviewModal: React.FC = () => {
  const {
    reviewingQuestionId,
    setReviewingQuestionId,
    questions,
    submitReview,
    currentUser,
  } = useApp();

  const question = questions.find((q) => q.id === reviewingQuestionId);

  const [criteria, setCriteria] = useState<ReviewCriteriaRating>({
    kejelasanBahasa: true,
    kebenaranKunci: true,
    kesesuaianTingkat: true,
    kesesuaianKisiKisi: true,
  });

  const [generalComment, setGeneralComment] = useState('');
  const [optionComments, setOptionComments] = useState<Record<string, string>>({});
  const [showOptionComments, setShowOptionComments] = useState(false);

  if (!question) return null;

  const handleDecision = (decision: 'approve' | 'reject' | 'request_changes') => {
    if (!generalComment.trim() && decision !== 'approve') {
      alert('Wajib mengisi komentar/alasan review jika memilih Revisi atau Tolak!');
      return;
    }

    submitReview(
      question.id,
      decision,
      criteria,
      generalComment.trim() || (decision === 'approve' ? 'Soal telah diverifikasi dan memenuhi standar mutu TKAD.' : ''),
      optionComments
    );

    setReviewingQuestionId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Formulir Penjaminan Mutu & Review Soal</h3>
                <span className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                  {question.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyusun: {question.createdByName} • Subtes: {question.subtest} ({question.difficulty})
              </p>
            </div>
          </div>

          <button
            onClick={() => setReviewingQuestionId(null)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split View: Question Preview on Top/Left, Form on Bottom/Right */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Question Preview Box */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pratinjau Soal & Kunci Jawaban
              </span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Bobot: {question.defaultScore} Poin
              </span>
            </div>

            <div className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <LatexRenderer content={question.prompt} />
              {question.attachments.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {question.attachments.map((att) => (
                    <img key={att.id} src={att.url} alt={att.name} className="max-h-40 rounded border border-slate-200 dark:border-slate-700 mx-auto" />
                  ))}
                </div>
              )}
            </div>

            {/* Answer Key preview */}
            {question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {question.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
                      opt.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 font-semibold text-emerald-900 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="w-5 h-5 rounded font-bold bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-700 dark:text-slate-300">
                      {opt.label}
                    </span>
                    <div className="flex-1 truncate">
                      <LatexRenderer content={opt.text} />
                    </div>
                    {opt.isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {/* Explanation snippet */}
            {question.explanation && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase block mb-0.5">Pembahasan:</span>
                <LatexRenderer content={question.explanation} />
              </div>
            )}
          </div>

          {/* Quality Criteria Checklist */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Checklist Kriteria Kualitas Soal (Standar TKAD)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={criteria.kejelasanBahasa}
                  onChange={(e) => setCriteria({ ...criteria, kejelasanBahasa: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Kejelasan Bahasa & Konstruksi</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Kalimat efektif, bebas bias/ambiguitas, petunjuk jelas.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={criteria.kebenaranKunci}
                  onChange={(e) => setCriteria({ ...criteria, kebenaranKunci: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Kebenaran Kunci & Pembahasan</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Kunci jawaban terbukti benar dan pembahasan valid secara ilmiah.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={criteria.kesesuaianTingkat}
                  onChange={(e) => setCriteria({ ...criteria, kesesuaianTingkat: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Kesesuaian Tingkat Kesulitan</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Sesuai klasifikasi ({question.difficulty}) dan daya pembeda memadai.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={criteria.kesesuaianKisiKisi}
                  onChange={(e) => setCriteria({ ...criteria, kesesuaianKisiKisi: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Kesesuaian Kisi-kisi & Taksonomi</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Relevan dengan taksonomi kompetensi akademik TKAD.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Review Comments Form */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Catatan & Rekomendasi Penelaah
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Komentar Umum / Alasan Keputusan
              </label>
              <textarea
                rows={3}
                placeholder="Berikan umpan balik konstruktif bagi penyusun soal (misal perbaikan rumus, koreksi opsi distraktor, dll)..."
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Optional per-option comments toggle */}
            {question.options && question.options.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowOptionComments(!showOptionComments)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{showOptionComments ? 'Tutup Catatan per Opsi' : '+ Tambah Catatan Khusus per Opsi Jawaban'}</span>
                </button>

                {showOptionComments && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {question.options.map((opt) => (
                      <div key={opt.id} className="flex items-center space-x-2 text-xs">
                        <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {opt.label}
                        </span>
                        <input
                          type="text"
                          placeholder={`Catatan spesifik untuk Opsi ${opt.label}...`}
                          value={optionComments[opt.id] || ''}
                          onChange={(e) =>
                            setOptionComments({ ...optionComments, [opt.id]: e.target.value })
                          }
                          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer: The 3 Decision Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>Evaluator: </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleDecision('reject')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Tolak (Reject)</span>
            </button>

            <button
              onClick={() => handleDecision('request_changes')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Perlu Revisi (Changes)</span>
            </button>

            <button
              onClick={() => handleDecision('approve')}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Setujui (Approve)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
