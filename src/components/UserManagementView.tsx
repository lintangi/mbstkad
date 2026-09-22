import React, { useState, useRef } from 'react';
import {
  Users,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Building,
  Key,
  X,
  RefreshCw,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck,
  Info,
  AlertTriangle,
  Database,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  downloadUserExcelTemplate,
  exportUsersToExcel,
  parseUserExcelFile,
  ParsedUserRow,
} from '../utils/excelUserUtils';

export const UserManagementView: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    importUsers,
    currentUser,
    syncWithGoogleSheets,
    dualSyncDatabases,
    isSyncing,
    lastGasSyncTime,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all');

  // Modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDualSyncing, setIsDualSyncing] = useState(false);

  // Form states for Single Add / Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('pembuat');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPassword, setFormPassword] = useState('password123');
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');

  // Excel Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('pembuat');
    setFormDepartment('Bahasa Indonesia');
    setFormPassword('password123');
    setFormStatus('aktif');
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDepartment(user.department || '');
    setFormPassword(user.password || 'password123');
    setFormStatus(user.status || 'aktif');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    // Check email uniqueness
    if (users.some((u) => u.email.toLowerCase() === formEmail.trim().toLowerCase())) {
      setFeedbackMsg({ type: 'error', text: `Email ${formEmail} sudah digunakan oleh pengguna lain.` });
      return;
    }

    addUser({
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      department: formDepartment.trim() || 'Unit Akademik TKAD Adiwerna',
      password: formPassword.trim() || 'password123',
      status: formStatus,
    });

    setIsAddModalOpen(false);
    setFeedbackMsg({ type: 'success', text: `Pengguna baru "${formName}" berhasil ditambahkan.` });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formName.trim() || !formEmail.trim()) return;

    updateUser(editingUser.id, {
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      department: formDepartment.trim() || 'Unit Akademik TKAD Adiwerna',
      password: formPassword.trim() || 'password123',
      status: formStatus,
    });

    setEditingUser(null);
    setFeedbackMsg({ type: 'success', text: `Data profil ${formName} berhasil diperbarui.` });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}" (${user.email})? Tindakan ini akan menghapus akun dari roster.`)) {
      deleteUser(user.id);
      setFeedbackMsg({ type: 'success', text: `Pengguna "${user.name}" berhasil dihapus.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Handle Excel File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setParseErrors([]);
    setParsedRows([]);

    try {
      const result = await parseUserExcelFile(file);
      setParsedRows(result.validUsers);
      setParseErrors(result.errors);
    } catch (err: any) {
      setParseErrors([err.message || 'Gagal memproses file Excel.']);
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) {
      alert('Tidak ada baris data pengguna valid yang dapat diimpor.');
      return;
    }

    const modeText = importMode === 'replace' ? 'menimpa seluruh daftar pengguna yang ada' : 'menambahkan ke daftar pengguna yang ada';
    if (
      window.confirm(
        `Konfirmasi Impor:\nAnda akan mengimpor ${parsedRows.length} pengguna dengan mode ${modeText}. Lanjutkan?`
      )
    ) {
      const newUsersPayload = parsedRows.map((row) => ({
        name: row.name,
        email: row.email,
        role: row.role,
        department: row.department,
        password: row.password || 'password123',
        status: row.status,
      }));

      importUsers(newUsersPayload, importMode);
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedRows([]);
      setParseErrors([]);
      setFeedbackMsg({
        type: 'success',
        text: `Berhasil mengimpor ${parsedRows.length} akun pengguna (${importMode === 'replace' ? 'Mode Timpa' : 'Mode Tambah'}).`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleTriggerDualSync = async () => {
    setIsDualSyncing(true);
    try {
      const result = await dualSyncDatabases();
      if (result.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Sinkronisasi Database Ganda Berhasil: ${result.message}`,
        });
      } else {
        setFeedbackMsg({
          type: 'error',
          text: `Sinkronisasi Database Ganda: ${result.message}`,
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Gagal sinkronisasi: ${err.message}`,
      });
    } finally {
      setIsDualSyncing(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && (u.status || 'aktif') !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchDept = (u.department || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchDept;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Manajemen Pengguna (User Management)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola penambahan, penghapusan, impor/ekspor Excel, dan sinkronisasi basis data ganda (Firebase & Google Sheets).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dual Sync Button */}
          <button
            onClick={handleTriggerDualSync}
            disabled={isDualSyncing || isSyncing}
            className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Sinkronkan data pengguna dan seluruh sistem ke Firebase Firestore & Google Spreadsheet"
          >
            <Database className={`w-3.5 h-3.5 ${isDualSyncing ? 'animate-spin' : ''}`} />
            <span>{isDualSyncing ? 'Sinkron Ganda...' : 'Sinkron Database Ganda'}</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={() => exportUsersToExcel(users)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Ekspor daftar pengguna saat ini ke file Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>

          {/* Import from Excel */}
          <button
            onClick={() => {
              setImportFile(null);
              setParsedRows([]);
              setParseErrors([]);
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Impor pengguna dalam jumlah banyak menggunakan file template Excel"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Impor Excel</span>
          </button>

          {/* Add Single User */}
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Quick Action Info Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center space-x-2.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Unduh format resmi template Excel untuk menambahkan atau memperbarui tenaga pendidik secara massal.
          </span>
        </div>
        <button
          onClick={downloadUserExcelTemplate}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/80 transition flex items-center space-x-1.5 cursor-pointer shrink-0 text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh Template Excel (.xlsx)</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between transition animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, departemen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Semua Peran (Role)</option>
            <option value="pembuat">Pembuat Soal</option>
            <option value="reviewer">Reviewer Mutu</option>
            <option value="admin">Administrator</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Departemen / Mapel</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Kata Sandi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada data pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser.id === user.id;
                  const isDefaultPass = user.isDefaultPassword === true || user.password === 'password123';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                            {user.avatar || user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                              {isCurrent && (
                                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-blue-200 dark:border-blue-700/60">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${
                            user.role === 'pembuat'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : user.role === 'reviewer'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          {user.role === 'pembuat' ? 'Pembuat Soal' : user.role === 'reviewer' ? 'Reviewer Mutu' : 'Administrator'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {user.department || '-'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            (user.status || 'aktif') === 'aktif'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              (user.status || 'aktif') === 'aktif' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span className="capitalize">{user.status || 'aktif'}</span>
                        </span>
                      </td>

                      {/* Password Security Status */}
                      <td className="py-3.5 px-4">
                        {isDefaultPass ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Akun masih menggunakan kata sandi default.">
                            <Key className="w-3 h-3 text-amber-500" />
                            <span>Default</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Kata sandi telah diperbarui oleh pengguna">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span>Kustom</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition inline-flex items-center space-x-1 text-[11px] font-semibold cursor-pointer"
                          title="Lihat / Edit Profil Pengguna"
                        >
                          <Edit2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Edit</span>
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition inline-flex items-center text-[11px] cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Total {users.length} akun pengguna terdaftar</span>
          </div>
          <span className="font-semibold text-purple-700 dark:text-purple-400">
            Database Ganda: Firebase Firestore & Google Sheets
          </span>
        </div>
      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Tambah Pengguna Baru</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Daftarkan akun pendidik / staf baru ke sistem</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. Wahyu Hidayat, M.Pd."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: wahyuhidayat@tkad.adiwerna"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Peran (Role) *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="pembuat">Pembuat Soal</option>
                    <option value="reviewer">Reviewer Mutu</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Akun</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departemen / Mata Pelajaran</label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="misal: Bahasa Indonesia, Matematika, IPAS"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Awal</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm cursor-pointer"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Profil Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Profil Pengguna</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Perbarui informasi departemen, peran, dan kata sandi</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Alamat Email *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Peran (Role) *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="pembuat">Pembuat Soal</option>
                    <option value="reviewer">Reviewer Mutu</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Akun</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departemen / Mata Pelajaran</label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="misal: Bahasa Indonesia, Matematika, IPAS"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Impor Pengguna Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Impor Pengguna dari Excel</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unggah file spreadsheet .xlsx atau .csv sesuai format template resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Upload Box */}
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
              >
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {importFile ? importFile.name : 'Klik untuk memilih file Excel (.xlsx / .csv)'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {importFile
                      ? `Ukuran: ${(importFile.size / 1024).toFixed(1)} KB`
                      : 'Pastikan menggunakan template resmi agar kolom terbaca dengan tepat'}
                  </p>
                </div>
              </div>

              {/* Template Download Link */}
              <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Belum memiliki format template Excel?</span>
                <button
                  type="button"
                  onClick={downloadUserExcelTemplate}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template Di Sini</span>
                </button>
              </div>

              {/* Import Mode: Append or Replace */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mode Penggabungan Data:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 cursor-pointer transition ${
                      importMode === 'append'
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold block">Tambahkan (Append)</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Tambahkan akun baru ke daftar yang sudah ada tanpa menghapus data lama.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold block text-rose-700 dark:text-rose-300">Timpa Roster (Replace)</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Ganti seluruh daftar pengguna dengan data baru dari file Excel ini.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Parsing Warnings / Errors */}
              {parseErrors.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1 text-[11px] text-amber-800 dark:text-amber-200">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Catatan Validasi File ({parseErrors.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                    {parseErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Pratinjau Data Valid ({parsedRows.length} Pengguna):</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Siap Diimpor</span>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider text-[9px] font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Peran</th>
                          <th className="p-2">Departemen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 font-medium text-slate-900 dark:text-white">{row.name}</td>
                            <td className="p-2 text-slate-500 dark:text-slate-400">{row.email}</td>
                            <td className="p-2 capitalize">{row.role}</td>
                            <td className="p-2">{row.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || isParsing}
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Impor {parsedRows.length} Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
