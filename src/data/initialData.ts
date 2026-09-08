import { Question, User, AuditLog, AppNotification, CategoryMetadata } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-dhina',
    name: 'Estri Dhina Kristiani, S.S.',
    email: 'dhina@tkad.adiwerna',
    role: 'admin',
    department: 'Administrator Pusat Bank Soal',
    avatar: 'ED',
    password: 'password123',
    isDefaultPassword: true,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-admin-yusril',
    name: 'Yusril Yahya Muhaimin, M.Pd.',
    email: 'haloyusril@tkad.adiwerna',
    role: 'admin',
    department: 'Administrator Pusat Bank Soal TKAD Adiwerna',
    avatar: 'YU',
    password: 'tkadw2026#',
    isDefaultPassword: false,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-rev-lilis',
    name: 'Lilis Nuryanti, M.Pd.',
    email: 'lilisnuryanti@tkad.adiwerna',
    role: 'reviewer',
    department: 'IPAS',
    avatar: 'LN',
    password: 'password123',
    isDefaultPassword: true,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-rev-rifal',
    name: 'Rifal Fauzi, S.Pd.',
    email: 'rifal@tkad.adiwerna',
    role: 'reviewer',
    department: 'Bahasa Indonesia',
    avatar: 'RF',
    password: 'password123',
    isDefaultPassword: true,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-rev-nur',
    name: 'Nur Aripiyah, S.Pd.',
    email: 'nuraripiyah@tkad.adiwerna',
    role: 'reviewer',
    department: 'Matematika',
    avatar: 'NA',
    password: 'password123',
    isDefaultPassword: true,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-pembuat-wildan',
    name: 'Mohamad Wildan Pramadika, S.Pd.',
    email: 'wildan@tkad.adiwerna',
    role: 'pembuat',
    department: 'Matematika',
    avatar: 'WP',
    password: 'password123',
    isDefaultPassword: true,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-pembuat-uwais',
    name: 'Moh Uwais Koroni, S.Pd.',
    email: 'uwais@tkad.adiwerna',
    role: 'pembuat',
    department: 'Bahasa Indonesia',
    avatar: 'UK',
    password: 'password123',
    isDefaultPassword: true,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-pembuat-dewi',
    name: 'Dewi Puspitasari, S.Pd.',
    email: 'dewi@tkad.adiwerna',
    role: 'pembuat',
    department: 'IPAS',
    avatar: 'DP',
    password: 'password123',
    isDefaultPassword: true,
    status: 'aktif',
    createdAt: '2026-09-01T08:00:00Z',
  },
];

export const INITIAL_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'cat-1',
    name: 'Bahasa Indonesia',
    description: 'Mengukur literasi membaca, pemahaman wacana, struktur kalimat efektif, analogi verbal, serta ejaan dan kaidah bahasa Indonesia baku.',
    topics: ['Pemahaman Teks & Wacana', 'Ide Pokok & Simpulan', 'Kalimat Efektif & PUEBI', 'Analogi Kata & Semantik', 'Penalaran Deduktif Verbal'],
  },
  {
    id: 'cat-2',
    name: 'Matematika',
    description: 'Mengukur kemampuan numerasi analitis, aljabar, kalkulus dasar, statistika & peluang, aritmatika sosial, dan pola deret bilangan.',
    topics: ['Aljabar & Persamaan', 'Deret Bilangan & Pola Angka', 'Aritmatika Sosial', 'Statistika & Peluang', 'Geometri & Pengukuran'],
  },
  {
    id: 'cat-3',
    name: 'IPAS',
    description: 'Mengukur pemahaman terpadu ilmu pengetahuan alam (fisika, kimia, biologi terapan) dan dinamika fenomena sosial kemasyarakatan.',
    topics: ['Optika & Transformasi Sains Terapan', 'Ekosistem & Lingkungan Hidup', 'Energi & Transformasinya', 'Dinamika Sosial & Geografi', 'Metabolisme & Tubuh Manusia'],
  },
];

// Cleaned: No initial example questions as requested
export const INITIAL_QUESTIONS: Question[] = [];

// Clean initial audit log
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-init-1',
    timestamp: new Date().toISOString(),
    userId: 'usr-admin-yusril',
    userName: 'Yusril (Administrator)',
    userRole: 'admin',
    action: 'CONFIG_CHANGE',
    description: 'Sistem Manajemen Bank Soal TKAD Adiwerna diinisialisasi bersih.',
  },
];

// Cleaned: No initial notifications
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
