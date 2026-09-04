import React, { useState } from 'react';
import {
  Users,
  Layers,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Edit,
  Save,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryMetadata } from '../types';

export const AdminSettingsView: React.FC = () => {
  const { categories, addCategory, updateCategory, users, setActiveTab } = useApp();

  const [newSubtestName, setNewSubtestName] = useState('');
  const [newSubtestDesc, setNewSubtestDesc] = useState('');
  const [newSubtestTopics, setNewSubtestTopics] = useState('');
  const [showAddSubtest, setShowAddSubtest] = useState(false);

  // Workflow settings state
  const [requireReviewerApproval, setRequireReviewerApproval] = useState(true);
  const [allowAuthorRecall, setAllowAuthorRecall] = useState(true);
  const [autoBumpVersion, setAutoBumpVersion] = useState(true);

  const handleCreateSubtest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtestName.trim()) return;

    const topicsArray = newSubtestTopics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newCat: CategoryMetadata = {
      id: `cat-${Date.now()}`,
      name: newSubtestName.trim(),
      description: newSubtestDesc.trim() || 'Subtes penilaian kompetensi akademik.',
      topics: topicsArray.length > 0 ? topicsArray : ['Umum'],
    };

    addCategory(newCat);
    setNewSubtestName('');
    setNewSubtestDesc('');
    setNewSubtestTopics('');
    setShowAddSubtest(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pengaturan Kategori & Alur Kerja
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola taksonomi mata uji (Bahasa Indonesia, Matematika, IPAS) serta parameter alur penjaminan mutu.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('manajemen_pengguna')}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Users className="w-4 h-4" />
          <span>Buka Manajemen Pengguna</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Subtest / Kategori Master */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Struktur Mata Uji & Topik TKAD-Adiwerna</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mata pelajaran kompetensi utama yang diujikan</p>
              </div>

              <button
                onClick={() => setShowAddSubtest(!showAddSubtest)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddSubtest ? 'Batal' : 'Tambah Mata Uji'}</span>
              </button>
            </div>

            {/* Add Subtest Form */}
            {showAddSubtest && (
              <form onSubmit={handleCreateSubtest} className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3 text-xs">
                <h4 className="font-bold text-blue-900 dark:text-blue-300">Form Tambah Mata Uji Baru</h4>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nama Mata Uji / Subtes</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Bahasa Inggris Terapan"
                    value={newSubtestName}
                    onChange={(e) => setNewSubtestName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deskripsi Kompetensi</label>
                  <input
                    type="text"
                    placeholder="Deskripsi singkat capaian uji..."
                    value={newSubtestDesc}
                    onChange={(e) => setNewSubtestDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Daftar Topik Saran (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    placeholder="Topik 1, Topik 2, Topik 3"
                    value={newSubtestTopics}
                    onChange={(e) => setNewSubtestTopics(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSubtest(false)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    Simpan Mata Uji
                  </button>
                </div>
              </form>
            )}

            {/* List of categories */}
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</span>
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full font-semibold border border-blue-200 dark:border-blue-800">
                      {cat.topics.length} Saran Topik
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{cat.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.topics.map((t, i) => (
                      <span
                        key={i}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick User Snapshot Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ringkasan Pengguna Aktif</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total {users.length} akun terdaftar di sistem</p>
              </div>
              <button
                onClick={() => setActiveTab('manajemen_pengguna')}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>Kelola Lengkap (CRUD)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.slice(0, 4).map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                      {u.avatar || u.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.email} • {u.department}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${
                      u.role === 'pembuat'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : u.role === 'reviewer'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Workflow & Quality Assurance Rules */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Konfigurasi Alur Kerja (Workflow)</h3>

            <div className="space-y-4 text-xs">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireReviewerApproval}
                  onChange={(e) => setRequireReviewerApproval(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Kunci Soal Sebelum Review</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Soal yang berstatus Menunggu Review terkunci dari pengeditan langsung oleh pembuat sampai ada keputusan review.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAuthorRecall}
                  onChange={(e) => setAllowAuthorRecall(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Izinkan Penarikan Draf (Recall)</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Pembuat soal diperbolehkan menarik kembali soal dari antrian review sebelum reviewer mulai memeriksa.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBumpVersion}
                  onChange={(e) => setAutoBumpVersion(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Otomatisasi Versioning</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Setiap revisi pada butir soal yang telah disetujui akan mengarsip versi lama dan membuat nomor versi baru (v1.0 &rarr; v2.0).
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                ✓ Kebijakan alur kerja ini terikat dengan aturan audit trail dan disinkronkan ke sheet konfigurasi database.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
