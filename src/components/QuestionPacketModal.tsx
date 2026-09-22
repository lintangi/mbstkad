import React, { useState } from 'react';
import {
  X,
  Package,
  Plus,
  CheckCircle2,
  Trash2,
  Layers,
  FileSpreadsheet,
  FileText,
  Calendar,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuestionPacket, Question } from '../types';

interface QuestionPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestionIds: string[];
  onClearSelection?: () => void;
}

export const QuestionPacketModal: React.FC<QuestionPacketModalProps> = ({
  isOpen,
  onClose,
  selectedQuestionIds,
  onClearSelection,
}) => {
  const {
    questions,
    packets,
    createPacket,
    updatePacket,
    deletePacket,
    addQuestionsToPacket,
    removeQuestionFromPacket,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'create' | 'append' | 'manage'>('create');

  // Form State for new packet
  const [packetCode, setPacketCode] = useState(() => `PKT-${Date.now().toString().slice(-4)}`);
  const [packetTitle, setPacketTitle] = useState('');
  const [packetDescription, setPacketDescription] = useState('');
  const [packetSubtest, setPacketSubtest] = useState('Bahasa Indonesia');
  const [targetClass, setTargetClass] = useState('Kelas 9');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [packetStatus, setPacketStatus] = useState<'aktif' | 'draft' | 'arsip'>('aktif');

  // Append state
  const [selectedExistingPacketId, setSelectedExistingPacketId] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedQuestions = questions.filter((q) => selectedQuestionIds.includes(q.id));

  const handleCreatePacket = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!packetTitle.trim()) {
      setErrorMessage('Silakan isi judul paket soal.');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      setErrorMessage('Pilih minimal 1 butir soal untuk dikelompokkan.');
      return;
    }

    try {
      const created = createPacket({
        code: packetCode.trim() || `PKT-${Date.now().toString().slice(-4)}`,
        title: packetTitle.trim(),
        description: packetDescription.trim(),
        subtest: packetSubtest,
        questionIds: selectedQuestionIds,
        targetClass,
        academicYear,
        status: packetStatus,
      });

      setSuccessMessage(`Paket soal "${created.title}" berhasil dibuat dengan ${created.totalQuestions} butir soal!`);
      if (onClearSelection) onClearSelection();
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('manage');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(`Gagal membuat paket: ${err?.message || err}`);
    }
  };

  const handleAppendToExisting = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedExistingPacketId) {
      setErrorMessage('Pilih paket soal tujuan.');
      return;
    }

    if (selectedQuestionIds.length === 0) {
      setErrorMessage('Tidak ada butir soal yang dipilih.');
      return;
    }

    try {
      addQuestionsToPacket(selectedExistingPacketId, selectedQuestionIds);
      const target = packets.find((p) => p.id === selectedExistingPacketId);
      setSuccessMessage(`Berhasil menambahkan ${selectedQuestionIds.length} butir soal ke paket "${target?.title || ''}".`);
      if (onClearSelection) onClearSelection();
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('manage');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(`Gagal menambahkan ke paket: ${err?.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pengelompokan Paket Soal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola paket naskah ujian, asesmen, atau try out dari soal terpilih ({selectedQuestionIds.length} butir dipilih)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Paket Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('append')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'append'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gabungkan ke Paket ({packets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Daftar Paket ({packets.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* TAB 1: Create New Packet */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreatePacket} className="space-y-4">
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 flex items-center justify-between">
                <span className="text-blue-900 dark:text-blue-200 font-medium">
                  Soal yang akan dikelompokkan:
                </span>
                <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full text-[11px]">
                  {selectedQuestionIds.length} Butir Soal Terpilih
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Kode Paket <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={packetCode}
                    onChange={(e) => setPacketCode(e.target.value)}
                    placeholder="Contoh: PKT-BIN-2025-01"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Mata Pelajaran / Subtes
                  </label>
                  <select
                    value={packetSubtest}
                    onChange={(e) => setPacketSubtest(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Matematika">Matematika</option>
                    <option value="IPAS">IPAS</option>
                    <option value="Umum / Campuran">Umum / Campuran</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Judul / Nama Paket Soal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={packetTitle}
                  onChange={(e) => setPacketTitle(e.target.value)}
                  placeholder="Contoh: Asesmen Sumatif Akhir Semester Genap Bahasa Indonesia"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Kelas
                  </label>
                  <input
                    type="text"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    placeholder="Kelas 7 / 8 / 9"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2024/2025"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Status Paket
                  </label>
                  <select
                    value={packetStatus}
                    onChange={(e) => setPacketStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="aktif">Aktif (Siap Ujian)</option>
                    <option value="draft">Draf Penyusunan</option>
                    <option value="arsip">Diarsipkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Deskripsi / Petunjuk Pengerjaan
                </label>
                <textarea
                  rows={2}
                  value={packetDescription}
                  onChange={(e) => setPacketDescription(e.target.value)}
                  placeholder="Catatan tambahan petunjuk waktu pengerjaan atau kisi-kisi naskah..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedQuestionIds.length === 0}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Paket Soal</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Append to Existing */}
          {activeTab === 'append' && (
            <form onSubmit={handleAppendToExisting} className="space-y-4">
              {packets.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-400">Belum ada paket soal yang dibuat sebelumnya.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    + Buat Paket Baru Pertama
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 flex items-center justify-between">
                    <span className="text-blue-900 dark:text-blue-200 font-medium">
                      Menambahkan butir soal terpilih:
                    </span>
                    <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full text-[11px]">
                      {selectedQuestionIds.length} Butir Soal Terpilih
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Pilih Paket Soal Tujuan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedExistingPacketId}
                      onChange={(e) => setSelectedExistingPacketId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Pilih Paket Soal --</option>
                      {packets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.title} ({p.totalQuestions} Soal | {p.subtest})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedExistingPacketId || selectedQuestionIds.length === 0}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Tambahkan ke Paket</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* TAB 3: Manage All Packets */}
          {activeTab === 'manage' && (
            <div className="space-y-3">
              {packets.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-400">Belum ada paket soal yang terdaftar.</p>
                </div>
              ) : (
                packets.map((pkt) => (
                  <div
                    key={pkt.id}
                    className="p-4 bg-slate-50/70 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {pkt.code}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                            pkt.status === 'aktif'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : pkt.status === 'arsip'
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {pkt.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {pkt.subtest}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        {pkt.title}
                      </h4>
                      {pkt.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {pkt.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>📦 {pkt.totalQuestions} Butir Soal</span>
                        {pkt.targetClass && <span>🎓 {pkt.targetClass}</span>}
                        {pkt.academicYear && <span>📅 TA: {pkt.academicYear}</span>}
                        <span>👤 {pkt.createdByName}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus paket soal "${pkt.title}"?`)) {
                              deletePacket(pkt.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Hapus Paket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
