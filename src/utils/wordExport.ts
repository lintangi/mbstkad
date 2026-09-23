import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  ImageRun,
  ExternalHyperlink,
} from 'docx';
import { saveAs } from 'file-saver';
import { Question } from '../types';
import { normalizeGoogleDriveImageUrl, getDriveImageFallbackUrls } from './googleDriveUtils';

/**
 * Helper to convert an image URL (Base64 data URI, HTTP URL, or local upload) into a Uint8Array
 * for docx ImageRun embedding.
 */
async function fetchImageAsUint8Array(
  url: string
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  if (!url) return null;
  const fallbacks = getDriveImageFallbackUrls(url);

  for (const targetUrl of fallbacks) {
    try {
      if (targetUrl.startsWith('data:')) {
        const parts = targetUrl.split(',');
        if (parts.length >= 2) {
          const base64Str = parts[1];
          const binaryStr = atob(base64Str);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          return { data: bytes, width: 380, height: 220 };
        }
      }

      const res = await fetch(targetUrl, { method: 'GET' });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (bytes.length > 0) {
          return { data: bytes, width: 380, height: 220 };
        }
      }
    } catch {
      // try next fallback URL
    }
  }

  console.warn('Unable to download image for Word embedding after trying fallbacks:', url);
  return null;
}

export interface PacketExportInfo {
  id: string;
  code: string;
  title: string;
  targetClass?: string;
  academicYear?: string;
  subtest?: string;
  description?: string;
  questionIds?: string[];
}

export interface WordExportConfig {
  documentTitle: string;
  institutionName: string;
  academicYear: string;
  targetClass?: string;
  packetFilter: string; // 'all' or packetId
  packetInfo?: PacketExportInfo;
  packetQuestionIds?: string[];
  subtestFilter: string; // 'all' or specific subtest name
  statusFilter: string; // 'all' or 'disetujui' etc.
  difficultyFilter: string;
  includeAnswerKey: boolean;
  answerKeyMode: 'inline' | 'end_section' | 'none';
  includeMatrixTable?: boolean; // Tabel Matriks Kisi-Kisi Soal (Overview Table)
  includeItemDetailTable?: boolean; // Tabel Detail Spesifikasi per Butir Soal (Per-Item Table)
  timeLimitMinutes?: number;
  generalInstructions?: string;
}

/**
 * Strips raw HTML or markdown tags to clean plain text for Word runs
 */
function cleanTextForWord(text?: string | null): string {
  if (!text) return '-';
  return text
    .replace(/<[^>]*>/g, '') // remove html tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim() || '-';
}

/**
 * Formats question type into friendly Indonesian name
 */
export function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'pilihan_ganda':
      return 'Pilihan Ganda';
    case 'pilihan_ganda_kompleks':
      return 'Pilihan Ganda Kompleks';
    case 'benar_salah':
      return 'Benar / Salah';
    case 'menjodohkan':
      return 'Menjodohkan';
    case 'isian_singkat':
      return 'Isian Singkat';
    case 'esai':
      return 'Uraian / Esai';
    default:
      return type || 'Pilihan Ganda';
  }
}

/**
 * Generates an authentic Microsoft Word (.docx) document and triggers download
 */
export async function exportQuestionsToWord(
  allQuestions: Question[],
  config: WordExportConfig
): Promise<{ success: boolean; totalExported: number; fileName: string }> {
  // 1. Filter questions based on configuration
  const filtered = allQuestions.filter((q) => {
    // Filter by packet if specified
    if (config.packetFilter && config.packetFilter !== 'all') {
      const matchPacket =
        (q.packetIds && q.packetIds.includes(config.packetFilter)) ||
        (config.packetQuestionIds && config.packetQuestionIds.includes(q.id));
      if (!matchPacket) return false;
    }
    if (config.subtestFilter !== 'all' && q.subtest !== config.subtestFilter) {
      return false;
    }
    if (config.statusFilter !== 'all' && q.status !== config.statusFilter) {
      return false;
    }
    if (config.difficultyFilter !== 'all' && q.difficulty !== config.difficultyFilter) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    throw new Error(
      `Tidak ditemukan butir soal yang sesuai dengan kriteria filter yang dipilih.`
    );
  }

  const docChildren: any[] = [];

  // 2. KOP DOKUMEN / HEADER TABLE
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.DOUBLE, size: 24, color: '1e293b' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: (config.institutionName || 'BANK SOAL ASESMEN KOMPETENSI TKAD-ADIWERNA').toUpperCase(),
                    bold: true,
                    size: 26, // 13pt
                    font: 'Calibri',
                    color: '0f172a',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: (config.documentTitle || 'NASKAH BUTIR SOAL ASESMEN KOMPETENSI').toUpperCase(),
                    bold: true,
                    size: 24, // 12pt
                    font: 'Calibri',
                    color: '1e40af',
                  }),
                ],
              }),
              config.packetInfo
                ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 60 },
                    children: [
                      new TextRun({
                        text: `PAKET SOAL: [${config.packetInfo.code}] ${config.packetInfo.title}`.toUpperCase(),
                        bold: true,
                        size: 20, // 10pt
                        font: 'Calibri',
                        color: '475569',
                      }),
                    ],
                  })
                : new Paragraph({ spacing: { after: 0 }, children: [] }),
            ],
          }),
        ],
      }),
    ],
  });

  docChildren.push(headerTable);
  docChildren.push(new Paragraph({ spacing: { after: 120 } }));

  // 3. METADATA IDENTITAS NASKAH & JADWAL
  const subtestLabel = config.subtestFilter === 'all' ? 'Semua Mata Pelajaran / Subtes' : config.subtestFilter;
  const packetDisplay = config.packetInfo ? `[${config.packetInfo.code}] ${config.packetInfo.title}` : 'Seluruh Bank Soal';
  const targetClassDisplay = config.targetClass || (config.packetInfo ? config.packetInfo.targetClass : '') || 'Semua Kelas';

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({ text: 'Mata Pelajaran / Subtes : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: subtestLabel, size: 20, font: 'Calibri' }),
                ],
              }),
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({ text: 'Paket Soal Terpilih     : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: packetDisplay, size: 20, font: 'Calibri', color: config.packetInfo ? '1e40af' : '334155' }),
                ],
              }),
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({ text: 'Tingkat / Kelas Target  : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: targetClassDisplay, size: 20, font: 'Calibri' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({ text: 'Tahun Ajaran / Sesi   : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: config.academicYear || '2025/2026', size: 20, font: 'Calibri' }),
                ],
              }),
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({ text: 'Jumlah Butir Soal     : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: `${filtered.length} Soal`, bold: true, color: '1e40af', size: 20, font: 'Calibri' }),
                ],
              }),
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({ text: 'Waktu Pengerjaan      : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({
                    text: config.timeLimitMinutes ? `${config.timeLimitMinutes} Menit` : 'Sesuai Jadwal Asesmen',
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  docChildren.push(metaTable);
  docChildren.push(new Paragraph({ spacing: { after: 140 } }));

  // 4. TABEL MATRIKS SPESIFIKASI & KISI-KISI NASKAH SOAL (OVERVIEW MATRIX TABLE)
  if (config.includeMatrixTable !== false) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({
            text: 'TABEL MATRIKS SPESIFIKASI & KISI-KISI BUTIR SOAL',
            bold: true,
            size: 22,
            font: 'Calibri',
            color: '1e40af',
          }),
        ],
      })
    );

    // Matrix Header Row
    const matrixHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: 'No.', bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: 'Elemen / Materi', bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: 'Sub-elemen / Submateri', bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: 'Kompetensi (Indikator Soal)', bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: 'Level Kognitif', bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: '1E3A8A' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: 'Bentuk Soal', bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })],
            }),
          ],
        }),
      ],
    });

    const matrixDataRows = filtered.map((q, idx) => {
      const isEven = idx % 2 === 1;
      const rowBg = isEven ? 'F8FAFC' : 'FFFFFF';

      return new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            shading: { fill: rowBg },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: `${idx + 1}`, bold: true, size: 17, font: 'Calibri' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: rowBg },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: cleanTextForWord(q.element || q.topic || 'Umum'),
                    size: 17,
                    font: 'Calibri',
                    bold: true,
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: rowBg },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: cleanTextForWord(q.subElement || '-'),
                    size: 17,
                    font: 'Calibri',
                    color: '334155',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: rowBg },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: cleanTextForWord(q.competency || '-'),
                    size: 17,
                    font: 'Calibri',
                    color: '334155',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: rowBg },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: cleanTextForWord(q.cognitiveLevel || '-'),
                    size: 17,
                    font: 'Calibri',
                    bold: true,
                    color: '0369A1',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: rowBg },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: getQuestionTypeLabel(q.type),
                    size: 17,
                    font: 'Calibri',
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });

    const fullMatrixTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [matrixHeaderRow, ...matrixDataRows],
    });

    docChildren.push(fullMatrixTable);
    docChildren.push(new Paragraph({ spacing: { after: 180 } }));
  }

  // 5. PETUNJUK PENGERJAAN UMUM
  if (config.generalInstructions) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PETUNJUK UMUM PENGERJAAN ASESMEN:',
            bold: true,
            size: 20,
            font: 'Calibri',
            color: '334155',
          }),
        ],
      })
    );
    docChildren.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: config.generalInstructions,
            italics: true,
            size: 19,
            font: 'Calibri',
            color: '475569',
          }),
        ],
      })
    );
  }

  // Section divider before Question Items
  docChildren.push(
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: 'DAFTAR NASKAH BUTIR SOAL UJIAN',
          bold: true,
          size: 22,
          font: 'Calibri',
          color: '1E40AF',
        }),
      ],
    })
  );

  // 6. LOOP QUESTIONS WITH SPECIFICATION TABLE & PROMPT
  for (let idx = 0; idx < filtered.length; idx++) {
    const q = filtered[idx];
    const questionNumber = idx + 1;
    const cleanPrompt = cleanTextForWord(q.prompt);

    // Detail Specification Table for each question item (6 required elements in Table format)
    if (config.includeItemDetailTable !== false) {
      const itemDetailTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: 'F1F5F9' },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({ text: '1. Nomor Soal', bold: true, size: 17, font: 'Calibri', color: '1E293B' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: `Soal No. ${questionNumber} (${q.code})`,
                        bold: true,
                        size: 17,
                        font: 'Calibri',
                        color: '1E40AF',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: 'F1F5F9' },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({ text: '6. Bentuk Soal', bold: true, size: 17, font: 'Calibri', color: '1E293B' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({ text: getQuestionTypeLabel(q.type), size: 17, font: 'Calibri', color: '334155' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: 'F8FAFC' },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({ text: '2. Elemen / Materi', bold: true, size: 17, font: 'Calibri', color: '1E293B' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: cleanTextForWord(q.element || q.topic || 'Umum'),
                        size: 17,
                        font: 'Calibri',
                        color: '334155',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: 'F8FAFC' },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: '3. Sub-elemen / Submateri',
                        bold: true,
                        size: 17,
                        font: 'Calibri',
                        color: '1E293B',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: cleanTextForWord(q.subElement || '-'),
                        size: 17,
                        font: 'Calibri',
                        color: '334155',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: 'F1F5F9' },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({ text: '4. Kompetensi', bold: true, size: 17, font: 'Calibri', color: '1E293B' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: cleanTextForWord(q.competency || '-'),
                        size: 17,
                        font: 'Calibri',
                        color: '334155',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { fill: 'F1F5F9' },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({ text: '5. Level Kognitif', bold: true, size: 17, font: 'Calibri', color: '1E293B' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: cleanTextForWord(q.cognitiveLevel || '-'),
                        bold: true,
                        size: 17,
                        font: 'Calibri',
                        color: '0369A1',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      docChildren.push(new Paragraph({ spacing: { before: 140 } }));
      docChildren.push(itemDetailTable);
    }

    // Number & Prompt Paragraph
    docChildren.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.3) },
        children: [
          new TextRun({
            text: `${questionNumber}. `,
            bold: true,
            size: 22, // 11pt
            font: 'Calibri',
            color: '0f172a',
          }),
          new TextRun({
            text: cleanPrompt,
            size: 22,
            font: 'Calibri',
            color: '0f172a',
          }),
        ],
      })
    );

    // Render attachments info and embedded media images if available
    if (q.attachments && q.attachments.length > 0) {
      for (const att of q.attachments) {
        if (att.url) {
          const imgRes = await fetchImageAsUint8Array(att.url);
          if (imgRes) {
            docChildren.push(
              new Paragraph({
                spacing: { before: 60, after: 60 },
                indent: { left: convertInchesToTwip(0.4) },
                children: [
                  new ImageRun({
                    data: imgRes.data,
                    transformation: {
                      width: imgRes.width,
                      height: imgRes.height,
                    },
                  }),
                ],
              })
            );
          }
        }

        docChildren.push(
          new Paragraph({
            spacing: { before: 30, after: 80 },
            indent: { left: convertInchesToTwip(0.4) },
            children: [
              new TextRun({
                text: `📁 [Lampiran Gambar/Media: ${att.name}${att.size ? ` - ${att.size}` : ''}]  `,
                italics: true,
                bold: true,
                size: 19,
                font: 'Calibri',
                color: '0F172A',
              }),
              new TextRun({
                text: 'Tautan File: ',
                bold: true,
                size: 19,
                font: 'Calibri',
                color: '1D4ED8',
              }),
              new ExternalHyperlink({
                children: [
                  new TextRun({
                    text: att.url,
                    style: 'Hyperlink',
                    size: 19,
                    font: 'Calibri',
                    color: '1D4ED8',
                    underline: {},
                  }),
                ],
                link: att.url,
              }),
            ],
          })
        );
      }
    }

    // Options for Pilihan Ganda & Pilihan Ganda Kompleks
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt) => {
        const isAnswer = opt.isCorrect;
        const showKey = config.answerKeyMode === 'inline' && config.includeAnswerKey;

        docChildren.push(
          new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: convertInchesToTwip(0.6) },
            children: [
              new TextRun({
                text: `${opt.label}. `,
                bold: true,
                size: 21,
                font: 'Calibri',
                color: showKey && isAnswer ? '047857' : '1e293b',
              }),
              new TextRun({
                text: cleanTextForWord(opt.text),
                size: 21,
                font: 'Calibri',
                bold: showKey && isAnswer,
                color: showKey && isAnswer ? '047857' : '1e293b',
              }),
              showKey && isAnswer
                ? new TextRun({
                    text: '  [✔ KUNCI JAWABAN]',
                    bold: true,
                    size: 18,
                    font: 'Calibri',
                    color: '059669',
                  })
                : new TextRun({ text: '' }),
            ],
          })
        );
      });
    }

    // Matching Pairs
    if (q.matchingPairs && q.matchingPairs.length > 0) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          indent: { left: convertInchesToTwip(0.6) },
          children: [
            new TextRun({
              text: 'Pasangkan kolom A dengan kolom B yang sesuai:',
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '475569',
            }),
          ],
        })
      );

      q.matchingPairs.forEach((pair, pIdx) => {
        docChildren.push(
          new Paragraph({
            spacing: { before: 30, after: 30 },
            indent: { left: convertInchesToTwip(0.8) },
            children: [
              new TextRun({
                text: `${pIdx + 1}) ${cleanTextForWord(pair.premise)}   <--->   ${
                  config.answerKeyMode === 'inline' && config.includeAnswerKey
                    ? cleanTextForWord(pair.response) + ' [Kunci]'
                    : '( ................................... )'
                }`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    }

    // True/False
    if (q.trueFalseItems && q.trueFalseItems.length > 0) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 40 },
          indent: { left: convertInchesToTwip(0.6) },
          children: [
            new TextRun({
              text: 'Tentukan Benar atau Salah untuk pernyataan berikut:',
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '475569',
            }),
          ],
        })
      );

      q.trueFalseItems.forEach((tf, tfIdx) => {
        docChildren.push(
          new Paragraph({
            spacing: { before: 30, after: 30 },
            indent: { left: convertInchesToTwip(0.8) },
            children: [
              new TextRun({
                text: `[  ]  ${tfIdx + 1}. ${cleanTextForWord(tf.statement)}`,
                size: 20,
                font: 'Calibri',
              }),
              config.answerKeyMode === 'inline' && config.includeAnswerKey
                ? new TextRun({
                    text: `   --> [${tf.correctAnswer ? 'BENAR' : 'SALAH'}]`,
                    bold: true,
                    size: 19,
                    color: '059669',
                    font: 'Calibri',
                  })
                : new TextRun({ text: '' }),
            ],
          })
        );
      });
    }

    // Short Answer / Essay
    if (q.type === 'isian_singkat' || q.type === 'esai') {
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          indent: { left: convertInchesToTwip(0.6) },
          children: [
            new TextRun({
              text: 'Jawaban: ________________________________________________________________________________',
              size: 20,
              font: 'Calibri',
              color: '94a3b8',
            }),
          ],
        })
      );

      if (config.answerKeyMode === 'inline' && config.includeAnswerKey) {
        if (q.shortAnswerKey) {
          docChildren.push(
            new Paragraph({
              indent: { left: convertInchesToTwip(0.6) },
              children: [
                new TextRun({ text: 'Kunci Isian: ', bold: true, color: '059669', size: 20, font: 'Calibri' }),
                new TextRun({ text: cleanTextForWord(q.shortAnswerKey), color: '059669', size: 20, font: 'Calibri' }),
              ],
            })
          );
        }
        if (q.essayRubric) {
          docChildren.push(
            new Paragraph({
              indent: { left: convertInchesToTwip(0.6) },
              children: [
                new TextRun({ text: 'Rubrik Penilaian: ', bold: true, color: '059669', size: 20, font: 'Calibri' }),
                new TextRun({ text: cleanTextForWord(q.essayRubric), color: '059669', size: 20, font: 'Calibri' }),
              ],
            })
          );
        }
      }
    }

    // Inline Explanation Box
    if (config.answerKeyMode === 'inline' && config.includeAnswerKey && q.explanation) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          indent: { left: convertInchesToTwip(0.6) },
          children: [
            new TextRun({ text: '💡 Pembahasan: ', bold: true, color: '2563eb', size: 19, font: 'Calibri' }),
            new TextRun({ text: cleanTextForWord(q.explanation), size: 19, font: 'Calibri', color: '334155' }),
          ],
        })
      );
    }
  }

  // 7. SEPARATE END ANSWER KEY SECTION (If requested)
  if (config.answerKeyMode === 'end_section' && config.includeAnswerKey) {
    docChildren.push(
      new Paragraph({
        pageBreakBefore: true,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'LEMBAR KUNCI JAWABAN & PEMBAHASAN LENGKAP',
            bold: true,
            size: 26,
            font: 'Calibri',
            color: '1e40af',
          }),
        ],
      })
    );

    filtered.forEach((q, idx) => {
      const qNum = idx + 1;
      let keyText = '-';

      if (q.options) {
        const correctOpts = q.options.filter((o) => o.isCorrect).map((o) => o.label);
        keyText = correctOpts.join(', ');
      } else if (q.shortAnswerKey) {
        keyText = q.shortAnswerKey;
      } else if (q.trueFalseItems) {
        keyText = q.trueFalseItems.map((tf, i) => `${i + 1}:${tf.correctAnswer ? 'B' : 'S'}`).join(' | ');
      } else if (q.matchingPairs) {
        keyText = q.matchingPairs.map((p, i) => `${i + 1}->${p.response}`).join(' | ');
      }

      docChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: `No. ${qNum} [${q.code}] : `, bold: true, size: 21, font: 'Calibri' }),
            new TextRun({ text: `Kunci: ${keyText} `, bold: true, color: '059669', size: 21, font: 'Calibri' }),
            new TextRun({
              text: `(Elemen: ${cleanTextForWord(q.element || q.topic)} | Kognitif: ${cleanTextForWord(
                q.cognitiveLevel
              )} | Bentuk: ${getQuestionTypeLabel(q.type)})`,
              size: 19,
              font: 'Calibri',
              color: '64748b',
            }),
          ],
        })
      );

      if (q.explanation) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            indent: { left: convertInchesToTwip(0.4) },
            children: [
              new TextRun({ text: 'Pembahasan: ', bold: true, size: 19, font: 'Calibri', color: '2563eb' }),
              new TextRun({ text: cleanTextForWord(q.explanation), size: 19, font: 'Calibri', color: '334155' }),
            ],
          })
        );
      }
    });
  }

  // 8. BUILD DOCUMENT AND DOWNLOAD
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanPacketSlug = config.packetInfo ? config.packetInfo.code.toLowerCase().replace(/[^a-z0-9]/g, '_') : '';
  const cleanSubtestSlug = (config.subtestFilter === 'all' ? 'semua_mapel' : config.subtestFilter)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const fileName = `naskah_soal_${cleanPacketSlug ? cleanPacketSlug + '_' : ''}${cleanSubtestSlug}_${Date.now()}.docx`;

  saveAs(blob, fileName);

  return {
    success: true,
    totalExported: filtered.length,
    fileName,
  };
}
