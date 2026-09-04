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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, setSelectedQuestionId, currentUser, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

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
    const headers = ['ID', 'Waktu', 'Pengguna', 'Peran', 'Aksi', 'Kode Soal', 'Deskripsi'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.questionCode || '-'}"`,
      `"${l.description.replace(/"/g, '""')}"`,
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">CREATE</span>;
      case 'UPDATE_QUESTION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">UPDATE</span>;
      case 'RECALL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">RECALL</span>;
      case 'DUPLICATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">DUPLICATE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{action}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Trail & Log Aktivitas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan riwayat setiap tindakan pengguna, perubahan status, dan modifikasi data bank soal TKAD-Adiwerna.
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
            <option value="RECALL">RECALL</option>
            <option value="DUPLICATE">DUPLICATE</option>
            <option value="CONFIG_CHANGE">CONFIG CHANGE</option>
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
                <th className="px-4 py-3">Detail Nilai Lama/Baru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
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
                    {log.description}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                    {log.details ? (
                      <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                        <span className="text-slate-400">{log.details.field}: </span>
                        <span className="text-rose-600 dark:text-rose-400 line-through mr-1">{log.details.oldValue}</span>
                        <span className="text-slate-400">&rarr; </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{log.details.newValue}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
