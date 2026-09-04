import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  PlusCircle,
  ShieldAlert,
  Users,
  Sliders,
  Database,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppTab } from '../types';

interface SidebarItem {
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
  highlight?: boolean;
}

export const MobileTabletSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    getAllowedTabs,
    questions,
    isSidebarMinimized,
    toggleSidebarMinimized,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useApp();

  const allowedTabs = getAllowedTabs(currentUser.role);
  const pendingReviewCount = questions.filter((q) => q.status === 'menunggu_review').length;

  const menuItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'antrian_review',
      label: 'Antrian Review',
      shortLabel: 'Review',
      icon: UserCheck,
      badge: pendingReviewCount,
    },
    {
      id: 'bank_soal',
      label: 'Bank Soal',
      shortLabel: 'Soal',
      icon: FileText,
      badge: questions.length > 0 ? questions.length : undefined,
    },
    {
      id: 'buat_soal',
      label: 'Buat Soal Baru',
      shortLabel: 'Baru',
      icon: PlusCircle,
    },
    {
      id: 'audit_log',
      label: 'Audit & Log Aktivitas',
      shortLabel: 'Audit',
      icon: ShieldAlert,
    },
    {
      id: 'manajemen_pengguna',
      label: 'Manajemen Pengguna',
      shortLabel: 'User',
      icon: Users,
      highlight: true,
    },
    {
      id: 'pengaturan',
      label: 'Kategori & Alur Kerja',
      shortLabel: 'Setting',
      icon: Sliders,
    },
    {
      id: 'gas_sync',
      label: 'Basis Data JSON & SQL',
      shortLabel: 'DB SQL',
      icon: Database,
    },
  ];

  const visibleItems = menuItems.filter((item) => allowedTabs.includes(item.id));

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    // On small phones, close overlay on selection
    if (window.innerWidth < 640) {
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop for small screens (<640px) when sidebar is opened */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs sm:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar for Mobile & Tablet (lg:hidden) */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 lg:hidden flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shadow-lg sm:shadow-none ${
          // Small screen behavior (<640px)
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        } ${
          // Width behavior based on minimized state
          isSidebarMinimized ? 'w-16' : 'w-60'
        }`}
      >
        {/* Sidebar Header with Title & Close on Phone */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800/80">
          {!isSidebarMinimized ? (
            <div className="flex items-center space-x-2 overflow-hidden px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                Daftar Menu
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {currentUser.role}
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                Menu
              </span>
            </div>
          )}

          {/* Close button on small phones */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={item.label}
                className={`w-full flex items-center rounded-xl transition-all duration-150 cursor-pointer group relative ${
                  isSidebarMinimized ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5 text-left'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                    : item.highlight
                    ? 'text-purple-700 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon
                  className={`shrink-0 transition-transform ${
                    isSidebarMinimized ? 'w-5 h-5' : 'w-4 h-4'
                  } ${isActive ? 'text-white' : ''}`}
                />

                {/* Expanded Label */}
                {!isSidebarMinimized && (
                  <span className="text-xs font-medium truncate flex-1 leading-snug">
                    {item.label}
                  </span>
                )}

                {/* Badges */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full font-bold flex items-center justify-center shrink-0 ${
                      isSidebarMinimized
                        ? 'absolute top-1 right-1 w-4 h-4 text-[9px] ' +
                          (isActive
                            ? 'bg-white text-blue-700'
                            : 'bg-amber-500 text-white')
                        : `text-[10px] px-1.5 py-0.5 ${
                            isActive
                              ? 'bg-white text-blue-700'
                              : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                          }`
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on hover in Minimized Mode */}
                {isSidebarMinimized && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Minimize / Expand Footer Control */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <button
            onClick={toggleSidebarMinimized}
            className={`w-full flex items-center rounded-xl p-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer ${
              isSidebarMinimized ? 'justify-center' : 'justify-between px-3'
            }`}
            title={isSidebarMinimized ? 'Perbesar Menu (Expand)' : 'Perkecil Menu (Minimize)'}
          >
            {!isSidebarMinimized && (
              <span className="text-xs font-medium truncate">Perkecil Menu</span>
            )}
            {isSidebarMinimized ? (
              <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
