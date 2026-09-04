import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Plus,
  Copy,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
  Folder,
  SlidersHorizontal,
  FileSpreadsheet,
  FileCode,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question, QuestionStatus, DifficultyLevel, QuestionType } from '../types';
import { LatexRenderer } from '../utils/latexParser';
import { WordExportModal } from './WordExportModal';

export const QuestionBankView: React.FC = () => {
  const {
    questions,
    categories,
    setSelectedQuestionId,
    setEditingQuestionId,
    duplicateQuestion,
    deleteQuestion,
    setActiveTab,
    currentUser,
  } = useApp();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubtest, setSelectedSubtest] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isWordExportModalOpen, setIsWordExportModalOpen] = useState<boolean>(false);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Subtest
      if (selectedSubtest !== 'all' && q.subtest !== selectedSubtest) return false;
      // Status
      if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
      // Difficulty
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      // Type
      if (selectedType !== 'all' && q.type !== selectedType) return false;
      // Search keyword
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = q.code.toLowerCase().includes(query);
        const matchPrompt = q.prompt.toLowerCase().includes(query);
        const matchTopic = q.topic.toLowerCase().includes(query);
        const matchAuthor = q.createdByName.toLowerCase().includes(query);
        const matchTags = q.tags.some((t) => t.toLowerCase().includes(query));
        return matchCode || matchPrompt || matchTopic || matchAuthor || matchTags;
      }
      return true;
    });
  }, [questions, selectedSubtest, selectedStatus, selectedDifficulty, selectedType, searchTerm]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Kode Soal', 'Tipe', 'Subtes', 'Topik', 'Kesulitan', 'Skor', 'Status', 'Versi', 'Teks Soal', 'Penyusun'];
    const rows = filteredQuestions.map((q) => [
      `"${q.code}"`,
      `"${q.type}"`,
      `"${q.subtest}"`,
      `"${q.topic}"`,
      `"${q.difficulty}"`,
      q.defaultScore,
      `"${q.status}"`,
      `"v${q.version}"`,
      `"${q.prompt.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${q.createdByName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bank_soal_tkad_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredQuestions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bank_soal_tkad_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case 'disetujui':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Disetujui
          </span>
        );
      case 'menunggu_review':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Menunggu Review
          </span>
        );
      case 'perlu_revisi':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Perlu Revisi
          </span>
        );
      case 'ditolak':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Ditolak
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Draf
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Bank Soal TKAD-Adiwerna</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola, telusuri, kategorisasikan (Bahasa Indonesia, Matematika, IPAS), dan ekspor bank soal ujian akademik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Word Export Button (Featured) */}
          <button
            onClick={() => setIsWordExportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5 cursor-pointer"
            title="Ekspor Naskah Soal ke Dokumen Microsoft Word (.docx) dengan Filter Mata Pelajaran"
          >
            <FileText className="w-4 h-4 text-blue-100" />
            <span>Ekspor Word (.docx)</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
              {selectedSubtest === 'all' ? 'Semua Mapel' : selectedSubtest}
            </span>
          </button>

          {/* Export Dropdowns */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 overflow-hidden shadow-2xs">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 border-r border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Ekspor format CSV Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 border-r border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Ekspor format JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cetak Soal / PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingQuestionId(null);
              setActiveTab('buat_soal');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Category Tabs (Folders) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedSubtest('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
            selectedSubtest === 'all'
              ? 'bg-slate-800 dark:bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Semua Subtes ({questions.length})</span>
        </button>

        {categories.map((cat) => {
          const count = questions.filter((q) => q.subtest === cat.name).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedSubtest(cat.name)}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                selectedSubtest === cat.name
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{cat.name} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari kode soal, topik, teks soal, penyusun, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800"
            >
              <option value="all">Semua Status</option>
              <option value="disetujui">Disetujui (Siap Ujian)</option>
              <option value="menunggu_review">Menunggu Review</option>
              <option value="perlu_revisi">Perlu Revisi</option>
              <option value="draft">Draf</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800"
            >
              <option value="all">Semua Kesulitan</option>
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
            </select>
          </div>

          {/* Question Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800"
            >
              <option value="all">Semua Tipe Soal</option>
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks</option>
              <option value="menjodohkan">Menjodohkan</option>
              <option value="benar_salah">Benar / Salah</option>
              <option value="isian_singkat">Isian Singkat</option>
              <option value="esai">Esai</option>
            </select>
          </div>
        </div>

        {/* Results summary & View mode toggle */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>
            Menampilkan <strong className="text-slate-800 dark:text-white">{filteredQuestions.length}</strong> butir soal
          </span>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Tabel
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Kartu
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-slate-400 dark:text-slate-500 text-sm">Tidak ada soal yang cocok dengan filter atau kata kunci pencarian.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSubtest('all');
              setSelectedStatus('all');
              setSelectedDifficulty('all');
              setSelectedType('all');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Kode & Versi</th>
                  <th className="px-4 py-3">Subtes & Topik</th>
                  <th className="px-4 py-3">Tipe & Kesulitan</th>
                  <th className="px-4 py-3 max-w-xs">Teks Soal</th>
                  <th className="px-4 py-3">Penyusun</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition">
                    {/* Code & Version */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{q.code}</span>
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-200 dark:border-blue-800">
                          v{q.version}
                        </span>
                      </div>
                    </td>

                    {/* Subtest & Topic */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{q.subtest}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{q.topic}</div>
                    </td>

                    {/* Type & Difficulty */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="capitalize text-slate-700 dark:text-slate-300 font-medium">{q.type.replace(/_/g, ' ')}</div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold capitalize ${
                          q.difficulty === 'mudah'
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                            : q.difficulty === 'sedang'
                            ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                            : 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {q.difficulty} • {q.defaultScore} pt
                      </span>
                    </td>

                    {/* Prompt Preview */}
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                      <span className="line-clamp-1">{q.prompt.replace(/\$+/g, '')}</span>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 text-[11px]">
                      {q.createdByName}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(q.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                      <button
                        onClick={() => setSelectedQuestionId(q.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Lihat Detail & Pratinjau"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateQuestion(q.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Duplikasi Variasi"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingQuestionId(q.id);
                          setActiveTab('buat_soal');
                        }}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Edit Soal"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus soal ${q.code}?`)) {
                              deleteQuestion(q.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{q.code}</span>
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-200 dark:border-blue-800">
                      v{q.version}
                    </span>
                  </div>
                  {getStatusBadge(q.status)}
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{q.subtest}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs"> • {q.topic}</span>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 bg-slate-50/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-sans">
                  {q.prompt.replace(/\$+/g, '')}
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="capitalize font-medium">{q.type.replace(/_/g, ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{q.difficulty}</span>
                  <span>•</span>
                  <span>{q.defaultScore} Poin</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Oleh: {q.createdByName}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedQuestionId(q.id)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition cursor-pointer"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuestionId(q.id);
                      setActiveTab('buat_soal');
                    }}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Word Document Export Modal */}
      <WordExportModal
        isOpen={isWordExportModalOpen}
        onClose={() => setIsWordExportModalOpen(false)}
        initialSubtest={selectedSubtest}
      />
    </div>
  );
};
