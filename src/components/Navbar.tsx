import React, { useState } from 'react';
import {
  FileText,
  UserCheck,
  ShieldAlert,
  Bell,
  CheckCircle2,
  Database,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  Users,
  Sliders,
  Sparkles,
  Plus,
  PanelLeft,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppTab } from '../types';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    activeTab,
    setActiveTab,
    getAllowedTabs,
    lastGasSyncTime,
    spreadsheetId,
    autoSyncEnabled,
    setSelectedQuestionId,
    questions,
    theme,
    toggleTheme,
    toggleMobileSidebar,
    setShowChangePasswordModal,
    setIsPasswordChangeForced,
  } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingReviewCount = questions.filter((q) => q.status === 'menunggu_review').length;
  const allowedTabs = getAllowedTabs(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            {/* Mobile & Tablet Left Menu Toggle Button */}
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Buka / Tutup Daftar Menu"
              aria-label="Toggle Menu Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">
                    TKAD Adiwerna
                  </span>
                  <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    GAS Engine
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bahasa Indonesia • Matematika • IPAS
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-amber-400 shadow-2xs transition cursor-pointer"
              title={`Beralih ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Google Sheets Sync Pill (Admin role only) */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('gas_sync')}
                className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition text-xs font-medium text-emerald-800 dark:text-emerald-300 cursor-pointer"
                title={`Basis data default: Spreadsheet ID ${spreadsheetId} (Otomatis Sinkron Aktif)`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Auto-Sync Sheets</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {lastGasSyncTime && (
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">({lastGasSyncTime})</span>
                )}
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs transition cursor-pointer"
                aria-label="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-3 z-50 animate-in fade-in">
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Notifikasi Alur Kerja</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} belum dibaca</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">Belum ada notifikasi</div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            if (notif.questionId) {
                              setSelectedQuestionId(notif.questionId);
                            }
                            setShowNotifs(false);
                          }}
                          className={`p-3 text-xs cursor-pointer transition flex items-start space-x-3 ${
                            notif.read
                              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              : 'bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/60'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {notif.type === 'warning' && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                            {notif.type === 'info' && <Bell className="w-4 h-4 text-blue-500" />}
                            {notif.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white truncate">{notif.title}</p>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 line-clamp-2">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.timestamp).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        currentUser.role === 'pembuat'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : currentUser.role === 'reviewer'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          currentUser.role === 'pembuat'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : currentUser.role === 'reviewer'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{currentUser.department}</p>
                  </div>

                  {/* User Profile Actions */}
                  <div className="px-3 pt-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setIsPasswordChangeForced(false);
                        setShowChangePasswordModal(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-blue-500" />
                      <span>Ganti Kata Sandi</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition flex items-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROLE-BASED NAVIGATION TABS (Visible on desktop, handled by left sidebar on mobile/tablet) */}
        <div className="hidden lg:flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium no-scrollbar">
          {/* Dashboard (All roles) */}
          {allowedTabs.includes('dashboard') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Dashboard
            </button>
          )}

          {/* Antrian Review (Shown for Reviewer and Admin) */}
          {allowedTabs.includes('antrian_review') && (
            <button
              onClick={() => setActiveTab('antrian_review')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'antrian_review'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Antrian Review</span>
              {pendingReviewCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'antrian_review'
                      ? 'bg-white text-blue-700'
                      : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  {pendingReviewCount}
                </span>
              )}
            </button>
          )}

          {/* Bank Soal (All roles) */}
          {allowedTabs.includes('bank_soal') && (
            <button
              onClick={() => setActiveTab('bank_soal')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'bank_soal'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Bank Soal & Pencarian
            </button>
          )}

          {/* Buat Soal Baru (Pembuat & Admin) */}
          {allowedTabs.includes('buat_soal') && (
            <button
              onClick={() => setActiveTab('buat_soal')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'buat_soal'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Soal Baru</span>
            </button>
          )}

          {/* Audit Log (Admin role only!) */}
          {allowedTabs.includes('audit_log') && currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('audit_log')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'audit_log'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Audit & Log Aktivitas
            </button>
          )}

          {/* Manajemen Pengguna (Admin role only!) */}
          {allowedTabs.includes('manajemen_pengguna') && (
            <button
              onClick={() => setActiveTab('manajemen_pengguna')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'manajemen_pengguna'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manajemen Pengguna</span>
            </button>
          )}

          {/* Pengaturan Kategori (Admin only) */}
          {allowedTabs.includes('pengaturan') && (
            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Kategori & Alur Kerja</span>
            </button>
          )}

          {/* Google Sheets & GAS (Admin only) */}
          {allowedTabs.includes('gas_sync') && (
            <button
              onClick={() => setActiveTab('gas_sync')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'gas_sync'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Google Sheets & GAS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
