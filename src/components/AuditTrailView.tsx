import React, { useState, useMemo } from 'react';
import {
  FileText,
  Filter,
  Download,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RotateCcw,
  UserCheck,
  Search,
  SlidersHorizontal,
  Undo2,
  AlertTriangle,
  History,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, setSelectedQuestionId, currentUser, setActiveTab, rollbackAuditLog } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [rollbackCandidate, setRollbackCandidate] = useState<AuditLog | null>(null);
  const [isRollbacking, setIsRollbacking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedAction !== 'all' && log.action !== selectedAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.userName.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          (log.questionCode && log.questionCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, selectedAction, searchQuery]);

  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-md mx-auto">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Halaman Audit & Log Aktivitas hanya dapat diakses oleh Administrator.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleExportLogs = () => {
    const headers = ['ID', 'Waktu', 'Pengguna', 'Peran', 'Aksi', 'Kode Soal', 'Deskripsi', 'Status Rollback'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.questionCode || '-'}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.rolledBack ? `Di-rollback oleh ${l.rolledBackBy || 'Admin'}` : 'Aktif'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_tkad_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteRollback = async () => {
    if (!rollbackCandidate) return;
    setIsRollbacking(true);
    try {
      const res = await rollbackAuditLog(rollbackCandidate.id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Gagal rollback: ${err?.message || err}` });
    } finally {
      setIsRollbacking(false);
      setRollbackCandidate(null);
    }
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'APPROVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">APPROVE</span>;
      case 'REJECT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">REJECT</span>;
      case 'REQUEST_CHANGES':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">REQUEST CHANGES</span>;
      case 'SUBMIT_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">SUBMIT REVIEW</span>;
      case 'CREATE_QUESTION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">CREATE QUESTION</span>;
      case 'UPDATE_QUESTION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">UPDATE QUESTION</span>;
      case 'CREATE_USER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">CREATE USER</span>;
      case 'UPDATE_USER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">UPDATE USER</span>;
      case 'DELETE_USER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">DELETE USER</span>;
      case 'CREATE_PACKET':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">CREATE PACKET</span>;
      case 'UPDATE_PACKET':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">UPDATE PACKET</span>;
      case 'DELETE_PACKET':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">DELETE PACKET</span>;
      case 'RESTORE_DATABASE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">RESTORE DB</span>;
      case 'ROLLBACK':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">ROLLBACK</span>;
      case 'RECALL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">RECALL</span>;
      case 'DUPLICATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">DUPLICATE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{action}</span>;
    }
  };

  const isRollbackable = (log: AuditLog) => {
    if (log.rolledBack) return false;
    if (log.action === 'LOGIN' || log.action === 'LOGOUT' || log.action === 'ROLLBACK') return false;
    return true;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Audit Trail, Log Aktivitas & Rollback
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan riwayat setiap tindakan pengguna, perubahan status, modifikasi data, serta fasilitas Rollback instan untuk mengembalikan perubahan.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Ekspor Log Audit (CSV)</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama pengguna, kode soal, atau deskripsi aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800"
          />
        </div>

        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800"
          >
            <option value="all">Semua Jenis Aksi</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE_QUESTION">CREATE QUESTION</option>
            <option value="UPDATE_QUESTION">UPDATE QUESTION</option>
            <option value="SUBMIT_REVIEW">SUBMIT REVIEW</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="REQUEST_CHANGES">REQUEST CHANGES</option>
            <option value="CREATE_USER">CREATE USER</option>
            <option value="UPDATE_USER">UPDATE USER</option>
            <option value="DELETE_USER">DELETE USER</option>
            <option value="CREATE_PACKET">CREATE PACKET</option>
            <option value="UPDATE_PACKET">UPDATE PACKET</option>
            <option value="DELETE_PACKET">DELETE PACKET</option>
            <option value="RESTORE_DATABASE">RESTORE DATABASE</option>
            <option value="RECALL">RECALL</option>
            <option value="DUPLICATE">DUPLICATE</option>
            <option value="CONFIG_CHANGE">CONFIG CHANGE</option>
            <option value="ROLLBACK">ROLLBACK</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Waktu & Tanggal</th>
                <th className="px-4 py-3">Pengguna & Peran</th>
                <th className="px-4 py-3">Tindakan</th>
                <th className="px-4 py-3">Soal Terkait</th>
                <th className="px-4 py-3">Deskripsi Perubahan</th>
                <th className="px-4 py-3">Detail Perubahan</th>
                <th className="px-4 py-3 text-right">Opsi Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => {
                const canRollback = isRollbackable(log);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>{new Date(log.timestamp).toLocaleTimeString('id-ID')}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(log.timestamp).toLocaleDateString('id-ID')}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{log.userRole}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.questionCode ? (
                        <button
                          onClick={() => log.questionId && setSelectedQuestionId(log.questionId)}
                          className="font-mono text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                        >
                          {log.questionCode}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div>{log.description}</div>
                      {log.rolledBack && (
                        <div className="inline-flex items-center space-x-1 mt-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          <History className="w-3 h-3" />
                          <span>Telah Di-Rollback ({log.rolledBackBy || 'Admin'})</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                      {log.details ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                          <span className="text-slate-400">{log.details.field}: </span>
                          <span className="text-rose-600 dark:text-rose-400 line-through mr-1">{String(log.details.oldValue)}</span>
                          <span className="text-slate-400">&rarr; </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{String(log.details.newValue)}</span>
                        </div>
                      ) : log.snapshot ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono">
                          Snapshot: {log.snapshot.targetType}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {log.rolledBack ? (
                        <span className="text-[10px] text-slate-400 font-medium italic">Selesai</span>
                      ) : canRollback ? (
                        <button
                          onClick={() => setRollbackCandidate(log)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold inline-flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Rollback</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Rollback */}
      {rollbackCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Konfirmasi Rollback Tindakan
                </h3>
              </div>
              <button
                onClick={() => setRollbackCandidate(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Apakah Anda yakin ingin melakukan <strong>Rollback</strong> untuk sesi/tindakan berikut?
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-[11px]">
                <div><span className="text-slate-400">Tindakan:</span> <strong className="text-slate-800 dark:text-slate-200">{rollbackCandidate.action}</strong></div>
                <div><span className="text-slate-400">Pengguna:</span> {rollbackCandidate.userName} ({rollbackCandidate.userRole})</div>
                <div><span className="text-slate-400">Waktu:</span> {new Date(rollbackCandidate.timestamp).toLocaleString('id-ID')}</div>
                <div><span className="text-slate-400">Deskripsi:</span> {rollbackCandidate.description}</div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-[11px]">
                <strong>Catatan Sistem:</strong> Sistem akan mengembalikan data atau status terkait ke kondisi sebelum tindakan ini dieksekusi, dan mencatat aktivitas rollback ke dalam audit trail.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRollbackCandidate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRollback}
                disabled={isRollbacking}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isRollbacking ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Rollback...</span>
                  </>
                ) : (
                  <>
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi & Rollback</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

