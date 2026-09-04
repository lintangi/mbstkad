import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import { Question } from '../types';

export interface WordExportConfig {
  documentTitle: string;
  institutionName: string;
  academicYear: string;
  subtestFilter: string; // 'all' or specific subtest name
  statusFilter: string; // 'all' or 'disetujui' etc.
  difficultyFilter: string;
  includeAnswerKey: boolean; // if true, prints answers & explanations inline or at bottom
  answerKeyMode: 'inline' | 'end_section' | 'none';
  timeLimitMinutes?: number;
  generalInstructions?: string;
}

/**
 * Strips raw HTML or markdown tags to clean plain text for Word runs
 */
function cleanTextForWord(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // remove html tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

/**
 * Formats question type into friendly Indonesian name
 */
function getQuestionTypeLabel(type: string): string {
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
      return type;
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
      `Tidak ditemukan butir soal yang sesuai dengan filter (Mata Pelajaran/Subtes: ${
        config.subtestFilter === 'all' ? 'Semua' : config.subtestFilter
      }).`
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
                spacing: { after: 80 },
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
            ],
          }),
        ],
      }),
    ],
  });

  docChildren.push(headerTable);
  docChildren.push(new Paragraph({ spacing: { after: 120 } }));

  // 3. METADATA & PETUNJUK PENGERJAAN
  const subtestLabel = config.subtestFilter === 'all' ? 'Semua Mata Pelajaran / Subtes' : config.subtestFilter;
  const statusLabel =
    config.statusFilter === 'all'
      ? 'Semua Status'
      : config.statusFilter === 'disetujui'
      ? 'Soal Disetujui (Resmi)'
      : config.statusFilter;

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
                  new TextRun({ text: 'Tahun Ajaran / Sesi   : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: config.academicYear || '2025/2026', size: 20, font: 'Calibri' }),
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
                  new TextRun({ text: 'Jumlah Butir Soal     : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: `${filtered.length} Soal`, bold: true, color: '1e40af', size: 20, font: 'Calibri' }),
                ],
              }),
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({ text: 'Waktu Pengerjaan      : ', bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: config.timeLimitMinutes ? `${config.timeLimitMinutes} Menit` : 'Sesuai Jadwal', size: 20, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  docChildren.push(metaTable);
  docChildren.push(new Paragraph({ spacing: { after: 120 } }));

  // Petunjuk Umum
  if (config.generalInstructions) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PETUNJUK UMUM:',
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

  // 4. LOOP ITEMS (QUESTIONS)
  filtered.forEach((q, idx) => {
    const questionNumber = idx + 1;
    const cleanPrompt = cleanTextForWord(q.prompt);

    // Number & Prompt Paragraph
    docChildren.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
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
  });

  // 5. SEPARATE END ANSWER KEY SECTION (If requested)
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
            new TextRun({ text: `(Bobot: ${q.defaultScore || 1} | Kesulitan: ${q.difficulty})`, size: 19, font: 'Calibri', color: '64748b' }),
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

  // 6. BUILD DOCUMENT AND DOWNLOAD
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
  const cleanSubtestSlug = (config.subtestFilter === 'all' ? 'semua_mapel' : config.subtestFilter)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const fileName = `naskah_soal_${cleanSubtestSlug}_${Date.now()}.docx`;

  saveAs(blob, fileName);

  return {
    success: true,
    totalExported: filtered.length,
    fileName,
  };
}
