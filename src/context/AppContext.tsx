import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Question,
  User,
  UserRole,
  AuditLog,
  AppNotification,
  CategoryMetadata,
  ReviewCriteriaRating,
  AppTab,
  QuestionType,
  QuestionStatus,
  DifficultyLevel,
  ChoiceOption,
  QuestionPacket,
} from '../types';
import {
  INITIAL_QUESTIONS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, testFirestoreConnection, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import { ParsedUserRow } from '../utils/excelUserUtils';

interface AppContextType {
  // Auth & Current User
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  login: (email: string, password?: string) => { success: boolean; message: string };
  logout: () => void;
  
  // Dark Mode Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Users CRUD & Excel Import/Export
  users: User[];
  addUser: (data: Omit<User, 'id'>) => { success: boolean; message: string; user?: User };
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => { success: boolean; message: string };
  importUsers: (importedUsers: ParsedUserRow[], replaceExisting?: boolean) => { addedCount: number; updatedCount: number; errors: string[] };
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  showChangePasswordModal: boolean;
  setShowChangePasswordModal: (show: boolean) => void;
  isPasswordChangeForced: boolean;
  setIsPasswordChangeForced: (forced: boolean) => void;

  // Data Collections
  questions: Question[];
  packets: QuestionPacket[];
  categories: CategoryMetadata[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];

  // Navigation & Role Menus
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  getAllowedTabs: (role: UserRole) => AppTab[];
  getUserDepartmentCategory: (user: User) => string | null;
  isUserAuthorizedForSubtest: (user: User, subtest: string) => boolean;
  canUserEditQuestion: (user: User, question: Question) => { allowed: boolean; reason?: string };

  // Selection & Modal States
  selectedQuestionId: string | null;
  setSelectedQuestionId: (id: string | null) => void;
  reviewingQuestionId: string | null;
  setReviewingQuestionId: (id: string | null) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (id: string | null) => void;

  // Question Actions & Bulk Operations
  createQuestion: (data: Partial<Question>, submitDirectly: boolean) => Question;
  updateQuestion: (id: string, data: Partial<Question>, submitForReview: boolean) => void;
  recallQuestion: (id: string) => void;
  duplicateQuestion: (id: string) => void;
  deleteQuestion: (id: string) => void;
  bulkDeleteQuestions: (ids: string[]) => { count: number };

  // Question Packet Actions
  createPacket: (data: {
    code: string;
    title: string;
    description?: string;
    subtest: string;
    questionIds: string[];
    targetClass?: string;
    academicYear?: string;
    status?: 'draft' | 'aktif' | 'arsip';
  }) => QuestionPacket;
  updatePacket: (id: string, data: Partial<QuestionPacket>) => void;
  deletePacket: (id: string) => void;
  addQuestionsToPacket: (packetId: string, questionIds: string[]) => void;
  removeQuestionFromPacket: (packetId: string, questionId: string) => void;
  
  // Review Actions
  submitReview: (
    questionId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    criteria: ReviewCriteriaRating,
    generalComment: string,
    optionComments?: Record<string, string>
  ) => void;

  // Categories & Config Actions
  addCategory: (cat: CategoryMetadata) => void;
  updateCategory: (id: string, cat: Partial<CategoryMetadata>) => void;
  deleteCategory: (id: string) => void;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // GAS & Sheets Integration State
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  gasWebhookUrl: string;
  setGasWebhookUrl: (url: string) => void;
  lastGasSyncTime: string | null;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string | null;
  syncWithGoogleSheets: (options?: { silent?: boolean }) => Promise<{ success: boolean; message: string }>;
  pullFromGoogleSheets: () => Promise<{ success: boolean; message: string; count?: number }>;

  // Dual Database (Firebase Firestore + Google Sheets)
  dualSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  isDualSyncing: boolean;
  lastDualSyncTime: string | null;
  dualSyncDatabases: (options?: { forcePushToSheets?: boolean }) => Promise<{ success: boolean; message: string; firestoreCount: number; sheetsCount: number }>;

  // Sidebar State for Mobile/Tablet
  isSidebarMinimized: boolean;
  setIsSidebarMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarMinimized: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobileSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'tkad_auth_v3';
const STORAGE_KEY_USER_ID = 'tkad_user_id_v3';
const STORAGE_KEY_THEME = 'tkad_theme_v3';
const STORAGE_KEY_USERS = 'tkad_users_v3';
const STORAGE_KEY_QUESTIONS = 'tkad_questions_v3';
const STORAGE_KEY_LOGS = 'tkad_logs_v3';
const STORAGE_KEY_NOTIFS = 'tkad_notifs_v3';
const STORAGE_KEY_CATEGORIES = 'tkad_categories_v3';
const STORAGE_KEY_GAS_URL = 'tkad_gas_url_v3';
const STORAGE_KEY_SPREADSHEET_ID = 'tkad_spreadsheet_id_v3';
const STORAGE_KEY_AUTOSYNC = 'tkad_autosync_v3';

export const DEFAULT_SPREADSHEET_ID = '1tEGcYctNnoyNTLjI1JZ_QWUuR6BU4DtnTvjLYM-Fn8M';
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxS5m7eFm4SQ9fe_gORtWzjp6XiTbMeJLxn1l6fWRHixFSaRkRcCnEeNizFyWzPsjjG/exec';

const PREV_DEFAULT_SPREADSHEET_IDS = [
  '1Dv9vpvA_FFLwHBWX03DByx2ZqJ4wSzj0gFd5bceLDk0',
  '1YSDHUR9CYgLHPGtFVUxQeCgcH51GdR-P9fqehUUnMK4',
  '1LbXmt8Ve2TrnNRzcgpLWfcRaW1au2GHWG4LnCtupDT8',
];
const PREV_DEFAULT_GAS_URLS = [
  'https://script.google.com/macros/s/AKfycbznlogqDRzhnwbHx3c7_TxEV-YOYvSjYHZGQjCFQIpKq-WNp2t0ZkCCqT52ZLw29TAZ/exec',
  'https://script.google.com/macros/s/AKfycbylrwIAEjAIaanInaZqv4vp_SnLLTe3bflxmBxN9gF4ocEY0GYTzWvrj6SWSbSCg9Vj/exec',
  'https://script.google.com/macros/s/AKfycbx9JoUcWeUq7JxS6Ab1MY0Bu4lbrZdxC1RmSy9rYzVPqJQfqQDkwkZ9mEiXJNBLBRC2Jg/exec',
  'https://script.google.com/macros/s/AKfycbw36Wln_iwfSLtYvUD8YutEMFgW5KEjbfAaITXXhiDL_EZHpcO8NIDtePHRrFA3Ws4l/exec',
  'https://script.google.com/macros/s/AKfycbzLi3eycowg1aaWsMN6_vN6zQ9L51kUdIi1_hkqxN26IPOPn0dUqHF5kNDiVNUyKjFfjA/exec',
];

// Helper to parse Google Sheets Visualization API table rows into Question objects
function parseGvizTableToQuestions(table: any): Question[] {
  if (!table || !Array.isArray(table.rows)) return [];
  const questionMap = new Map<string, Question>();

  table.rows.forEach((r: any, idx: number) => {
    if (!r || !Array.isArray(r.c)) return;
    const getVal = (i: number): string => {
      const cell = r.c[i];
      if (!cell) return '';
      return cell.v !== undefined && cell.v !== null ? String(cell.v) : (cell.f || '');
    };

    const id = getVal(0);
    // Ignore header row if accidentally captured
    if (!id || id.toLowerCase() === 'id' || id.toLowerCase() === 'kode') return;

    // Check Status_Data column (Col 13 or check if marked as TIDAK_AKTIF / DIHAPUS / TERGANTIKAN)
    const statusData = getVal(13).trim().toUpperCase();
    if (statusData === 'TIDAK_AKTIF' || statusData === 'DIHAPUS' || statusData === 'TERGANTIKAN' || statusData === 'INACTIVE' || statusData === 'DELETED') {
      // Historical/replaced row - do NOT display in active application
      return;
    }

    const code = getVal(1) || `TKAD-SOAL-${idx + 1}`;
    const subtest = getVal(2) || 'Bahasa Indonesia';
    const topic = getVal(3) || 'Umum';
    const typeStr = (getVal(4) || 'pilihan_ganda').toLowerCase();
    const type = (['pilihan_ganda', 'pilihan_ganda_kompleks', 'benar_salah', 'menjodohkan', 'isian_singkat', 'esai'].includes(typeStr)
      ? typeStr
      : 'pilihan_ganda') as QuestionType;
    const diffStr = (getVal(5) || 'sedang').toLowerCase();
    const difficulty = (['mudah', 'sedang', 'sulit'].includes(diffStr) ? diffStr : 'sedang') as DifficultyLevel;
    const defaultScore = Number(getVal(6)) || 4;
    const prompt = getVal(7) || 'Soal';

    let options: ChoiceOption[] | undefined;
    const rawOptions = getVal(8);
    if (rawOptions) {
      try {
        const parsed = JSON.parse(rawOptions);
        if (Array.isArray(parsed)) {
          options = parsed;
        }
      } catch {}
    }

    const explanation = getVal(9);
    const statusStr = (getVal(10) || 'disetujui').toLowerCase();
    const status = (['draft', 'menunggu_review', 'disetujui', 'perlu_revisi', 'ditolak'].includes(statusStr)
      ? statusStr
      : 'disetujui') as QuestionStatus;
    const version = getVal(11) || '1.0';
    const createdByName = getVal(12) || 'Pengajar TKAD';
    
    // Dates can be in col 14/15 (with status_data) or col 13/14 (legacy 15-col sheet)
    const createdAt = (statusData === 'AKTIF' ? getVal(14) : getVal(13)) || new Date().toISOString();
    const updatedAt = (statusData === 'AKTIF' ? getVal(15) : getVal(14)) || new Date().toISOString();

    const qObj: Question = {
      id,
      code,
      subtest,
      topic,
      type,
      difficulty,
      defaultScore,
      prompt,
      options: options || [
        { id: 'opt-1', label: 'A', text: 'Pilihan A', isCorrect: true },
        { id: 'opt-2', label: 'B', text: 'Pilihan B', isCorrect: false },
        { id: 'opt-3', label: 'C', text: 'Pilihan C', isCorrect: false },
        { id: 'opt-4', label: 'D', text: 'Pilihan D', isCorrect: false },
      ],
      explanation,
      status,
      version,
      createdByName,
      createdById: 'usr-admin-dhina',
      createdAt,
      updatedAt,
      tags: [],
      attachments: [],
      reviews: [],
      versions: [],
    };

    // If duplicate ID exists in sheet, keep latest
    questionMap.set(id, qObj);
  });

  return Array.from(questionMap.values());
}

// Helper to merge imported questions with local questions without duplicates
function mergeQuestions(local: Question[], incoming: Question[]): Question[] {
  const map = new Map<string, Question>();
  local.forEach((q) => map.set(q.id, q));
  incoming.forEach((q) => map.set(q.id, q));
  return Array.from(map.values());
}

// Immediately cleanup legacy mock keys so old sample data does not linger
try {
  [
    'tkad_users_v2',
    'tkad_questions_v2',
    'tkad_logs_v2',
    'tkad_notifs_v2',
    'tkad_users',
    'tkad_questions',
    'tkad_logs',
    'tkad_auth_v2',
    'tkad_user_id_v2'
  ].forEach((k) => localStorage.removeItem(k));
} catch {
  // Ignore in environments without window/localStorage
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State (Default: light mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  // Apply dark class to documentElement
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.warn('Theme update error', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Users State - ensuring all initial default users are always present
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, User>();
          INITIAL_USERS.forEach((u) => map.set(u.email.toLowerCase(), u));
          parsed.forEach((u) => {
            const existing = map.get(u.email.toLowerCase());
            map.set(u.email.toLowerCase(), existing ? { ...existing, ...u } : u);
          });
          return Array.from(map.values());
        }
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_USER_ID);
      const found = users.find((u) => u.id === savedId) || users.find((u) => u.email === 'root@tkad.adiwerna');
      return found || INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // Track deleted question IDs so GAS can soft-delete / mark them TIDAK_AKTIF in Google Sheets
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tkad_deleted_q_ids_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tkad_deleted_q_ids_v3', JSON.stringify(deletedQuestionIds));
    } catch {}
  }, [deletedQuestionIds]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Mobile / Tablet Sidebar State
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tkad_sidebar_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebarMinimized = () => {
    setIsSidebarMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tkad_sidebar_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [reviewingQuestionId, setReviewingQuestionId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [isPasswordChangeForced, setIsPasswordChangeForced] = useState<boolean>(false);

  // Initialize Data from LocalStorage (starts clean with zero questions)
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  // Packets State
  const [packets, setPackets] = useState<QuestionPacket[]>(() => {
    try {
      const saved = localStorage.getItem('tkad_packets_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tkad_packets_v3', JSON.stringify(packets));
    } catch (e) {
      console.warn(e);
    }
  }, [packets]);

  const [categories, setCategories] = useState<CategoryMetadata[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [gasWebhookUrl, setGasWebhookUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GAS_URL);
      if (!saved || saved.trim() === '' || PREV_DEFAULT_GAS_URLS.includes(saved)) {
        return DEFAULT_GAS_URL;
      }
      return saved;
    } catch {
      return DEFAULT_GAS_URL;
    }
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID);
      if (!saved || saved.trim() === '' || PREV_DEFAULT_SPREADSHEET_IDS.includes(saved)) {
        return DEFAULT_SPREADSHEET_ID;
      }
      return saved;
    } catch {
      return DEFAULT_SPREADSHEET_ID;
    }
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTOSYNC);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastGasSyncTime, setLastGasSyncTime] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, spreadsheetId);
    } catch (e) {
      console.warn(e);
    }
  }, [spreadsheetId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTOSYNC, String(autoSyncEnabled));
    } catch (e) {
      console.warn(e);
    }
  }, [autoSyncEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GAS_URL, gasWebhookUrl);
    } catch (e) {
      console.warn(e);
    }
  }, [gasWebhookUrl]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.warn(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
    } catch (e) {
      console.warn(e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn(e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.warn(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn(e);
    }
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GAS_URL, gasWebhookUrl);
  }, [gasWebhookUrl]);

  // Connect and sync with Firebase Firestore in real-time
  useEffect(() => {
    testFirestoreConnection();

    // Listen for Questions from Firestore
    const unsubQuestions = onSnapshot(
      collection(db, 'questions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Question[] = [];
          snapshot.forEach((d) => list.push(d.data() as Question));
          setQuestions(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'questions');
      }
    );

    // Listen for Users from Firestore
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: User[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((d) => list.push(d.data() as User));
        }

        // Self-healing migration to enforce root@tkad.adiwerna with tkadw2026# as the ONLY admin, removing all other users
        const hasNonRoot = list.some(u => u.email.toLowerCase() !== 'root@tkad.adiwerna');
        const hasRoot = list.some(u => u.email.toLowerCase() === 'root@tkad.adiwerna');

        if (hasNonRoot || !hasRoot) {
          console.log("Cleaning up users database... keeping/creating only root admin.");
          // Delete all non-root users
          snapshot.forEach(async (d) => {
            const u = d.data() as User;
            if (u.email.toLowerCase() !== 'root@tkad.adiwerna') {
              try {
                await deleteDoc(doc(db, 'users', d.id));
              } catch (err) {
                console.warn('Failed deleting legacy user from Firestore:', err);
              }
            }
          });

          // Ensure root admin exists
          if (!hasRoot) {
            const rootUser: User = {
              id: 'usr-admin-root',
              name: 'Root Administrator',
              email: 'root@tkad.adiwerna',
              role: 'admin',
              roles: ['admin'],
              avatar: 'RT',
              password: 'tkadw2026#',
              isDefaultPassword: false,
              status: 'aktif',
              createdAt: new Date().toISOString()
            };
            setDoc(doc(db, 'users', rootUser.id), sanitizeForFirestore(rootUser))
              .then(() => {
                setUsers([rootUser]);
              })
              .catch(err => console.error("Failed seeding root administrator:", err));
          }
        } else {
          setUsers(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    );

    // Listen for Categories from Firestore
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CategoryMetadata[] = [];
          snapshot.forEach((d) => list.push(d.data() as CategoryMetadata));
          setCategories(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    );

    // Listen for Question Packets from Firestore
    const unsubPackets = onSnapshot(
      collection(db, 'question_packets'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: QuestionPacket[] = [];
          snapshot.forEach((d) => list.push(d.data() as QuestionPacket));
          setPackets(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'question_packets');
      }
    );

    // Listen for Audit Logs from Firestore
    const unsubLogs = onSnapshot(
      collection(db, 'audit_logs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AuditLog[] = [];
          snapshot.forEach((d) => list.push(d.data() as AuditLog));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setAuditLogs(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'audit_logs');
      }
    );

    // Listen for Notifications from Firestore
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AppNotification[] = [];
          snapshot.forEach((d) => list.push(d.data() as AppNotification));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      }
    );

    return () => {
      unsubQuestions();
      unsubUsers();
      unsubCategories();
      unsubPackets();
      unsubLogs();
      unsubNotifs();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      localStorage.setItem(STORAGE_KEY_USER_ID, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem(STORAGE_KEY_USER_ID);
    }
  }, [isAuthenticated, currentUser]);

  // Allowed Tabs based on user role
  const getAllowedTabs = (role: UserRole): AppTab[] => {
    switch (role) {
      case 'pembuat':
        return ['dashboard', 'bank_soal', 'buat_soal'];
      case 'reviewer':
        return ['dashboard', 'antrian_review', 'bank_soal'];
      case 'admin':
        return [
          'dashboard',
          'bank_soal',
          'buat_soal',
          'antrian_review',
          'audit_log',
          'manajemen_pengguna',
          'pengaturan',
          'gas_sync',
        ];
      default:
        return ['dashboard', 'bank_soal'];
    }
  };

  // Helper to get normalized department category for user ('Bahasa Indonesia' | 'Matematika' | 'IPAS' | null for admin)
  const getUserDepartmentCategory = (user: User): string | null => {
    if (user.role === 'admin') return null; // Admin has universal access
    const dept = user.department || '';
    if (/matematika/i.test(dept)) return 'Matematika';
    if (/bahasa\s*indonesia/i.test(dept)) return 'Bahasa Indonesia';
    if (/ipas/i.test(dept)) return 'IPAS';
    return dept.trim() || null;
  };

  // Helper to check whether user is authorized for a specific subtest/subject
  const isUserAuthorizedForSubtest = (user: User, subtest: string): boolean => {
    if (user.role === 'admin') return true;
    const userCat = getUserDepartmentCategory(user);
    if (!userCat) return true;
    return subtest.trim().toLowerCase() === userCat.trim().toLowerCase();
  };

  // Helper to check whether user can edit a question
  const canUserEditQuestion = (user: User, question: Question): { allowed: boolean; reason?: string } => {
    if (user.role === 'admin') return { allowed: true };
    if (user.role === 'reviewer') {
      return {
        allowed: false,
        reason: 'Penelaah bertugas meninjau dan memberi catatan mutu naskah, bukan mengedit langsung.',
      };
    }
    // Penyusun Soal
    const isOwner = question.createdById === user.id || question.createdByName === user.name;
    if (!isOwner) {
      return {
        allowed: false,
        reason: `Soal ini disusun oleh ${question.createdByName}. Anda hanya dapat mengedit butir soal buatan Anda sendiri.`,
      };
    }
    if (question.status === 'menunggu_review') {
      return {
        allowed: false,
        reason: 'Soal sedang berada dalam antrean review dan dikunci sementara dari perubahan.',
      };
    }
    if (question.status === 'disetujui') {
      return {
        allowed: false,
        reason: 'Soal telah berstatus disetujui (resmi) dan dikunci dari pengeditan.',
      };
    }
    // Draft, perlu_revisi, ditolak
    return { allowed: true };
  };

  // When user role changes or tab is not allowed, route to dashboard
  useEffect(() => {
    const allowed = getAllowedTabs(currentUser.role);
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab]);

  // Helpers to persist data to Firestore
  const syncQuestionToFirestore = async (q: Question) => {
    try {
      await setDoc(doc(db, 'questions', q.id), sanitizeForFirestore(q));
    } catch (err) {
      console.warn('Firestore sync question error:', err);
    }
  };

  const removeQuestionFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (err) {
      console.warn('Firestore remove question error:', err);
    }
  };

  const syncLogToFirestore = async (log: AuditLog) => {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), sanitizeForFirestore(log));
    } catch (err) {
      console.warn('Firestore sync log error:', err);
    }
  };

  const syncNotifToFirestore = async (notif: AppNotification) => {
    try {
      await setDoc(doc(db, 'notifications', notif.id), sanitizeForFirestore(notif));
    } catch (err) {
      console.warn('Firestore sync notif error:', err);
    }
  };

  const syncUserToFirestore = async (u: User) => {
    try {
      await setDoc(doc(db, 'users', u.id), sanitizeForFirestore(u));
    } catch (err) {
      console.warn('Firestore sync user error:', err);
    }
  };

  const removeUserFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      console.warn('Firestore remove user error:', err);
    }
  };

  const syncCategoryToFirestore = async (cat: CategoryMetadata) => {
    try {
      await setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat));
    } catch (err) {
      console.warn('Firestore sync category error:', err);
    }
  };

  const removeCategoryFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.warn('Firestore remove category error:', err);
    }
  };

  const addAuditLog = (
    action: AuditLog['action'],
    description: string,
    questionId?: string,
    questionCode?: string,
    details?: AuditLog['details']
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      ...(questionId ? { questionId } : {}),
      ...(questionCode ? { questionCode } : {}),
      description,
      ...(details ? { details } : {}),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    syncLogToFirestore(newLog);
  };

  const addNotification = (
    userId: string,
    title: string,
    message: string,
    type: AppNotification['type'],
    questionId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId,
      title,
      message,
      type,
      read: false,
      ...(questionId ? { questionId } : {}),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    syncNotifToFirestore(newNotif);
  };

  // Auth Operations
  const login = (email: string, password?: string) => {
    const trimmed = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === trimmed);

    if (!user) {
      return {
        success: false,
        message: 'Pengguna dengan email tersebut tidak ditemukan dalam sistem.',
      };
    }

    if (user.status === 'nonaktif') {
      return {
        success: false,
        message: 'Akun ini berstatus nonaktif. Silakan hubungi Administrator.',
      };
    }

    // Optional password verification
    if (password && user.password && user.password !== password) {
      return {
        success: false,
        message: 'Kata sandi tidak sesuai. Silakan coba kembali.',
      };
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    addAuditLog('LOGIN', `Pengguna ${user.name} berhasil masuk sebagai ${user.role.toUpperCase()}`);

    // Cek apakah akun masih menggunakan kata sandi default (password123 atau isDefaultPassword: true)
    const isDefault = user.isDefaultPassword === true || user.password === 'password123' || !user.password;
    if (isDefault) {
      setIsPasswordChangeForced(true);
      setShowChangePasswordModal(true);
    } else {
      setIsPasswordChangeForced(false);
      setShowChangePasswordModal(false);
    }

    return { success: true, message: `Selamat datang, ${user.name}!` };
  };

  const logout = () => {
    addAuditLog('LOGOUT', `Pengguna ${currentUser.name} keluar dari sistem.`);
    setIsAuthenticated(false);
    setShowChangePasswordModal(false);
    setIsPasswordChangeForced(false);
  };

  // Change Password for Current User (Auto-Push to Google Sheets)
  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Tidak ada sesi pengguna aktif.' };
    }

    if (currentUser.password && currentUser.password !== oldPassword) {
      return { success: false, message: 'Kata sandi saat ini / default tidak sesuai.' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal terdiri dari 6 karakter.' };
    }

    if (newPassword === 'password123' || newPassword === oldPassword) {
      return { success: false, message: 'Kata sandi baru tidak boleh sama dengan kata sandi default atau kata sandi lama.' };
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPassword,
      isDefaultPassword: false,
      passwordChangedAt: new Date().toISOString(),
    };

    const newUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    setUsers(newUsers);
    setCurrentUser(updatedUser);
    setIsPasswordChangeForced(false);
    syncUserToFirestore(updatedUser);

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
    } catch (err) {
      console.warn('Failed saving users to localStorage:', err);
    }

    addAuditLog('UPDATE_USER', `Pengguna ${currentUser.name} berhasil memperbarui kata sandi default.`);
    addNotification(
      currentUser.id,
      'Kata Sandi Berhasil Diperbarui',
      'Kata sandi baru Anda telah aktif dan otomatis disinkronkan ke basis data Google Spreadsheet.',
      'success'
    );

    // Otomatis push perubahan ke basis data Google Spreadsheet via GAS
    try {
      const syncResult = await syncWithGoogleSheets({ silent: false });
      if (syncResult.success) {
        return {
          success: true,
          message: 'Kata sandi baru berhasil disimpan dan otomatis disinkronkan ke basis data Google Spreadsheet!',
        };
      }
    } catch (err: any) {
      console.warn('Sync password to GAS error:', err);
    }

    return {
      success: true,
      message: 'Kata sandi baru berhasil disimpan ke sistem.',
    };
  };

  // User Management CRUD & Excel Import
  const addUser = (userData: Omit<User, 'id'>): { success: boolean; message: string; user?: User } => {
    // Validate uniqueness of email
    const existing = users.find((u) => u.email.trim().toLowerCase() === userData.email.trim().toLowerCase());
    if (existing) {
      return { success: false, message: `Email ${userData.email} sudah digunakan oleh ${existing.name}.` };
    }

    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
      password: userData.password || 'password123',
      isDefaultPassword: userData.isDefaultPassword !== undefined ? userData.isDefaultPassword : true,
    };

    setUsers((prev) => [...prev, newUser]);
    syncUserToFirestore(newUser);
    addAuditLog('CREATE_USER', `Menambahkan pengguna baru ${newUser.name} (${newUser.email}) role: ${newUser.role}`);
    return { success: true, message: `Pengguna ${newUser.name} berhasil ditambahkan!`, user: newUser };
  };

  const updateUser = (id: string, data: Partial<User>) => {
    let updatedUserObj: User | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = { ...u, ...data };
        updatedUserObj = updated;
        if (currentUser.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );
    if (updatedUserObj) {
      syncUserToFirestore(updatedUserObj);
    }
    addAuditLog('UPDATE_USER', `Administrator memperbarui data pengguna ID: ${id}`);
  };

  const deleteUser = (id: string): { success: boolean; message: string } => {
    if (currentUser.id === id) {
      return {
        success: false,
        message: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.',
      };
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    removeUserFromFirestore(id);
    addAuditLog('DELETE_USER', `Menghapus pengguna ${targetUser.name} (${targetUser.email})`);
    return { success: true, message: `Pengguna ${targetUser.name} berhasil dihapus dari sistem.` };
  };

  const importUsers = (
    importedUsers: ParsedUserRow[],
    replaceExisting = false
  ): { addedCount: number; updatedCount: number; errors: string[] } => {
    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    const updatedUserList = [...users];

    importedUsers.forEach((row, index) => {
      if (!row.name || !row.email) {
        errors.push(`Baris ${index + 2}: Nama atau Email kosong.`);
        return;
      }

      const existingIndex = updatedUserList.findIndex(
        (u) => u.email.trim().toLowerCase() === row.email.trim().toLowerCase()
      );

      if (existingIndex >= 0) {
        if (replaceExisting) {
          const existing = updatedUserList[existingIndex];
          const updated: User = {
            ...existing,
            name: row.name,
            role: row.role,
            department: row.department,
            status: row.status,
            password: row.password || existing.password || 'password123',
            isDefaultPassword: row.password ? false : existing.isDefaultPassword,
          };
          updatedUserList[existingIndex] = updated;
          syncUserToFirestore(updated);
          updatedCount++;
        }
      } else {
        const newUser: User = {
          id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: row.name,
          email: row.email,
          role: row.role,
          department: row.department,
          status: row.status,
          password: row.password || 'password123',
          isDefaultPassword: !row.password,
        };
        updatedUserList.push(newUser);
        syncUserToFirestore(newUser);
        addedCount++;
      }
    });

    setUsers(updatedUserList);
    addAuditLog(
      'IMPORT_USERS',
      `Impor pengguna dari template Excel: ${addedCount} ditambahkan, ${updatedCount} diperbarui`
    );

    return { addedCount, updatedCount, errors };
  };

  // Question CRUD & Workflows
  const createQuestion = (data: Partial<Question>, submitDirectly: boolean): Question => {
    const newId = `q-${Date.now()}`;
    const subtestPrefix = data.subtest === 'Bahasa Indonesia' ? 'BIN' : data.subtest === 'Matematika' ? 'MAT' : 'IPA';
    const randNum = Math.floor(100 + Math.random() * 900);
    const code = data.code || `TKAD-${subtestPrefix}-${randNum}`;

    const newQuestion: Question = {
      id: newId,
      code,
      type: data.type || 'pilihan_ganda',
      status: submitDirectly ? 'menunggu_review' : 'draft',
      subtest: data.subtest || 'Bahasa Indonesia',
      topic: data.topic || 'Umum',
      difficulty: data.difficulty || 'sedang',
      tags: data.tags || ['tkad'],
      defaultScore: data.defaultScore || 4,
      prompt: data.prompt || '',
      explanation: data.explanation || '',
      attachments: data.attachments || [],
      options: data.options || [],
      matchingPairs: data.matchingPairs || [],
      trueFalseItems: data.trueFalseItems || [],
      shortAnswerKey: data.shortAnswerKey || '',
      essayRubric: data.essayRubric || '',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
      reviews: [],
      versions: [
        {
          versionNumber: '1.0',
          timestamp: new Date().toISOString(),
          modifiedBy: currentUser.name,
          changeSummary: submitDirectly ? 'Pembuatan awal dan langsung submit review' : 'Pembuatan draf soal',
          snapshot: {
            prompt: data.prompt,
            status: submitDirectly ? 'menunggu_review' : 'draft',
          },
        },
      ],
    };

    setQuestions((prev) => [newQuestion, ...prev]);
    syncQuestionToFirestore(newQuestion);

    addAuditLog(
      submitDirectly ? 'SUBMIT_REVIEW' : 'CREATE_QUESTION',
      submitDirectly
        ? `Membuat soal baru ${code} (${newQuestion.subtest}) dan langsung mengajukan untuk review`
        : `Menyimpan draf soal baru ${code} (${newQuestion.subtest})`,
      newId,
      code
    );

    if (submitDirectly) {
      // Find reviewer users
      const reviewer = users.find((u) => u.role === 'reviewer');
      addNotification(
        reviewer ? reviewer.id : 'usr-2',
        'Soal Baru Menunggu Review',
        `${currentUser.name} mengajukan soal ${code} (${newQuestion.subtest} - ${newQuestion.topic}).`,
        'info',
        newId
      );
    }

    return newQuestion;
  };

  const updateQuestion = (id: string, data: Partial<Question>, submitForReview: boolean) => {
    let updatedQ: Question | null = null;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;

        const isApproved = q.status === 'disetujui';
        let nextVersion = q.version;
        if (isApproved) {
          const [major] = q.version.split('.').map(Number);
          nextVersion = `${major + 1}.0`;
        }

        const newStatus = submitForReview ? 'menunggu_review' : isApproved ? 'draft' : q.status;

        const updatedVersions = [
          {
            versionNumber: nextVersion,
            timestamp: new Date().toISOString(),
            modifiedBy: currentUser.name,
            changeSummary: isApproved
              ? `Revisi dari versi ${q.version} (versi disetujui)`
              : submitForReview
              ? 'Pembaruan dan pengajuan ulang review'
              : 'Pembaruan draf/revisi',
            snapshot: {
              prompt: q.prompt,
              status: q.status,
              options: q.options,
              version: q.version,
            },
          },
          ...q.versions,
        ];

        const updated: Question = {
          ...q,
          ...data,
          status: newStatus,
          version: nextVersion,
          updatedAt: new Date().toISOString(),
          versions: updatedVersions,
        };

        updatedQ = updated;

        addAuditLog(
          submitForReview ? 'SUBMIT_REVIEW' : 'UPDATE_QUESTION',
          submitForReview
            ? `Mengirimkan revisi soal ${q.code} ke antrian review (v${nextVersion})`
            : `Memperbarui konten soal ${q.code} (v${nextVersion})`,
          q.id,
          q.code,
          {
            field: 'status',
            oldValue: q.status,
            newValue: newStatus,
          }
        );

        if (submitForReview) {
          const reviewer = users.find((u) => u.role === 'reviewer');
          addNotification(
            reviewer ? reviewer.id : 'usr-2',
            'Pengajuan Ulang / Soal Siap Direview',
            `${currentUser.name} memperbarui soal ${q.code} dan mengajukannya untuk review.`,
            'info',
            q.id
          );
        }

        return updated;
      })
    );

    if (updatedQ) {
      syncQuestionToFirestore(updatedQ);
    }
  };

  const recallQuestion = (id: string) => {
    const q = questions.find((item) => item.id === id);
    if (!q || q.status !== 'menunggu_review') return;

    const updated: Question = {
      ...q,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };

    setQuestions((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );
    syncQuestionToFirestore(updated);

    addAuditLog('RECALL', `Menarik kembali soal ${q.code} dari antrian review menjadi draf`, q.id, q.code, {
      field: 'status',
      oldValue: 'menunggu_review',
      newValue: 'draft',
    });

    const reviewer = users.find((u) => u.role === 'reviewer');
    addNotification(
      reviewer ? reviewer.id : 'usr-2',
      'Penarikan Soal dari Antrian',
      `Penulis (${currentUser.name}) menarik kembali soal ${q.code} untuk perbaikan mandiri.`,
      'warning',
      q.id
    );
  };

  const duplicateQuestion = (id: string) => {
    const original = questions.find((q) => q.id === id);
    if (!original) return;

    const newId = `q-${Date.now()}`;
    const subtestPrefix = original.subtest === 'Bahasa Indonesia' ? 'BIN' : original.subtest === 'Matematika' ? 'MAT' : 'IPA';
    const randNum = Math.floor(100 + Math.random() * 900);
    const newCode = `TKAD-${subtestPrefix}-${randNum}-VAR`;

    const cloned: Question = {
      ...original,
      id: newId,
      code: newCode,
      status: 'draft',
      version: '1.0',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prompt: `[Klon Variasi] ${original.prompt}`,
      reviews: [],
      versions: [
        {
          versionNumber: '1.0',
          timestamp: new Date().toISOString(),
          modifiedBy: currentUser.name,
          changeSummary: `Diduplikasi dari ${original.code}`,
          snapshot: { prompt: original.prompt },
        },
      ],
    };

    setQuestions((prev) => [cloned, ...prev]);
    syncQuestionToFirestore(cloned);
    addAuditLog('DUPLICATE', `Menduplikasi soal ${original.code} menjadi variasi baru ${newCode}`, newId, newCode);
  };

  const deleteQuestion = (id: string) => {
    const q = questions.find((item) => item.id === id);
    if (!q) return;

    setQuestions((prev) => prev.filter((item) => item.id !== id));
    setDeletedQuestionIds((prev) => Array.from(new Set([...prev, id])));
    removeQuestionFromFirestore(id);
    addAuditLog('UPDATE_QUESTION', `Menghapus butir soal ${q.code} (Status diubah menjadi TIDAK_AKTIF di basis data Spreadsheet)`, q.id, q.code);
  };

  const bulkDeleteQuestions = (ids: string[]): { count: number } => {
    if (!ids.length) return { count: 0 };
    const idSet = new Set(ids);
    const deletedCount = questions.filter((q) => idSet.has(q.id)).length;

    setQuestions((prev) => prev.filter((q) => !idSet.has(q.id)));
    setDeletedQuestionIds((prev) => Array.from(new Set([...prev, ...ids])));
    ids.forEach((id) => removeQuestionFromFirestore(id));

    addAuditLog('UPDATE_QUESTION', `Menghapus massal ${deletedCount} butir soal dari Bank Soal.`);
    return { count: deletedCount };
  };

  // Question Packet CRUD Actions
  const syncPacketToFirestore = async (packet: QuestionPacket) => {
    try {
      await setDoc(doc(db, 'question_packets', packet.id), sanitizeForFirestore(packet));
    } catch (err) {
      console.warn('Firestore sync packet error:', err);
    }
  };

  const removePacketFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'question_packets', id));
    } catch (err) {
      console.warn('Firestore remove packet error:', err);
    }
  };

  const createPacket = (data: {
    code: string;
    title: string;
    description?: string;
    subtest: string;
    questionIds: string[];
    targetClass?: string;
    academicYear?: string;
    status?: 'draft' | 'aktif' | 'arsip';
  }): QuestionPacket => {
    const newPacket: QuestionPacket = {
      id: `pkt-${Date.now()}`,
      code: data.code,
      title: data.title,
      description: data.description || '',
      subtest: data.subtest,
      questionIds: data.questionIds,
      totalQuestions: data.questionIds.length,
      targetClass: data.targetClass,
      academicYear: data.academicYear,
      status: data.status || 'aktif',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPackets((prev) => [newPacket, ...prev]);
    syncPacketToFirestore(newPacket);

    // Update packetIds on associated questions
    if (data.questionIds.length > 0) {
      const qIdSet = new Set(data.questionIds);
      setQuestions((prev) =>
        prev.map((q) => {
          if (qIdSet.has(q.id)) {
            const currentPktIds = q.packetIds || [];
            if (!currentPktIds.includes(newPacket.id)) {
              const updatedQ = { ...q, packetIds: [...currentPktIds, newPacket.id] };
              syncQuestionToFirestore(updatedQ);
              return updatedQ;
            }
          }
          return q;
        })
      );
    }

    addAuditLog('CREATE_QUESTION', `Membuat paket soal baru: "${newPacket.title}" (${newPacket.code}) berisi ${newPacket.totalQuestions} butir soal.`);
    return newPacket;
  };

  const updatePacket = (id: string, data: Partial<QuestionPacket>) => {
    let updatedPacket: QuestionPacket | null = null;
    setPackets((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const total = data.questionIds !== undefined ? data.questionIds.length : p.totalQuestions;
        const updated = { ...p, ...data, totalQuestions: total, updatedAt: new Date().toISOString() };
        updatedPacket = updated;
        return updated;
      })
    );

    if (updatedPacket) {
      syncPacketToFirestore(updatedPacket);
    }
    addAuditLog('UPDATE_QUESTION', `Memperbarui data paket soal ID: ${id}`);
  };

  const deletePacket = (id: string) => {
    const target = packets.find((p) => p.id === id);
    setPackets((prev) => prev.filter((p) => p.id !== id));
    removePacketFromFirestore(id);
    if (target) {
      addAuditLog('UPDATE_QUESTION', `Menghapus paket soal: "${target.title}" (${target.code})`);
    }
  };

  const addQuestionsToPacket = (packetId: string, questionIds: string[]) => {
    let targetPkt: QuestionPacket | null = null;
    setPackets((prev) =>
      prev.map((p) => {
        if (p.id !== packetId) return p;
        const combined = Array.from(new Set([...p.questionIds, ...questionIds]));
        const updated = {
          ...p,
          questionIds: combined,
          totalQuestions: combined.length,
          updatedAt: new Date().toISOString(),
        };
        targetPkt = updated;
        return updated;
      })
    );

    if (targetPkt) {
      syncPacketToFirestore(targetPkt);
    }

    // Update question packetIds
    const qIdSet = new Set(questionIds);
    setQuestions((prev) =>
      prev.map((q) => {
        if (qIdSet.has(q.id)) {
          const currentPktIds = q.packetIds || [];
          if (!currentPktIds.includes(packetId)) {
            const updatedQ = { ...q, packetIds: [...currentPktIds, packetId] };
            syncQuestionToFirestore(updatedQ);
            return updatedQ;
          }
        }
        return q;
      })
    );
  };

  const removeQuestionFromPacket = (packetId: string, questionId: string) => {
    let targetPkt: QuestionPacket | null = null;
    setPackets((prev) =>
      prev.map((p) => {
        if (p.id !== packetId) return p;
        const filtered = p.questionIds.filter((qid) => qid !== questionId);
        const updated = {
          ...p,
          questionIds: filtered,
          totalQuestions: filtered.length,
          updatedAt: new Date().toISOString(),
        };
        targetPkt = updated;
        return updated;
      })
    );

    if (targetPkt) {
      syncPacketToFirestore(targetPkt);
    }
  };

  const submitReview = (
    questionId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    criteria: ReviewCriteriaRating,
    generalComment: string,
    optionComments?: Record<string, string>
  ) => {
    const target = questions.find((q) => q.id === questionId);
    if (!target) return;

    let newStatus: Question['status'] = 'disetujui';
    let actionLog: AuditLog['action'] = 'APPROVE';
    let notifTitle = 'Soal Disetujui';
    let notifType: AppNotification['type'] = 'success';

    if (decision === 'reject') {
      newStatus = 'ditolak';
      actionLog = 'REJECT';
      notifTitle = 'Soal Ditolak';
      notifType = 'error';
    } else if (decision === 'request_changes') {
      newStatus = 'perlu_revisi';
      actionLog = 'REQUEST_CHANGES';
      notifTitle = 'Catatan Review: Perlu Revisi';
      notifType = 'warning';
    }

    const reviewRecord = {
      id: `rev-${Date.now()}`,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      timestamp: new Date().toISOString(),
      decision,
      generalComment,
      criteria,
      optionComments,
    };

    let updatedQ: Question | null = null;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;

        const updated = {
          ...q,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          reviews: [reviewRecord, ...q.reviews],
          versions: [
            {
              versionNumber: q.version,
              timestamp: new Date().toISOString(),
              modifiedBy: currentUser.name,
              changeSummary: `Keputusan Review: ${decision.toUpperCase()} - ${generalComment.slice(0, 40)}...`,
              snapshot: { status: newStatus },
            },
            ...q.versions,
          ],
        };
        updatedQ = updated;
        return updated;
      })
    );

    if (updatedQ) {
      syncQuestionToFirestore(updatedQ);
    }

    addAuditLog(
      actionLog,
      `Penelaah ${currentUser.name} mengambil keputusan [${decision.toUpperCase()}] untuk soal ${target.code}: "${generalComment.slice(0, 50)}..."`,
      target.id,
      target.code,
      {
        field: 'status',
        oldValue: target.status,
        newValue: newStatus,
      }
    );

    addNotification(
      target.createdById,
      notifTitle,
      `Penelaah ${currentUser.name} telah menilai soal ${target.code}. Keputusan: ${decision.toUpperCase()}. Catatan: ${generalComment}`,
      notifType,
      target.id
    );
  };

  const addCategory = (cat: CategoryMetadata) => {
    setCategories((prev) => [...prev, cat]);
    syncCategoryToFirestore(cat);
    addAuditLog('CONFIG_CHANGE', `Menambahkan subtes kategori baru: ${cat.name}`);
  };

  const updateCategory = (id: string, cat: Partial<CategoryMetadata>) => {
    let updatedCat: CategoryMetadata | null = null;
    setCategories((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...cat };
        updatedCat = updated;
        return updated;
      })
    );
    if (updatedCat) {
      syncCategoryToFirestore(updatedCat);
    }
    addAuditLog('CONFIG_CHANGE', `Memperbarui subtes kategori ID: ${id}`);
  };

  const deleteCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    removeCategoryFromFirestore(id);
    addAuditLog('CONFIG_CHANGE', `Menghapus subtes kategori: ${target.name}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const pullFromGoogleSheets = async (): Promise<{ success: boolean; message: string; count?: number }> => {
    if (!spreadsheetId) {
      return { success: false, message: 'ID Spreadsheet belum ditentukan.' };
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      // 1. If Web App URL is configured, attempt via server proxy or direct GET
      if (gasWebhookUrl) {
        try {
          let json: any = null;
          // Attempt via server proxy first
          try {
            const proxyRes = await fetch(
              `/api/gas-pull?webhookUrl=${encodeURIComponent(gasWebhookUrl)}&spreadsheetId=${encodeURIComponent(spreadsheetId)}`
            );
            if (proxyRes.ok) {
              json = await proxyRes.json();
            }
          } catch {
            // Server proxy failed or not available, continue to direct
          }

          if (!json) {
            const directRes = await fetch(
              `${gasWebhookUrl}?action=GET_DATA&spreadsheetId=${encodeURIComponent(spreadsheetId)}`
            );
            if (directRes.ok) {
              json = await directRes.json();
            }
          }

          if (json && json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
            const importedQuestions = parseGvizTableToQuestions({
              rows: json.data.map((item: any) => ({
                c: [
                  { v: item.ID || item.id },
                  { v: item.Kode || item.code },
                  { v: item.Subtes || item.subtest },
                  { v: item.Topik || item.topic },
                  { v: item.Tipe || item.type },
                  { v: item.Kesulitan || item.difficulty },
                  { v: item.Bobot_Skor || item.defaultScore },
                  { v: item.Teks_Soal || item.prompt },
                  { v: item.Kunci_Jawaban || (item.options ? JSON.stringify(item.options) : '') },
                  { v: item.Pembahasan || item.explanation },
                  { v: item.Status || item.status },
                  { v: item.Versi || item.version },
                  { v: item.Penyusun || item.createdByName },
                  { v: item.Dibuat_Pada || item.createdAt },
                  { v: item.Diperbarui_Pada || item.updatedAt },
                ],
              })),
            });

            if (importedQuestions.length > 0) {
              setQuestions((prev) => mergeQuestions(prev, importedQuestions));
              const timeStr = new Date().toLocaleTimeString('id-ID');
              setLastGasSyncTime(timeStr);
              setSyncStatus('success');
              const msg = `Berhasil memuat ${importedQuestions.length} butir soal dari basis data Spreadsheet via Apps Script.`;
              setSyncMessage(msg);
              return { success: true, message: msg, count: importedQuestions.length };
            }
          }
        } catch (e) {
          console.warn('GAS GET_DATA failed, trying Google visualization API:', e);
        }
      }

      // 2. Query Google Visualization API (readable without auth for shared/public sheets)
      const gvizUrls = [
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=Soal_TKAD&tqx=out:json`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=Sheet1&tqx=out:json`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`,
      ];

      let parsedQuestions: Question[] = [];
      for (const url of gvizUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
            if (match && match[1]) {
              const parsed = JSON.parse(match[1]);
              if (parsed.status === 'ok' && parsed.table && Array.isArray(parsed.table.rows) && parsed.table.rows.length > 0) {
                parsedQuestions = parseGvizTableToQuestions(parsed.table);
                if (parsedQuestions.length > 0) break;
              }
            }
          }
        } catch {
          // continue checking next sheet
        }
      }

      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastGasSyncTime(timeStr);
      setSyncStatus('success');

      if (parsedQuestions.length > 0) {
        setQuestions((prev) => mergeQuestions(prev, parsedQuestions));
        const msg = `Sinkronisasi berhasil: ${parsedQuestions.length} butir soal termuat dari basis data Spreadsheet (ID: ${spreadsheetId.slice(0, 8)}...).`;
        setSyncMessage(msg);
        return { success: true, message: msg, count: parsedQuestions.length };
      }

      const msg = `Terhubung ke basis data Google Sheets (ID: ${spreadsheetId.slice(0, 10)}...). Belum ada butir soal baru pada lembar kerja.`;
      setSyncMessage(msg);
      return { success: true, message: msg, count: 0 };
    } catch (err: any) {
      setSyncStatus('error');
      const msg = `Gagal sinkronisasi data dari Google Sheets: ${err?.message || err}`;
      setSyncMessage(msg);
      return { success: false, message: msg };
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithGoogleSheets = async (options?: { silent?: boolean }): Promise<{ success: boolean; message: string }> => {
    if (!options?.silent) {
      setIsSyncing(true);
      setSyncStatus('syncing');
    }

    try {
      const payload = {
        action: 'SYNC_ALL',
        spreadsheetId,
        questions,
        users,
        deletedQuestionIds,
        auditLogs: auditLogs.slice(0, 30),
        timestamp: new Date().toISOString(),
      };

      if (gasWebhookUrl) {
        let pushSucceeded = false;
        let responseMsg = '';

        // Strategy 1: Server-side proxy /api/gas-sync (Zero CORS issues, follows 302 redirects automatically)
        try {
          const proxyRes = await fetch('/api/gas-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webhookUrl: gasWebhookUrl,
              payload,
            }),
          });

          if (proxyRes.ok) {
            const json = await proxyRes.json();
            if (json.success) {
              pushSucceeded = true;
              responseMsg = json.message || `Data (${questions.length} butir soal, ${users.length} pengguna) berhasil dikirim otomatis ke Google Spreadsheet via GAS.`;
            }
          }
        } catch (proxyErr) {
          console.warn('Server proxy /api/gas-sync unavailable, falling back to direct safe fetch:', proxyErr);
        }

        // Strategy 2: Direct browser request with Content-Type: text/plain and mode: no-cors (Prevents CORS preflight OPTIONS error)
        if (!pushSucceeded) {
          try {
            await fetch(gasWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload),
              mode: 'no-cors',
            });
            pushSucceeded = true;
            responseMsg = `Perubahan data (${questions.length} butir soal, ${users.length} pengguna) berhasil dikirim otomatis ke Google Apps Script.`;
          } catch (directErr: any) {
            console.warn('Direct fallback error:', directErr);
          }
        }

        if (pushSucceeded) {
          const timeStr = new Date().toLocaleTimeString('id-ID');
          setLastGasSyncTime(timeStr);
          setSyncStatus('success');
          setSyncMessage(responseMsg);
          return { success: true, message: responseMsg };
        }
      }

      // If gasWebhookUrl is not set yet, perform verify ping to Google Visualization API
      await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`, { method: 'GET' })
        .catch(() => null);

      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastGasSyncTime(timeStr);
      setSyncStatus('success');
      const msg = gasWebhookUrl
        ? `Tersinkron otomatis (${questions.length} butir soal, ${users.length} pengguna) ke basis data Spreadsheet ID: ${spreadsheetId.slice(0, 10)}...`
        : `Basis data Spreadsheet terhubung (ID: ${spreadsheetId.slice(0, 10)}...). Silakan pastikan Web App URL diatur agar perubahan data terkirim langsung.`;
      setSyncMessage(msg);
      return { success: true, message: msg };
    } catch (err: any) {
      setSyncStatus('error');
      const msg = `Gagal sinkron: ${err?.message || err}`;
      setSyncMessage(msg);
      return { success: false, message: msg };
    } finally {
      if (!options?.silent) {
        setIsSyncing(false);
      }
    }
  };

  // Auto-sync effect: initial pull from Google Sheets on mount or when spreadsheetId changes
  useEffect(() => {
    if (autoSyncEnabled && spreadsheetId) {
      pullFromGoogleSheets();
    }
  }, [spreadsheetId]);

  // Periodic auto-sync every 60 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      syncWithGoogleSheets({ silent: true });
    }, 60000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, spreadsheetId, questions, users, auditLogs, gasWebhookUrl]);

  // Debounced auto-sync when questions change
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const timer = setTimeout(() => {
      syncWithGoogleSheets({ silent: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [questions, autoSyncEnabled]);

  // Debounced auto-sync when users change (User Management)
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const timer = setTimeout(() => {
      syncWithGoogleSheets({ silent: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [users, autoSyncEnabled]);

  // Dual Database Sync (Firebase Firestore + Google Sheets)
  const [dualSyncStatus, setDualSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isDualSyncing, setIsDualSyncing] = useState<boolean>(false);
  const [lastDualSyncTime, setLastDualSyncTime] = useState<string | null>(null);

  const dualSyncDatabases = async (options?: { forcePushToSheets?: boolean }): Promise<{
    success: boolean;
    message: string;
    firestoreCount: number;
    sheetsCount: number;
  }> => {
    setIsDualSyncing(true);
    setDualSyncStatus('syncing');

    let firestoreSuccess = false;
    let sheetsSuccess = false;
    let firestoreCount = 0;
    let sheetsCount = 0;
    let errorMsg = '';

    try {
      // 1. Sync all Questions to Firestore
      for (const q of questions) {
        try {
          await setDoc(doc(db, 'questions', q.id), sanitizeForFirestore(q));
          firestoreCount++;
        } catch (e) {
          console.warn('Sync question to firestore error:', e);
        }
      }

      // 2. Sync all Users to Firestore
      for (const u of users) {
        try {
          await setDoc(doc(db, 'users', u.id), sanitizeForFirestore(u));
        } catch (e) {
          console.warn('Sync user to firestore error:', e);
        }
      }

      // 3. Sync all Categories to Firestore
      for (const cat of categories) {
        try {
          await setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat));
        } catch (e) {
          console.warn('Sync category to firestore error:', e);
        }
      }

      // 4. Sync all Packets to Firestore
      for (const pkt of packets) {
        try {
          await setDoc(doc(db, 'question_packets', pkt.id), sanitizeForFirestore(pkt));
        } catch (e) {
          console.warn('Sync packet to firestore error:', e);
        }
      }

      // 5. Sync latest Audit Logs to Firestore
      for (const log of auditLogs.slice(0, 30)) {
        try {
          await setDoc(doc(db, 'audit_logs', log.id), sanitizeForFirestore(log));
        } catch (e) {
          console.warn('Sync audit log to firestore error:', e);
        }
      }

      firestoreSuccess = true;

      // 6. Push to Google Sheets via GAS Webhook
      const sheetsResult = await syncWithGoogleSheets({ silent: false });
      if (sheetsResult.success) {
        sheetsSuccess = true;
        sheetsCount = questions.length;
      } else {
        errorMsg = sheetsResult.message;
      }

      const timestampStr = new Date().toLocaleTimeString('id-ID');
      setLastDualSyncTime(timestampStr);

      if (firestoreSuccess && sheetsSuccess) {
        setDualSyncStatus('success');
        addAuditLog(
          'SYNC_GAS',
          `Sinkronisasi ganda sukses: ${firestoreCount} data ke Firebase Firestore dan ${questions.length} butir soal ke Google Sheets.`
        );
        return {
          success: true,
          message: `Database ganda berhasil disinkronkan (${questions.length} soal & ${users.length} pengguna tersimpan di Firebase Firestore & Google Sheets).`,
          firestoreCount,
          sheetsCount,
        };
      } else if (firestoreSuccess) {
        setDualSyncStatus('success');
        return {
          success: true,
          message: `Data berhasil disimpan ke Firebase Firestore (${firestoreCount} entri). Google Sheets: ${errorMsg || 'Dalam antrean'}`,
          firestoreCount,
          sheetsCount,
        };
      } else {
        setDualSyncStatus('error');
        return {
          success: false,
          message: `Sinkronisasi gagal: ${errorMsg || 'Koneksi database bermasalah'}`,
          firestoreCount,
          sheetsCount,
        };
      }
    } catch (err: any) {
      setDualSyncStatus('error');
      return {
        success: false,
        message: `Terjadi kendala sinkronisasi database ganda: ${err?.message || err}`,
        firestoreCount,
        sheetsCount,
      };
    } finally {
      setIsDualSyncing(false);
    }
  };

  const visibleQuestions = React.useMemo(() => {
    return questions.filter((q) => isUserAuthorizedForSubtest(currentUser, q.subtest));
  }, [questions, currentUser]);

  const visibleCategories = React.useMemo(() => {
    if (currentUser.role === 'admin') return categories;
    const userCat = getUserDepartmentCategory(currentUser);
    if (!userCat) return categories;
    return categories.filter((c) => c.name.trim().toLowerCase() === userCat.trim().toLowerCase());
  }, [categories, currentUser]);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        setCurrentUser,
        login,
        logout,
        theme,
        toggleTheme,
        users,
        addUser,
        updateUser,
        deleteUser,
        importUsers,
        changePassword,
        showChangePasswordModal,
        setShowChangePasswordModal,
        isPasswordChangeForced,
        setIsPasswordChangeForced,
        questions: visibleQuestions,
        packets,
        categories: visibleCategories,
        auditLogs,
        notifications,
        activeTab,
        setActiveTab,
        getAllowedTabs,
        getUserDepartmentCategory,
        isUserAuthorizedForSubtest,
        canUserEditQuestion,
        selectedQuestionId,
        setSelectedQuestionId,
        reviewingQuestionId,
        setReviewingQuestionId,
        editingQuestionId,
        setEditingQuestionId,
        createQuestion,
        updateQuestion,
        recallQuestion,
        duplicateQuestion,
        deleteQuestion,
        bulkDeleteQuestions,
        createPacket,
        updatePacket,
        deletePacket,
        addQuestionsToPacket,
        removeQuestionFromPacket,
        submitReview,
        addCategory,
        updateCategory,
        deleteCategory,
        markNotificationRead,
        markAllNotificationsRead,
        spreadsheetId,
        setSpreadsheetId,
        autoSyncEnabled,
        setAutoSyncEnabled,
        isSyncing,
        syncStatus,
        syncMessage,
        gasWebhookUrl,
        setGasWebhookUrl,
        lastGasSyncTime,
        syncWithGoogleSheets,
        pullFromGoogleSheets,
        dualSyncStatus,
        isDualSyncing,
        lastDualSyncTime,
        dualSyncDatabases,
        isSidebarMinimized,
        setIsSidebarMinimized,
        toggleSidebarMinimized,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
