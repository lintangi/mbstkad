import { Question, User, CategoryMetadata, AuditLog } from '../types';

export interface JSONDatabaseSchema {
  system: string;
  version: string;
  exportedAt: string;
  metadata: {
    totalQuestions: number;
    totalUsers: number;
    totalCategories: number;
    totalAuditLogs: number;
    schemaVersion: string;
  };
  data: {
    categories: CategoryMetadata[];
    users: User[];
    questions: Question[];
    auditLogs: AuditLog[];
  };
}

/**
 * Escapes strings safely for SQL queries based on dialect
 */
function escapeSqlString(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * Generates comprehensive, production-grade SQL DDL and DML scripts
 */
export function generateSQLScript(
  questions: Question[],
  users: User[],
  categories: CategoryMetadata[],
  auditLogs: AuditLog[],
  dialect: 'postgres' | 'mysql' | 'sqlite' = 'postgres'
): string {
  const now = new Date().toISOString();
  let sql = '';

  sql += `-- =====================================================================\n`;
  sql += `-- SISTEM MANAJEMEN BANK SOAL TKAD-ADIWERNA - SQL DATABASE DUMP\n`;
  sql += `-- Target Dialect: ${dialect.toUpperCase()}\n`;
  sql += `-- Generated At: ${now}\n`;
  sql += `-- Total Soal: ${questions.length} | Pengguna: ${users.length} | Kategori: ${categories.length} | Logs: ${auditLogs.length}\n`;
  sql += `-- =====================================================================\n\n`;

  if (dialect === 'postgres') {
    sql += `-- [PostgreSQL Configuration]\n`;
    sql += `SET client_encoding = 'UTF8';\n`;
    sql += `SET standard_conforming_strings = on;\n\n`;
  } else if (dialect === 'mysql') {
    sql += `-- [MySQL / MariaDB Configuration]\n`;
    sql += `SET NAMES utf8mb4;\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
  } else {
    sql += `-- [SQLite Configuration]\n`;
    sql += `PRAGMA foreign_keys = ON;\n\n`;
  }

  // TABLE 1: USERS
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- Table Structure for: tb_users\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  if (dialect === 'postgres') {
    sql += `CREATE TABLE IF NOT EXISTS tb_users (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  email VARCHAR(255) UNIQUE NOT NULL,\n`;
    sql += `  role VARCHAR(32) NOT NULL CHECK (role IN ('pembuat', 'reviewer', 'admin')),\n`;
    sql += `  department VARCHAR(255),\n`;
    sql += `  avatar VARCHAR(32),\n`;
    sql += `  password_hash VARCHAR(255),\n`;
    sql += `  status VARCHAR(32) DEFAULT 'aktif',\n`;
    sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;
  } else if (dialect === 'mysql') {
    sql += `CREATE TABLE IF NOT EXISTS tb_users (\n`;
    sql += `  id VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  email VARCHAR(255) NOT NULL UNIQUE,\n`;
    sql += `  role ENUM('pembuat', 'reviewer', 'admin') NOT NULL,\n`;
    sql += `  department VARCHAR(255) NULL,\n`;
    sql += `  avatar VARCHAR(32) NULL,\n`;
    sql += `  password_hash VARCHAR(255) NULL,\n`;
    sql += `  status VARCHAR(32) DEFAULT 'aktif',\n`;
    sql += `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  } else {
    sql += `CREATE TABLE IF NOT EXISTS tb_users (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  email TEXT NOT NULL UNIQUE,\n`;
    sql += `  role TEXT NOT NULL,\n`;
    sql += `  department TEXT,\n`;
    sql += `  avatar TEXT,\n`;
    sql += `  password_hash TEXT,\n`;
    sql += `  status TEXT DEFAULT 'aktif',\n`;
    sql += `  created_at TEXT\n`;
    sql += `);\n\n`;
  }

  // TABLE 2: CATEGORIES
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- Table Structure for: tb_categories\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  if (dialect === 'postgres') {
    sql += `CREATE TABLE IF NOT EXISTS tb_categories (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  name VARCHAR(128) NOT NULL,\n`;
    sql += `  description TEXT,\n`;
    sql += `  topics JSONB DEFAULT '[]'::jsonb\n`;
    sql += `);\n\n`;
  } else if (dialect === 'mysql') {
    sql += `CREATE TABLE IF NOT EXISTS tb_categories (\n`;
    sql += `  id VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
    sql += `  name VARCHAR(128) NOT NULL,\n`;
    sql += `  description TEXT NULL,\n`;
    sql += `  topics JSON NULL\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  } else {
    sql += `CREATE TABLE IF NOT EXISTS tb_categories (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  description TEXT,\n`;
    sql += `  topics TEXT\n`;
    sql += `);\n\n`;
  }

  // TABLE 3: QUESTIONS
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- Table Structure for: tb_questions\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  if (dialect === 'postgres') {
    sql += `CREATE TABLE IF NOT EXISTS tb_questions (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  code VARCHAR(64) UNIQUE NOT NULL,\n`;
    sql += `  type VARCHAR(32) NOT NULL,\n`;
    sql += `  status VARCHAR(32) NOT NULL,\n`;
    sql += `  subtest VARCHAR(128) NOT NULL,\n`;
    sql += `  topic VARCHAR(128) NOT NULL,\n`;
    sql += `  difficulty VARCHAR(32) NOT NULL,\n`;
    sql += `  default_score NUMERIC(5,2) DEFAULT 1.00,\n`;
    sql += `  prompt TEXT NOT NULL,\n`;
    sql += `  explanation TEXT,\n`;
    sql += `  options JSONB,\n`;
    sql += `  matching_pairs JSONB,\n`;
    sql += `  true_false_items JSONB,\n`;
    sql += `  short_answer_key TEXT,\n`;
    sql += `  essay_rubric TEXT,\n`;
    sql += `  tags JSONB DEFAULT '[]'::jsonb,\n`;
    sql += `  attachments JSONB DEFAULT '[]'::jsonb,\n`;
    sql += `  created_by_id VARCHAR(64) REFERENCES tb_users(id) ON DELETE SET NULL,\n`;
    sql += `  created_by_name VARCHAR(255),\n`;
    sql += `  version VARCHAR(16) DEFAULT '1.0',\n`;
    sql += `  reviews JSONB DEFAULT '[]'::jsonb,\n`;
    sql += `  versions JSONB DEFAULT '[]'::jsonb,\n`;
    sql += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n`;
    sql += `CREATE INDEX IF NOT EXISTS idx_questions_subtest ON tb_questions(subtest);\n`;
    sql += `CREATE INDEX IF NOT EXISTS idx_questions_status ON tb_questions(status);\n`;
    sql += `CREATE INDEX IF NOT EXISTS idx_questions_type ON tb_questions(type);\n\n`;
  } else if (dialect === 'mysql') {
    sql += `CREATE TABLE IF NOT EXISTS tb_questions (\n`;
    sql += `  id VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
    sql += `  code VARCHAR(64) NOT NULL UNIQUE,\n`;
    sql += `  type VARCHAR(32) NOT NULL,\n`;
    sql += `  status VARCHAR(32) NOT NULL,\n`;
    sql += `  subtest VARCHAR(128) NOT NULL,\n`;
    sql += `  topic VARCHAR(128) NOT NULL,\n`;
    sql += `  difficulty VARCHAR(32) NOT NULL,\n`;
    sql += `  default_score DECIMAL(5,2) DEFAULT 1.00,\n`;
    sql += `  prompt LONGTEXT NOT NULL,\n`;
    sql += `  explanation LONGTEXT NULL,\n`;
    sql += `  options JSON NULL,\n`;
    sql += `  matching_pairs JSON NULL,\n`;
    sql += `  true_false_items JSON NULL,\n`;
    sql += `  short_answer_key TEXT NULL,\n`;
    sql += `  essay_rubric TEXT NULL,\n`;
    sql += `  tags JSON NULL,\n`;
    sql += `  attachments JSON NULL,\n`;
    sql += `  created_by_id VARCHAR(64) NULL,\n`;
    sql += `  created_by_name VARCHAR(255) NULL,\n`;
    sql += `  version VARCHAR(16) DEFAULT '1.0',\n`;
    sql += `  reviews JSON NULL,\n`;
    sql += `  versions JSON NULL,\n`;
    sql += `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
    sql += `  INDEX idx_questions_subtest (subtest),\n`;
    sql += `  INDEX idx_questions_status (status)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  } else {
    sql += `CREATE TABLE IF NOT EXISTS tb_questions (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  code TEXT NOT NULL UNIQUE,\n`;
    sql += `  type TEXT NOT NULL,\n`;
    sql += `  status TEXT NOT NULL,\n`;
    sql += `  subtest TEXT NOT NULL,\n`;
    sql += `  topic TEXT NOT NULL,\n`;
    sql += `  difficulty TEXT NOT NULL,\n`;
    sql += `  default_score REAL DEFAULT 1.0,\n`;
    sql += `  prompt TEXT NOT NULL,\n`;
    sql += `  explanation TEXT,\n`;
    sql += `  options TEXT,\n`;
    sql += `  matching_pairs TEXT,\n`;
    sql += `  true_false_items TEXT,\n`;
    sql += `  short_answer_key TEXT,\n`;
    sql += `  essay_rubric TEXT,\n`;
    sql += `  tags TEXT,\n`;
    sql += `  attachments TEXT,\n`;
    sql += `  created_by_id TEXT,\n`;
    sql += `  created_by_name TEXT,\n`;
    sql += `  version TEXT DEFAULT '1.0',\n`;
    sql += `  reviews TEXT,\n`;
    sql += `  versions TEXT,\n`;
    sql += `  created_at TEXT,\n`;
    sql += `  updated_at TEXT\n`;
    sql += `);\n`;
    sql += `CREATE INDEX IF NOT EXISTS idx_questions_subtest ON tb_questions(subtest);\n`;
    sql += `CREATE INDEX IF NOT EXISTS idx_questions_status ON tb_questions(status);\n\n`;
  }

  // TABLE 4: AUDIT LOGS
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- Table Structure for: tb_audit_logs\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  if (dialect === 'postgres') {
    sql += `CREATE TABLE IF NOT EXISTS tb_audit_logs (\n`;
    sql += `  id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  user_id VARCHAR(64),\n`;
    sql += `  user_name VARCHAR(255),\n`;
    sql += `  user_role VARCHAR(32),\n`;
    sql += `  action VARCHAR(64) NOT NULL,\n`;
    sql += `  question_id VARCHAR(64),\n`;
    sql += `  question_code VARCHAR(64),\n`;
    sql += `  details TEXT,\n`;
    sql += `  description TEXT\n`;
    sql += `);\n`;
    sql += `CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON tb_audit_logs(timestamp);\n\n`;
  } else if (dialect === 'mysql') {
    sql += `CREATE TABLE IF NOT EXISTS tb_audit_logs (\n`;
    sql += `  id VARCHAR(64) NOT NULL PRIMARY KEY,\n`;
    sql += `  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  user_id VARCHAR(64) NULL,\n`;
    sql += `  user_name VARCHAR(255) NULL,\n`;
    sql += `  user_role VARCHAR(32) NULL,\n`;
    sql += `  action VARCHAR(64) NOT NULL,\n`;
    sql += `  question_id VARCHAR(64) NULL,\n`;
    sql += `  question_code VARCHAR(64) NULL,\n`;
    sql += `  details TEXT NULL,\n`;
    sql += `  description TEXT NULL,\n`;
    sql += `  INDEX idx_audit_timestamp (timestamp)\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  } else {
    sql += `CREATE TABLE IF NOT EXISTS tb_audit_logs (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  timestamp TEXT,\n`;
    sql += `  user_id TEXT,\n`;
    sql += `  user_name TEXT,\n`;
    sql += `  user_role TEXT,\n`;
    sql += `  action TEXT NOT NULL,\n`;
    sql += `  question_id TEXT,\n`;
    sql += `  question_code TEXT,\n`;
    sql += `  details TEXT,\n`;
    sql += `  description TEXT\n`;
    sql += `);\n\n`;
  }

  // INSERTS - USERS
  if (users.length > 0) {
    sql += `-- ---------------------------------------------------------------------\n`;
    sql += `-- Dumping Data for: tb_users (${users.length} records)\n`;
    sql += `-- ---------------------------------------------------------------------\n`;
    users.forEach((u) => {
      sql += `INSERT INTO tb_users (id, name, email, role, department, avatar, password_hash, status, created_at) VALUES (\n`;
      sql += `  ${escapeSqlString(u.id)},\n`;
      sql += `  ${escapeSqlString(u.name)},\n`;
      sql += `  ${escapeSqlString(u.email)},\n`;
      sql += `  ${escapeSqlString(u.role)},\n`;
      sql += `  ${escapeSqlString(u.department || '')},\n`;
      sql += `  ${escapeSqlString(u.avatar || '')},\n`;
      sql += `  ${escapeSqlString(u.password || '')},\n`;
      sql += `  ${escapeSqlString(u.status || 'aktif')},\n`;
      sql += `  ${escapeSqlString(u.createdAt || now)}\n`;
      sql += `);\n`;
    });
    sql += `\n`;
  }

  // INSERTS - CATEGORIES
  if (categories.length > 0) {
    sql += `-- ---------------------------------------------------------------------\n`;
    sql += `-- Dumping Data for: tb_categories (${categories.length} records)\n`;
    sql += `-- ---------------------------------------------------------------------\n`;
    categories.forEach((c) => {
      sql += `INSERT INTO tb_categories (id, name, description, topics) VALUES (\n`;
      sql += `  ${escapeSqlString(c.id)},\n`;
      sql += `  ${escapeSqlString(c.name)},\n`;
      sql += `  ${escapeSqlString(c.description)},\n`;
      sql += `  ${escapeSqlString(JSON.stringify(c.topics || []))}\n`;
      sql += `);\n`;
    });
    sql += `\n`;
  }

  // INSERTS - QUESTIONS
  if (questions.length > 0) {
    sql += `-- ---------------------------------------------------------------------\n`;
    sql += `-- Dumping Data for: tb_questions (${questions.length} records)\n`;
    sql += `-- ---------------------------------------------------------------------\n`;
    questions.forEach((q) => {
      sql += `INSERT INTO tb_questions (\n`;
      sql += `  id, code, type, status, subtest, topic, difficulty, default_score,\n`;
      sql += `  prompt, explanation, options, matching_pairs, true_false_items,\n`;
      sql += `  short_answer_key, essay_rubric, tags, attachments, created_by_id,\n`;
      sql += `  created_by_name, version, reviews, versions, created_at, updated_at\n`;
      sql += `) VALUES (\n`;
      sql += `  ${escapeSqlString(q.id)},\n`;
      sql += `  ${escapeSqlString(q.code)},\n`;
      sql += `  ${escapeSqlString(q.type)},\n`;
      sql += `  ${escapeSqlString(q.status)},\n`;
      sql += `  ${escapeSqlString(q.subtest)},\n`;
      sql += `  ${escapeSqlString(q.topic)},\n`;
      sql += `  ${escapeSqlString(q.difficulty)},\n`;
      sql += `  ${q.defaultScore || 1.0},\n`;
      sql += `  ${escapeSqlString(q.prompt)},\n`;
      sql += `  ${escapeSqlString(q.explanation || '')},\n`;
      sql += `  ${q.options ? escapeSqlString(JSON.stringify(q.options)) : 'NULL'},\n`;
      sql += `  ${q.matchingPairs ? escapeSqlString(JSON.stringify(q.matchingPairs)) : 'NULL'},\n`;
      sql += `  ${q.trueFalseItems ? escapeSqlString(JSON.stringify(q.trueFalseItems)) : 'NULL'},\n`;
      sql += `  ${escapeSqlString(q.shortAnswerKey || '')},\n`;
      sql += `  ${escapeSqlString(q.essayRubric || '')},\n`;
      sql += `  ${escapeSqlString(JSON.stringify(q.tags || []))},\n`;
      sql += `  ${escapeSqlString(JSON.stringify(q.attachments || []))},\n`;
      sql += `  ${escapeSqlString(q.createdById || '')},\n`;
      sql += `  ${escapeSqlString(q.createdByName || '')},\n`;
      sql += `  ${escapeSqlString(q.version || '1.0')},\n`;
      sql += `  ${escapeSqlString(JSON.stringify(q.reviews || []))},\n`;
      sql += `  ${escapeSqlString(JSON.stringify(q.versions || []))},\n`;
      sql += `  ${escapeSqlString(q.createdAt || now)},\n`;
      sql += `  ${escapeSqlString(q.updatedAt || now)}\n`;
      sql += `);\n`;
    });
    sql += `\n`;
  }

  // INSERTS - AUDIT LOGS
  if (auditLogs.length > 0) {
    sql += `-- ---------------------------------------------------------------------\n`;
    sql += `-- Dumping Data for: tb_audit_logs (${Math.min(auditLogs.length, 100)} records)\n`;
    sql += `-- ---------------------------------------------------------------------\n`;
    auditLogs.slice(0, 100).forEach((l) => {
      sql += `INSERT INTO tb_audit_logs (id, timestamp, user_id, user_name, user_role, action, question_id, question_code, details, description) VALUES (\n`;
      sql += `  ${escapeSqlString(l.id)},\n`;
      sql += `  ${escapeSqlString(l.timestamp || now)},\n`;
      sql += `  ${escapeSqlString(l.userId || '')},\n`;
      sql += `  ${escapeSqlString(l.userName || '')},\n`;
      sql += `  ${escapeSqlString(l.userRole || '')},\n`;
      sql += `  ${escapeSqlString(l.action)},\n`;
      sql += `  ${escapeSqlString(l.questionId || '')},\n`;
      sql += `  ${escapeSqlString(l.questionCode || '')},\n`;
      sql += `  ${escapeSqlString(typeof l.details === 'object' ? JSON.stringify(l.details) : (l.details || ''))},\n`;
      sql += `  ${escapeSqlString(l.description || '')}\n`;
      sql += `);\n`;
    });
    sql += `\n`;
  }

  if (dialect === 'mysql') {
    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  }
  sql += `-- End of SQL Dump\n`;

  return sql;
}

/**
 * Generates formatted JSON database representation
 */
export function generateJSONDatabase(
  questions: Question[],
  users: User[],
  categories: CategoryMetadata[],
  auditLogs: AuditLog[]
): JSONDatabaseSchema {
  return {
    system: 'TKAD-Adiwerna Bank Soal Database Engine',
    version: '2.5.0-JSON-SQL',
    exportedAt: new Date().toISOString(),
    metadata: {
      totalQuestions: questions.length,
      totalUsers: users.length,
      totalCategories: categories.length,
      totalAuditLogs: auditLogs.length,
      schemaVersion: 'v3-relational-json',
    },
    data: {
      categories,
      users,
      questions,
      auditLogs,
    },
  };
}

/**
 * Validates and parses uploaded JSON database backup
 */
export function validateAndParseJSONDatabase(rawJson: string): {
  valid: boolean;
  message: string;
  data?: {
    questions: Question[];
    users: User[];
    categories: CategoryMetadata[];
    auditLogs: AuditLog[];
  };
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed) {
      return { valid: false, message: 'File JSON kosong atau tidak valid.' };
    }

    // Format A: { data: { questions: [...], users: [...] } }
    if (parsed.data && Array.isArray(parsed.data.questions)) {
      return {
        valid: true,
        message: `Valid: Berhasil memuat ${parsed.data.questions.length} butir soal, ${parsed.data.users?.length || 0} pengguna.`,
        data: {
          questions: parsed.data.questions,
          users: parsed.data.users || [],
          categories: parsed.data.categories || [],
          auditLogs: parsed.data.auditLogs || [],
        },
      };
    }

    // Format B: Array of questions directly [...]
    if (Array.isArray(parsed)) {
      return {
        valid: true,
        message: `Valid: Berhasil memuat array dengan ${parsed.length} butir soal.`,
        data: {
          questions: parsed,
          users: [],
          categories: [],
          auditLogs: [],
        },
      };
    }

    // Format C: Flat object { questions: [...], users: [...] }
    if (Array.isArray(parsed.questions)) {
      return {
        valid: true,
        message: `Valid: Berhasil memuat ${parsed.questions.length} butir soal.`,
        data: {
          questions: parsed.questions,
          users: parsed.users || [],
          categories: parsed.categories || [],
          auditLogs: parsed.auditLogs || [],
        },
      };
    }

    return {
      valid: false,
      message: 'Format struktur JSON tidak sesuai dengan skema database Bank Soal TKAD.',
    };
  } catch (err: any) {
    return {
      valid: false,
      message: `Gagal membaca file JSON: ${err.message || err}`,
    };
  }
}
