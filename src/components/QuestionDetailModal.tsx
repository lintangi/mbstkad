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
  Square,
  Table as TableIcon,
  Tag,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LatexRenderer } from '../utils/latexParser';
import { normalizeGoogleDriveImageUrl, handleDriveImageError } from '../utils/googleDriveUtils';
import { QuestionPromptViewer } from './QuestionPromptViewer';

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
  const isReviewer = currentUser.role === 'reviewer' || currentUser.role === 'admin' || currentUser.roles?.includes('reviewer');
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
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Subtes / Mapel</span>
                <span className="font-semibold text-slate-800 dark:text-white">{question.subtest}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">1. Elemen / Topik</span>
                <span className="font-semibold text-slate-800 dark:text-white">{question.element || question.topic || 'Umum'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Tingkat Kesulitan</span>
                <span className="font-semibold text-slate-800 dark:text-white capitalize">{question.difficulty}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Bobot Skor & Versi</span>
                <span className="font-semibold text-slate-800 dark:text-white">{question.defaultScore} Poin • v{question.version}</span>
              </div>
            </div>

            {/* Extended Metadata: Sub-Elemen, Kompetensi, Level Kognitif, Tags */}
            {(question.subElement || question.competency || question.cognitiveLevel || (question.tags && question.tags.length > 0)) && (
              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {question.subElement && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">2. Sub Elemen</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{question.subElement}</span>
                    </div>
                  )}
                  {question.cognitiveLevel && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">4. Level Kognitif</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{question.cognitiveLevel}</span>
                    </div>
                  )}
                  {question.tags && question.tags.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Tags / Kata Kunci</span>
                      <div className="flex flex-wrap gap-1">
                        {question.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {question.competency && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">3. Kompetensi (Indikator Soal)</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">{question.competency}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TAB 1: CONTENT & ANSWER KEY */}
          {activeViewTab === 'content' && (
            <div className="space-y-6">
              {/* Question Text */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Teks Pokok Soal</span>
                <div className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                  <QuestionPromptViewer prompt={question.prompt} attachments={question.attachments} />
                </div>
              </div>

              {/* Specific Answer Keys by Type */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Struktur Jawaban & Kunci ({question.type.replace(/_/g, ' ').toUpperCase()})
                  </span>
                  {question.type === 'pilihan_ganda_kompleks' && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1">
                      <Square className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                      <span>Format Check Box (Tanpa a, b, c, d)</span>
                    </span>
                  )}
                  {question.type === 'benar_salah' && (
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center space-x-1">
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Format Tabel Terstruktur</span>
                    </span>
                  )}
                </div>

                {/* 1. Pilihan Ganda Tunggal */}
                {question.type === 'pilihan_ganda' && question.options && question.options.length > 0 && (
                  <div className="space-y-2">
                    {question.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border flex flex-col space-y-2 text-xs ${
                          opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
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
                        {opt.imageUrl && (
                          <div className="pl-9">
                            <img
                              src={normalizeGoogleDriveImageUrl(opt.imageUrl)}
                              alt={`Gambar Opsi ${opt.label}`}
                              className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700 object-contain shadow-2xs"
                              onError={(e) => handleDriveImageError(e, opt.imageUrl!)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Pilihan Ganda Kompleks (STRICTLY CHECKBOX WITHOUT A, B, C, D) */}
                {question.type === 'pilihan_ganda_kompleks' && question.options && question.options.length > 0 && (
                  <div className="space-y-2">
                    {question.options.map((opt, idx) => (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border-2 flex flex-col space-y-2 text-xs ${
                          opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Square Checkbox Indicator without A, B, C, D */}
                          <div
                            className={`w-6 h-6 rounded-md border-2 font-bold flex items-center justify-center text-xs shrink-0 ${
                              opt.isCorrect
                                ? 'bg-emerald-600 border-emerald-700 text-white'
                                : 'bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-600'
                            }`}
                          >
                            {opt.isCorrect && <span>✓</span>}
                          </div>
                          <div className="flex-1 text-slate-800 dark:text-slate-200">
                            <LatexRenderer content={opt.text} />
                            {opt.isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                                ✓ Kunci Jawaban Benar (Centang)
                              </span>
                            )}
                            {opt.explanation && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">{opt.explanation}</p>
                            )}
                          </div>
                        </div>
                        {opt.imageUrl && (
                          <div className="pl-9">
                            <img
                              src={normalizeGoogleDriveImageUrl(opt.imageUrl)}
                              alt="Gambar Opsi"
                              className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700 object-contain shadow-2xs"
                              onError={(e) => handleDriveImageError(e, opt.imageUrl!)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Benar / Salah (FORMAT TABEL DI SEMUA ROLE) */}
                {question.type === 'benar_salah' && question.trueFalseItems && question.trueFalseItems.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                          <th className="py-2.5 px-3 font-bold">Pernyataan Evaluasi</th>
                          <th className="py-2.5 px-3 font-bold w-24 text-center bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-l border-slate-200 dark:border-slate-700">
                            Benar (B)
                          </th>
                          <th className="py-2.5 px-3 font-bold w-24 text-center bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-l border-slate-200 dark:border-slate-700">
                            Salah (S)
                          </th>
                          <th className="py-2.5 px-3 font-bold w-28 text-center border-l border-slate-200 dark:border-slate-700">
                            Kunci Valid
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {question.trueFalseItems.map((tf, idx) => (
                          <tr key={tf.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/70">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                              <LatexRenderer content={tf.statement} />
                            </td>
                            <td className="py-2.5 px-3 text-center border-l border-slate-200 dark:border-slate-700 bg-emerald-50/20 dark:bg-emerald-950/20">
                              {tf.correctAnswer ? (
                                <span className="inline-block w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs leading-6">✓</span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center border-l border-slate-200 dark:border-slate-700 bg-rose-50/20 dark:bg-rose-950/20">
                              {!tf.correctAnswer ? (
                                <span className="inline-block w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-xs leading-6">✓</span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center border-l border-slate-200 dark:border-slate-700 font-bold">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                tf.correctAnswer
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              }`}>
                                {tf.correctAnswer ? 'BENAR' : 'SALAH'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

              {/* Question Text with QuestionPromptViewer */}
              <div className="text-slate-100 text-base leading-relaxed">
                <QuestionPromptViewer prompt={question.prompt} attachments={question.attachments} isExamMode={true} />
              </div>

              {/* Exam Options: Pilihan Ganda (Single - Radio Circle with Label) */}
              {question.type === 'pilihan_ganda' && question.options && question.options.length > 0 && (
                <div className="space-y-3 pt-2">
                  {question.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex flex-col space-y-2 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/60 cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="examAnswer"
                          className="w-4 h-4 text-blue-500 focus:ring-blue-400 bg-slate-700 border-slate-600"
                        />
                        <span className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {opt.label}
                        </span>
                        <div className="text-slate-200 text-sm flex-1">
                          <LatexRenderer content={opt.text} className="text-slate-200" />
                        </div>
                      </div>
                      {opt.imageUrl && (
                        <div className="pl-14">
                          <img
                            src={normalizeGoogleDriveImageUrl(opt.imageUrl)}
                            alt={`Opsi ${opt.label}`}
                            className="max-h-36 rounded-lg border border-slate-700 object-contain shadow-xs"
                            onError={(e) => handleDriveImageError(e, opt.imageUrl!)}
                          />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Exam Options: Pilihan Ganda Kompleks (Multi - STRICT SQUARE CHECKBOX WITHOUT A, B, C, D) */}
              {question.type === 'pilihan_ganda_kompleks' && question.options && question.options.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center space-x-2">
                    <Square className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                    <span>Pilihan Ganda Kompleks: Anda dapat memilih lebih dari satu jawaban yang benar (Centang kotak).</span>
                  </div>
                  {question.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex flex-col space-y-2 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/60 cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-3.5">
                        {/* Strictly Checkbox square without A, B, C, D */}
                        <input
                          type="checkbox"
                          name="examAnswerComplex"
                          className="w-5 h-5 rounded-md text-emerald-500 focus:ring-emerald-400 bg-slate-700 border-slate-500 shrink-0"
                        />
                        <div className="text-slate-200 text-sm flex-1">
                          <LatexRenderer content={opt.text} className="text-slate-200" />
                        </div>
                      </div>
                      {opt.imageUrl && (
                        <div className="pl-9">
                          <img
                            src={normalizeGoogleDriveImageUrl(opt.imageUrl)}
                            alt="Opsi Jawaban"
                            className="max-h-36 rounded-lg border border-slate-700 object-contain shadow-xs"
                            onError={(e) => handleDriveImageError(e, opt.imageUrl!)}
                          />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Exam Options: Benar / Salah (FORMAT TABEL DI SEMUA ROLE) */}
              {question.type === 'benar_salah' && question.trueFalseItems && question.trueFalseItems.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="overflow-x-auto border border-slate-700 rounded-xl bg-slate-850 shadow-md">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-slate-200 border-b border-slate-700">
                          <th className="py-3 px-3 font-bold w-12 text-center">No</th>
                          <th className="py-3 px-3 font-bold">Pernyataan Evaluasi</th>
                          <th className="py-3 px-4 font-bold w-28 text-center bg-emerald-950/40 text-emerald-300 border-l border-slate-700">
                            Benar (B)
                          </th>
                          <th className="py-3 px-4 font-bold w-28 text-center bg-rose-950/40 text-rose-300 border-l border-slate-700">
                            Salah (S)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-750">
                        {question.trueFalseItems.map((tf, idx) => (
                          <tr key={tf.id || idx} className="hover:bg-slate-800/60 transition">
                            <td className="py-3 px-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 text-slate-200">
                              <LatexRenderer content={tf.statement} />
                            </td>
                            <td className="py-3 px-4 text-center border-l border-slate-700 bg-emerald-950/20">
                              <label className="flex items-center justify-center cursor-pointer">
                                <input
                                  type="radio"
                                  name={`exam_tf_${tf.id || idx}`}
                                  value="true"
                                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-400 bg-slate-700 border-slate-600"
                                />
                              </label>
                            </td>
                            <td className="py-3 px-4 text-center border-l border-slate-700 bg-rose-950/20">
                              <label className="flex items-center justify-center cursor-pointer">
                                <input
                                  type="radio"
                                  name={`exam_tf_${tf.id || idx}`}
                                  value="false"
                                  className="w-4 h-4 text-rose-500 focus:ring-rose-400 bg-slate-700 border-slate-600"
                                />
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

            {/* Reviewer Action Button: Available whenever reviewer/admin wants to review or re-evaluate */}
            {isReviewer && (
              <button
                onClick={() => {
                  setReviewingQuestionId(question.id);
                  setSelectedQuestionId(null);
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer ${
                  question.status === 'menunggu_review'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                title="Buka form telaah untuk menyetujui, meminta revisi, atau menolak butir soal"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{question.status === 'menunggu_review' ? 'Mulai Telaah Soal Ini' : 'Telaah Ulang / Evaluasi Mutu'}</span>
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
