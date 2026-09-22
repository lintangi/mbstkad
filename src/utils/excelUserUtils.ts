import * as XLSX from 'xlsx';
import { User, UserRole } from '../types';

export interface ParsedUserRow {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  password?: string;
  status: 'aktif' | 'nonaktif';
}

export interface ParseExcelResult {
  validUsers: ParsedUserRow[];
  errors: string[];
  totalRows: number;
}

/**
 * Generates and downloads an official Excel template (.xlsx) for user management import
 */
export function downloadUserExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Template Data with Header and Guideline Examples
  const wsData = [
    [
      'Nama Lengkap',
      'Alamat Email',
      'Peran (Role)',
      'Departemen / Mata Pelajaran',
      'Kata Sandi Default',
      'Status (aktif/nonaktif)',
    ],
    [
      'Contoh: Budi Santoso, M.Pd.',
      'budisantoso@tkad.adiwerna',
      'pembuat',
      'Matematika',
      'password123',
      'aktif',
    ],
    [
      'Contoh: Siti Rahmawati, S.Pd.',
      'sitirahma@tkad.adiwerna',
      'reviewer',
      'Bahasa Indonesia',
      'password123',
      'aktif',
    ],
    [
      'Contoh: Ahmad Hidayat, M.Si.',
      'ahmadhidayat@tkad.adiwerna',
      'pembuat',
      'IPAS',
      'password123',
      'aktif',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Nama
    { wch: 32 }, // Email
    { wch: 18 }, // Peran
    { wch: 28 }, // Departemen
    { wch: 20 }, // Password
    { wch: 22 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template_Pengguna');

  // Sheet 2: Petunjuk Pengisian
  const instructionsData = [
    ['PANDUAN PENGISIAN TEMPLATE PENGGUNA TKAD ADIWERNA'],
    [''],
    ['1. Kolom Nama Lengkap: Wajib diisi nama dan gelar pendidik/staf.'],
    ['2. Kolom Alamat Email: Wajib diisi format email unik (contoh: nama@tkad.adiwerna).'],
    ['3. Kolom Peran (Role): Pilih salah satu dari [pembuat, reviewer, admin].'],
    ['   - pembuat : Tenaga pendidik penyusun butir soal.'],
    ['   - reviewer: Penjamin mutu peninjau butir soal.'],
    ['   - admin   : Administrator pengelola pusat bank soal & sistem.'],
    ['4. Kolom Departemen / Mata Pelajaran: Diisi [Bahasa Indonesia, Matematika, IPAS] atau unit penugasan.'],
    ['5. Kolom Kata Sandi Default: Jika kosong, sistem otomatis mengatur "password123".'],
    ['6. Kolom Status: Diisi "aktif" atau "nonaktif".'],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInst['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Petunjuk_Pengisian');

  // Trigger file download
  XLSX.writeFile(wb, `Template_Impor_Pengguna_TKAD_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports the current list of users to an Excel (.xlsx) workbook
 */
export function exportUsersToExcel(users: User[]): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    'ID Pengguna',
    'Nama Lengkap',
    'Alamat Email',
    'Peran (Role)',
    'Departemen / Mata Pelajaran',
    'Status Akun',
    'Status Sandi Default',
    'Tanggal Registrasi',
  ];

  const rows = users.map((u) => [
    u.id,
    u.name,
    u.email,
    u.role,
    u.department || 'Unit Akademik TKAD',
    u.status || 'aktif',
    u.isDefaultPassword ? 'Default (Perlu Ganti)' : 'Kustom (Aman)',
    u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 32 },
    { wch: 32 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daftar_Pengguna');
  XLSX.writeFile(wb, `Data_Pengguna_TKAD_Adiwerna_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file containing user data
 */
export async function parseUserExcelFile(file: File): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Use first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          resolve({ validUsers: [], errors: ['Lembar kerja Excel kosong atau tidak terbaca.'], totalRows: 0 });
          return;
        }

        // Convert to array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawJson.length <= 1) {
          resolve({ validUsers: [], errors: ['File Excel tidak memiliki baris data (hanya header atau kosong).'], totalRows: 0 });
          return;
        }

        const validUsers: ParsedUserRow[] = [];
        const errors: string[] = [];
        const seenEmails = new Set<string>();

        // Skip row 0 (headers)
        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          // Check if row is just an empty array
          const hasContent = row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '');
          if (!hasContent) continue;

          const rawName = String(row[0] || '').trim();
          const rawEmail = String(row[1] || '').trim().toLowerCase();
          const rawRole = String(row[2] || '').trim().toLowerCase();
          const rawDept = String(row[3] || '').trim();
          const rawPass = String(row[4] || '').trim();
          const rawStatus = String(row[5] || '').trim().toLowerCase();

          // Skip example rows
          if (rawName.toLowerCase().startsWith('contoh:') || rawEmail.includes('contoh@')) {
            continue;
          }

          if (!rawName) {
            errors.push(`Baris ${i + 1}: Nama Lengkap wajib diisi.`);
            continue;
          }

          if (!rawEmail || !rawEmail.includes('@')) {
            errors.push(`Baris ${i + 1} (${rawName}): Format email tidak valid (${rawEmail || 'kosong'}).`);
            continue;
          }

          if (seenEmails.has(rawEmail)) {
            errors.push(`Baris ${i + 1}: Email duplikat ditemukan dalam file (${rawEmail}).`);
            continue;
          }
          seenEmails.add(rawEmail);

          let role: UserRole = 'pembuat';
          if (rawRole.includes('admin')) {
            role = 'admin';
          } else if (rawRole.includes('review')) {
            role = 'reviewer';
          } else if (rawRole.includes('pembuat') || rawRole.includes('penyusun') || rawRole.includes('guru') || rawRole.includes('creator')) {
            role = 'pembuat';
          } else {
            role = 'pembuat';
          }

          let status: 'aktif' | 'nonaktif' = 'aktif';
          if (rawStatus.includes('non') || rawStatus.includes('inaktif') || rawStatus.includes('false')) {
            status = 'nonaktif';
          }

          validUsers.push({
            name: rawName,
            email: rawEmail,
            role,
            department: rawDept || 'Unit Akademik TKAD',
            password: rawPass || 'password123',
            status,
          });
        }

        resolve({
          validUsers,
          errors,
          totalRows: validUsers.length,
        });
      } catch (err: any) {
        reject(new Error(`Gagal memproses berkas Excel: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas file Excel.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
