export type UserRole = 'pembuat' | 'reviewer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  password?: string;
  status?: 'aktif' | 'nonaktif';
  createdAt?: string;
  isDefaultPassword?: boolean;
  passwordChangedAt?: string;
}

export type QuestionType =
  | 'pilihan_ganda'
  | 'pilihan_ganda_kompleks'
  | 'benar_salah'
  | 'menjodohkan'
  | 'isian_singkat'
  | 'esai';

export type QuestionStatus =
  | 'draft'
  | 'menunggu_review'
  | 'disetujui'
  | 'perlu_revisi'
  | 'ditolak';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export interface ChoiceOption {
  id: string;
  label: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
  isCorrect: boolean;
  explanation?: string;
  feedback?: string; // reviewer feedback on this choice
}

export interface MatchingPair {
  id: string;
  premise: string; // Kolom A
  response: string; // Kolom B (jawaban pasangan)
}

export interface TrueFalseItem {
  id: string;
  statement: string;
  correctAnswer: boolean; // true = Benar, false = Salah
}

export interface ReviewCriteriaRating {
  kejelasanBahasa: boolean;
  kebenaranKunci: boolean;
  kesesuaianTingkat: boolean;
  kesesuaianKisiKisi: boolean;
}

export interface ReviewRecord {
  id: string;
  reviewerId: string;
  reviewerName: string;
  timestamp: string;
  decision: 'approve' | 'reject' | 'request_changes';
  generalComment: string;
  criteria: ReviewCriteriaRating;
  optionComments?: Record<string, string>; // optionId -> comment
}

export interface QuestionVersion {
  versionNumber: string; // e.g. "1.0", "1.1", "2.0"
  timestamp: string;
  modifiedBy: string;
  changeSummary: string;
  snapshot: Partial<Question>;
}

export interface QuestionAttachment {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'document';
  url: string;
  size?: string;
}

export interface Question {
  id: string;
  code: string; // e.g., "TKAD-VER-001"
  type: QuestionType;
  status: QuestionStatus;
  subtest: string; // e.g., "Penalaran Verbal", "Penalaran Kuantitatif", "Penalaran Logis", "Penalaran Figural"
  topic: string; // e.g., "Silogisme", "Aritmatika Sosial", "Deret Angka", "Analogi Kata"
  difficulty: DifficultyLevel;
  tags: string[];
  defaultScore: number;
  
  // Content
  prompt: string; // Teks soal, supports LaTeX formulas like $x^2$ or $$\frac{a}{b}$$
  explanation: string; // Pembahasan soal
  attachments: QuestionAttachment[];
  
  // Specific Type Answers
  options?: ChoiceOption[]; // for pilihan_ganda & pilihan_ganda_kompleks
  matchingPairs?: MatchingPair[]; // for menjodohkan
  trueFalseItems?: TrueFalseItem[]; // for benar_salah
  shortAnswerKey?: string; // for isian_singkat
  essayRubric?: string; // for esai

  // Ownership & Dates
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  version: string; // e.g. "1.0"
  
  // Review & History
  reviews: ReviewRecord[];
  versions: QuestionVersion[];
}

export type AppTab =
  | 'dashboard'
  | 'bank_soal'
  | 'buat_soal'
  | 'antrian_review'
  | 'audit_log'
  | 'manajemen_pengguna'
  | 'pengaturan'
  | 'gas_sync';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_QUESTION'
    | 'UPDATE_QUESTION'
    | 'SUBMIT_REVIEW'
    | 'APPROVE'
    | 'REJECT'
    | 'REQUEST_CHANGES'
    | 'RECALL'
    | 'DUPLICATE'
    | 'CONFIG_CHANGE'
    | 'CREATE_USER'
    | 'UPDATE_USER'
    | 'DELETE_USER';
  questionId?: string;
  questionCode?: string;
  description: string;
  details?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
  };
}

export interface AppNotification {
  id: string;
  timestamp: string;
  userId: string; // Target recipient or 'all'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  questionId?: string;
  linkAction?: string;
}

export interface CategoryMetadata {
  id: string;
  name: string; // Subtest name
  description: string;
  topics: string[];
}
