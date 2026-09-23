import React, { useState } from 'react';
import {
  X,
  Eye,
  History,
  CheckCircle2,
  Clock,
  Edit,
  RotateCcw,
  Copy,
  Printer,
  ShieldAlert,
  ArrowRight,
  User,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LatexRenderer } from '../utils/latexParser';
import { normalizeGoogleDriveImageUrl } from '../utils/googleDriveUtils';

export const QuestionDetailModal: React.FC = () => {
  const {
    selectedQuestionId,
    setSelectedQuestionId,
    questions,
    currentUser,
    setEditingQuestionId,
    setReviewingQuestionId,
    recallQuestion,
    duplicateQuestion,
    setActiveTab,
  } = useApp();

  const [activeViewTab, setActiveViewTab] = useState<'content' | 'exam_preview' | 'versions' | 'reviews'>('content');

  const question = questions.find((q) => q.id === selectedQuestionId);
  if (!question) return null;

  const isAuthor = currentUser.id === question.createdById || currentUser.role === 'pembuat';
  const isReviewer = currentUser.role === 'reviewer';
  const isAdmin = currentUser.role === 'admin';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disetujui':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui</span>
          </span>
        );
      case 'menunggu_review':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Review</span>
          </span>
        );
      case 'perlu_revisi':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Perlu Revisi</span>
          </span>
        );
      case 'ditolak':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Draf
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {question.code}
            </span>
            {getStatusBadge(question.status)}
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
              v{question.version}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cetak Soal"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedQuestionId(null)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex space-x-4 text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveViewTab('content')}
            className={`py-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeViewTab === 'content'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Konten & Kunci Jawaban
          </button>
          <button
            onClick={() => setActiveViewTab('exam_preview')}
            className={`py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'exam_preview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau Peserta Ujian</span>
          </button>
          <button
            onClick={() => setActiveViewTab('versions')}
            className={`py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'versions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Versi ({question.versions.length})</span>
          </button>
          <button
            onClick={() => setActiveViewTab('reviews')}
            className={`py-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'reviews'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Catatan Review ({question.reviews.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Metadata pill cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Subtes / Mapel</span>
              <span className="font-semibold text-slate-800 dark:text-white">{question.subtest}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Topik</span>
              <span className="font-semibold text-slate-800 dark:text-white">{question.topic}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Tingkat Kesulitan</span>
              <span className="font-semibold text-slate-800 dark:text-white capitalize">{question.difficulty}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Bobot Skor Default</span>
              <span className="font-semibold text-slate-800 dark:text-white">{question.defaultScore} Poin</span>
            </div>
          </div>

          {/* TAB 1: CONTENT & ANSWER KEY */}
          {activeViewTab === 'content' && (
            <div className="space-y-6">
              {/* Question Text */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Teks Pertanyaan</span>
                <div className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                  <LatexRenderer content={question.prompt} />
                </div>

                {question.attachments.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {question.attachments.map((att) => {
                      const alignClass = 
                        att.align === 'left' ? 'text-left' :
                        att.align === 'right' ? 'text-right' :
                        'text-center';

                      const alignImgClass = 
                        att.align === 'left' ? 'mr-auto ml-0' :
                        att.align === 'right' ? 'ml-auto mr-0' :
                        'mx-auto';

                      const widthStyle = att.width ? `${att.width}%` : '100%';
                      const resolvedUrl = normalizeGoogleDriveImageUrl(att.url);

                      return (
                        <div key={att.id} className={alignClass}>
                          <img
                            src={resolvedUrl}
                            alt={att.name}
                            style={{ width: widthStyle }}
                            className={`max-h-80 rounded-lg border border-slate-200 dark:border-slate-700 object-contain shadow-2xs ${alignImgClass}`}
                            onError={(e) => {
                              // If lh3 fails, fallback to standard drive view if drive ID exists
                              const target = e.currentTarget;
                              if (!target.dataset.triedFallback && att.url !== resolvedUrl) {
                                target.dataset.triedFallback = 'true';
                                target.src = att.url;
                              }
                            }}
                          />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block italic">{att.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Specific Answer Keys by Type */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Struktur Jawaban & Kunci ({question.type.replace(/_/g, ' ').toUpperCase()})
                </span>

                {/* Multiple Choice (Single / Complex) */}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-2">
                    {question.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border flex items-start space-x-3 text-xs ${
                          opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </div>
                        <div className="flex-1 text-slate-800 dark:text-slate-200">
                          <LatexRenderer content={opt.text} />
                          {opt.isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                              ✓ Kunci Jawaban Benar
                            </span>
                          )}
                          {opt.explanation && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">{opt.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching Pairs */}
                {question.matchingPairs && question.matchingPairs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {question.matchingPairs.map((pair, idx) => (
                      <div key={pair.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-400 dark:text-slate-500 block mb-1">Pasangan #{idx + 1}</span>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          <LatexRenderer content={pair.premise} />
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                          <span>Pasangan:</span>
                          <LatexRenderer content={pair.response} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* True / False */}
                {question.trueFalseItems && question.trueFalseItems.length > 0 && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {question.trueFalseItems.map((tf, idx) => (
                      <div key={tf.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex-1 pr-4 text-slate-800 dark:text-slate-200">
                          <span className="font-bold text-slate-400 dark:text-slate-500 mr-2">{idx + 1}.</span>
                          <LatexRenderer content={tf.statement} className="inline" />
                        </div>
                        <span
                          className={`px-3 py-1 rounded-md font-bold text-xs ${
                            tf.correctAnswer
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {tf.correctAnswer ? 'BENAR' : 'SALAH'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Short Answer */}
                {question.shortAnswerKey && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Kunci Isian Singkat:</span>
                    <span className="font-mono text-sm font-bold text-emerald-900 dark:text-emerald-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-700 inline-block">
                      {question.shortAnswerKey}
                    </span>
                  </div>
                )}

                {/* Essay Rubric */}
                {question.essayRubric && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Rubrik Penilaian & Pembobotan:</span>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">{question.essayRubric}</p>
                  </div>
                )}
              </div>

              {/* Explanation / Pembahasan */}
              {question.explanation && (
                <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Pembahasan & Solusi Lengkap
                  </span>
                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    <LatexRenderer content={question.explanation} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXAM SIMULATION (STUDENT VIEW) */}
          {activeViewTab === 'exam_preview' && (
            <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-inner space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    SIMULASI UJIAN CAT TKAD RESMI • BUTIR SOAL
                  </span>
                </div>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-mono">
                  Bobot: {question.defaultScore} Poin
                </span>
              </div>

              {/* Question Text */}
              <div className="text-slate-100 text-base leading-relaxed">
                <LatexRenderer content={question.prompt} className="text-slate-100" />
                {question.attachments && question.attachments.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {question.attachments.map((att) => {
                      const alignClass = 
                        att.align === 'left' ? 'text-left' :
                        att.align === 'right' ? 'text-right' :
                        'text-center';

                      const alignImgClass = 
                        att.align === 'left' ? 'mr-auto ml-0' :
                        att.align === 'right' ? 'ml-auto mr-0' :
                        'mx-auto';

                      const widthStyle = att.width ? `${att.width}%` : '100%';
                      const resolvedUrl = normalizeGoogleDriveImageUrl(att.url);

                      return (
                        <div key={att.id} className={alignClass}>
                          <img
                            src={resolvedUrl}
                            alt={att.name}
                            style={{ width: widthStyle }}
                            className={`max-h-80 rounded-lg border border-slate-700 object-contain shadow-md ${alignImgClass}`}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.triedFallback && att.url !== resolvedUrl) {
                                target.dataset.triedFallback = 'true';
                                target.src = att.url;
                              }
                            }}
                          />
                          <span className="text-[11px] text-slate-400 mt-1 block italic">{att.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Exam Options */}
              {question.options && question.options.length > 0 && (
                <div className="space-y-3 pt-2">
                  {question.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/60 cursor-pointer transition"
                    >
                      <input
                        type={question.type === 'pilihan_ganda' ? 'radio' : 'checkbox'}
                        name="examAnswer"
                        className="w-4 h-4 text-blue-500 focus:ring-blue-400 bg-slate-700 border-slate-600"
                      />
                      <span className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                        {opt.label}
                      </span>
                      <div className="text-slate-200 text-sm">
                        <LatexRenderer content={opt.text} className="text-slate-200" />
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Exam Short Answer */}
              {question.type === 'isian_singkat' && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Ketikkan jawaban Anda di sini..."
                    className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              {/* Exam Essay */}
              {question.type === 'esai' && (
                <div className="pt-2">
                  <textarea
                    rows={4}
                    placeholder="Tuliskan argumen dan pembuktian jawaban Anda secara komprehensif..."
                    className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              <div className="text-[11px] text-slate-400 text-right pt-2">
                * Ini adalah simulasi tampilan kandidat saat mengerjakan ujian daring berbasis Google Apps Script.
              </div>
            </div>
          )}

          {/* TAB 3: VERSION HISTORY */}
          {activeViewTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Log Perubahan Versi (Immutable Versioning Trail)
                </h4>
                <span className="text-xs text-slate-400">Versi Saat Ini: v{question.version}</span>
              </div>

              {question.versions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Belum ada riwayat revisi versi sebelumnya.</div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {question.versions.map((ver, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            Versi {ver.versionNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ver.timestamp).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{ver.changeSummary}</p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2 pt-1">
                          <User className="w-3 h-3" />
                          <span>Dimodifikasi oleh: {ver.modifiedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REVIEWS & AUDIT */}
          {activeViewTab === 'reviews' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Riwayat Evaluasi Penjaminan Mutu & Komentar
              </h4>

              {question.reviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada catatan review untuk butir soal ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {question.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{rev.reviewerName}</span>
                          <span className="text-[10px] text-slate-400">• Penelaah Mutu</span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            rev.decision === 'approve'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : rev.decision === 'reject'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {rev.decision.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Criteria Checklist Indicators */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <span className={rev.criteria.kejelasanBahasa ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                            {rev.criteria.kejelasanBahasa ? '✓' : '✗'}
                          </span>
                          <span>Kejelasan Bahasa</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <span className={rev.criteria.akurasiKunci ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                            {rev.criteria.akurasiKunci ? '✓' : '✗'}
                          </span>
                          <span>Akurasi Kunci Jawaban</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <span className={rev.criteria.kesesuaianTingkat ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                            {rev.criteria.kesesuaianTingkat ? '✓' : '✗'}
                          </span>
                          <span>Kesesuaian Kesulitan</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <span className={rev.criteria.kualitasPengecoh ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                            {rev.criteria.kualitasPengecoh ? '✓' : '✗'}
                          </span>
                          <span>Kualitas Pengecoh</span>
                        </div>
                      </div>

                      {/* Comments / Notes */}
                      {rev.comment && (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Catatan Evaluator:</span>
                          <p className="whitespace-pre-line leading-relaxed">{rev.comment}</p>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Tanggal Review: {new Date(rev.timestamp).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Dibuat oleh: <strong className="text-slate-800 dark:text-slate-200">{question.createdByName}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Author Recall button (if waiting review) */}
            {question.status === 'menunggu_review' && isAuthor && (
              <button
                onClick={() => {
                  recallQuestion(question.id);
                  setSelectedQuestionId(null);
                }}
                className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tarik Soal (Recall Draf)</span>
              </button>
            )}

            {/* Reviewer Action Button */}
            {isReviewer && question.status === 'menunggu_review' && (
              <button
                onClick={() => {
                  setReviewingQuestionId(question.id);
                  setSelectedQuestionId(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mulai Telaah Soal Ini</span>
              </button>
            )}

            {/* Duplicate button */}
            <button
              onClick={() => {
                duplicateQuestion(question.id);
                setSelectedQuestionId(null);
                setActiveTab('bank_soal');
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplikasi Variasi</span>
            </button>

            {/* Edit button */}
            {(isAuthor || isAdmin) && (
              <button
                onClick={() => {
                  setEditingQuestionId(question.id);
                  setSelectedQuestionId(null);
                  setActiveTab('buat_soal');
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{question.status === 'disetujui' ? 'Buat Versi Revisi' : 'Edit Soal'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
