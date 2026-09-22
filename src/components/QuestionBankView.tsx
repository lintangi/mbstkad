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
  Package,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question, QuestionStatus, DifficultyLevel, QuestionType } from '../types';
import { LatexRenderer } from '../utils/latexParser';
import { WordExportModal } from './WordExportModal';
import { QuestionPacketModal } from './QuestionPacketModal';

export const QuestionBankView: React.FC = () => {
  const {
    questions,
    packets,
    categories,
    setSelectedQuestionId,
    setEditingQuestionId,
    duplicateQuestion,
    deleteQuestion,
    bulkDeleteQuestions,
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
  const [isPacketModalOpen, setIsPacketModalOpen] = useState<boolean>(false);

  // Checkbox Selection State for Bulk Actions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

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
        const matchElement = (q.element || '').toLowerCase().includes(query);
        const matchSubElement = (q.subElement || '').toLowerCase().includes(query);
        const matchCompetency = (q.competency || '').toLowerCase().includes(query);
        const matchAuthor = q.createdByName.toLowerCase().includes(query);
        const matchTags = q.tags.some((t) => t.toLowerCase().includes(query));
        return matchCode || matchPrompt || matchTopic || matchElement || matchSubElement || matchCompetency || matchAuthor || matchTags;
      }
      return true;
    });
  }, [questions, selectedSubtest, selectedStatus, selectedDifficulty, selectedType, searchTerm]);

  // Checkbox toggle helpers
  const handleToggleSelect = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected = useMemo(() => {
    if (filteredQuestions.length === 0) return false;
    return filteredQuestions.every((q) => selectedQuestionIds.includes(q.id));
  }, [filteredQuestions, selectedQuestionIds]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredQuestions.map((q) => q.id));
      setSelectedQuestionIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const allFilteredIds = filteredQuestions.map((q) => q.id);
      setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleBulkDelete = () => {
    if (selectedQuestionIds.length === 0) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedQuestionIds.length} butir soal terpilih?`)) {
      bulkDeleteQuestions(selectedQuestionIds);
      setSelectedQuestionIds([]);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const targetList = selectedQuestionIds.length > 0
      ? questions.filter((q) => selectedQuestionIds.includes(q.id))
      : filteredQuestions;

    const headers = ['Kode Soal', 'Tipe', 'Subtes', 'Elemen', 'Sub Elemen', 'Kompetensi', 'Level Kognitif', 'Kesulitan', 'Skor', 'Status', 'Versi', 'Teks Soal', 'Penyusun'];
    const rows = targetList.map((q) => [
      `"${q.code}"`,
      `"${q.type}"`,
      `"${q.subtest}"`,
      `"${q.element || q.topic}"`,
      `"${q.subElement || ''}"`,
      `"${q.competency || ''}"`,
      `"${q.cognitiveLevel || ''}"`,
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
    const targetList = selectedQuestionIds.length > 0
      ? questions.filter((q) => selectedQuestionIds.includes(q.id))
      : filteredQuestions;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(targetList, null, 2));
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Bank Soal & Pencarian</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola, telusuri, kelompokkan menjadi paket naskah soal, dan lakukan tindakan massal pada bank soal ujian akademik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Packet Management Button */}
          <button
            onClick={() => setIsPacketModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Kelola Paket Naskah Soal Ujian"
          >
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Paket Soal</span>
            {packets.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {packets.length}
              </span>
            )}
          </button>

          {/* Word Export Button */}
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

      {/* Floating Bulk Action Bar when questions are selected */}
      {selectedQuestionIds.length > 0 && (
        <div className="sticky top-4 z-30 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {selectedQuestionIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              butir soal terpilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Group into Packet */}
            <button
              onClick={() => setIsPacketModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Kelompokkan Jadi Paket Soal</span>
            </button>

            {/* Bulk Delete */}
            {currentUser.role === 'admin' && (
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Soal Terpilih ({selectedQuestionIds.length})</span>
              </button>
            )}

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedQuestionIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

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
              placeholder="Cari kode soal, elemen, kompetensi, teks soal, tag..."
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
          <div className="flex items-center space-x-3">
            <span>
              Menampilkan <strong className="text-slate-800 dark:text-white">{filteredQuestions.length}</strong> butir soal
            </span>
            {selectedQuestionIds.length > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                ({selectedQuestionIds.length} dipilih)
              </span>
            )}
          </div>

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
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title={isAllFilteredSelected ? 'Batalkan pilihan semua' : 'Pilih semua soal di halaman ini'}
                    />
                  </th>
                  <th className="px-3 py-3">Kode & Versi</th>
                  <th className="px-4 py-3">Subtes & Elemen</th>
                  <th className="px-4 py-3">Tipe & Level</th>
                  <th className="px-4 py-3 max-w-xs">Teks Soal</th>
                  <th className="px-4 py-3">Penyusun</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  return (
                    <tr
                      key={q.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-850/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(q.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Code & Version */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{q.code}</span>
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-200 dark:border-blue-800">
                            v{q.version}
                          </span>
                        </div>
                      </td>

                      {/* Subtest & Element */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{q.subtest}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {q.element || q.topic}
                          {q.subElement ? ` • ${q.subElement}` : ''}
                        </div>
                      </td>

                      {/* Type, Difficulty & Cognitive Level */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="capitalize text-slate-700 dark:text-slate-300 font-medium">{q.type.replace(/_/g, ' ')}</div>
                        <div className="flex items-center space-x-1 mt-0.5">
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
                          {q.cognitiveLevel && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {q.cognitiveLevel.split(' - ')[0]}
                            </span>
                          )}
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuestions.map((q) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            return (
              <div
                key={q.id}
                className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(q.id)}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{q.code}</span>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-200 dark:border-blue-800">
                        v{q.version}
                      </span>
                    </div>
                    {getStatusBadge(q.status)}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{q.subtest}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs">
                      {' '}• {q.element || q.topic}
                      {q.subElement ? ` (${q.subElement})` : ''}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 bg-slate-50/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-sans">
                    {q.prompt.replace(/\$+/g, '')}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="capitalize font-medium">{q.type.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{q.difficulty}</span>
                    <span>•</span>
                    <span>{q.defaultScore} Poin</span>
                    {q.cognitiveLevel && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {q.cognitiveLevel.split(' - ')[0]}
                      </span>
                    )}
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
            );
          })}
        </div>
      )}

      {/* Word Document Export Modal */}
      <WordExportModal
        isOpen={isWordExportModalOpen}
        onClose={() => setIsWordExportModalOpen(false)}
        initialSubtest={selectedSubtest}
      />

      {/* Question Packet Modal */}
      <QuestionPacketModal
        isOpen={isPacketModalOpen}
        onClose={() => setIsPacketModalOpen(false)}
        selectedQuestionIds={selectedQuestionIds}
        onClearSelection={() => setSelectedQuestionIds([])}
      />
    </div>
  );
};
