/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MobileTabletSidebar } from './components/MobileTabletSidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { QuestionBankView } from './components/QuestionBankView';
import { QuestionEditor } from './components/QuestionEditor';
import { ReviewQueueView } from './components/ReviewQueueView';
import { AuditTrailView } from './components/AuditTrailView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { UserManagementView } from './components/UserManagementView';
import { GoogleSheetsIntegrationModal } from './components/GoogleSheetsIntegrationModal';
import { QuestionDetailModal } from './components/QuestionDetailModal';
import { ReviewModal } from './components/ReviewModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';

const MainContent: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
    activeTab,
    selectedQuestionId,
    reviewingQuestionId,
    isSidebarMinimized,
    spreadsheetId,
  } = useApp();

  // If not logged in, render the dedicated Login View
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      {/* Responsive Mobile / Tablet Left Sidebar */}
      <MobileTabletSidebar />

      {/* Main Content Area: dynamically adjusted for tablet left sidebar docking */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarMinimized ? 'sm:pl-16 lg:pl-0' : 'sm:pl-60 lg:pl-0'
        }`}
      >
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'bank_soal' && <QuestionBankView />}
        {activeTab === 'buat_soal' && <QuestionEditor />}
        {activeTab === 'antrian_review' && <ReviewQueueView />}
        {activeTab === 'audit_log' && currentUser.role === 'admin' && <AuditTrailView />}
        {activeTab === 'manajemen_pengguna' && currentUser.role === 'admin' && <UserManagementView />}
        {activeTab === 'pengaturan' && currentUser.role === 'admin' && <AdminSettingsView />}
        {activeTab === 'gas_sync' && currentUser.role === 'admin' && <GoogleSheetsIntegrationModal />}
      </main>

      {/* Global Modals */}
      {selectedQuestionId && <QuestionDetailModal />}
      {reviewingQuestionId && <ReviewModal />}
      <ChangePasswordModal />

      {/* Footer */}
      <footer
        className={`border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto transition-all duration-300 ${
          isSidebarMinimized ? 'sm:pl-16 lg:pl-0' : 'sm:pl-60 lg:pl-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 Sistem Manajemen Bank Soal TKAD Adiwerna • Berbasis Web & Google Apps Script Engine</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5" title={`Spreadsheet ID: ${spreadsheetId}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Spreadsheet ({spreadsheetId ? spreadsheetId.slice(0, 10) + '...' : 'Default'}) • Auto-Sync</span>
            </span>
            <span>Versi 2.4-GAS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
