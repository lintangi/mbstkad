import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  Code2,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Info,
  Lock,
  CheckSquare,
  Square,
  Table as TableIcon,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Question,
  QuestionType,
  DifficultyLevel,
  ChoiceOption,
  MatchingPair,
  TrueFalseItem,
  QuestionAttachment,
} from '../types';
import { LatexRenderer } from '../utils/latexParser';
import {
  uploadMediaToDriveOrFallback,
  normalizeGoogleDriveImageUrl,
  getDriveImageFallbackUrls,
  handleDriveImageError,
  extractDriveFileId,
  TKAD_DRIVE_FOLDER_URL,
  TKAD_DRIVE_FOLDER_ID,
} from '../utils/googleDriveUtils';

export const QuestionEditor: React.FC = () => {
  const {
    categories,
    createQuestion,
    updateQuestion,
    editingQuestionId,
    setEditingQuestionId,
    setActiveTab,
    questions,
    currentUser,
    getUserDepartmentCategory,
    canUserEditQuestion,
    gasWebhookUrl,
  } = useApp();

  const editingQuestion = editingQuestionId
    ? questions.find((q) => q.id === editingQuestionId)
    : null;

  // Determine user department category
  const userDeptCategory = getUserDepartmentCategory(currentUser);

  // Available subtests list
  const availableSubtests = userDeptCategory
    ? [userDeptCategory]
    : categories.length > 0
    ? categories.map((c) => c.name)
    : ['Bahasa Indonesia', 'Matematika', 'IPAS'];

  // Permission verification
  const editPermission = editingQuestion
    ? canUserEditQuestion(currentUser, editingQuestion)
    : currentUser.role === 'reviewer'
    ? { allowed: false, reason: 'Penelaah tidak memiliki izin menyusun atau mengubah naskah soal. Silakan gunakan menu Antrian Review untuk menelaah soal.' }
    : { allowed: true };

  // Form states
  const [code, setCode] = useState(editingQuestion?.code || '');
  const [type, setType] = useState<QuestionType>(editingQuestion?.type || 'pilihan_ganda');
  const [subtest, setSubtest] = useState(
    editingQuestion?.subtest || userDeptCategory || availableSubtests[0] || 'Bahasa Indonesia'
  );
  const [element, setElement] = useState(editingQuestion?.element || editingQuestion?.topic || 'Materi Pokok');
  const [subElement, setSubElement] = useState(editingQuestion?.subElement || '');
  const [competency, setCompetency] = useState(editingQuestion?.competency || '');
  const [cognitiveLevel, setCognitiveLevel] = useState(editingQuestion?.cognitiveLevel || 'C2 - Memahami');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(editingQuestion?.difficulty || 'sedang');
  const [defaultScore, setDefaultScore] = useState<number>(editingQuestion?.defaultScore || 4);
  const [tagInput, setTagInput] = useState((editingQuestion?.tags || []).join(', '));

  const [prompt, setPrompt] = useState(editingQuestion?.prompt || '');
  const [explanation, setExplanation] = useState(editingQuestion?.explanation || '');
  const [showPreview, setShowPreview] = useState(true);

  // Options for Pilihan Ganda & Kompleks
  const [options, setOptions] = useState<ChoiceOption[]>(
    editingQuestion?.options?.length
      ? editingQuestion.options
      : [
          { id: 'opt-1', label: 'A', text: '', isCorrect: true },
          { id: 'opt-2', label: 'B', text: '', isCorrect: false },
          { id: 'opt-3', label: 'C', text: '', isCorrect: false },
          { id: 'opt-4', label: 'D', text: '', isCorrect: false },
          { id: 'opt-5', label: 'E', text: '', isCorrect: false },
        ]
  );

  // Matching pairs
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>(
    editingQuestion?.matchingPairs?.length
      ? editingQuestion.matchingPairs
      : [
          { id: 'm-1', premise: '', response: '' },
          { id: 'm-2', premise: '', response: '' },
        ]
  );

  // True / False statements (Tabel: No, Pernyataan, Benar, Salah)
  const [trueFalseItems, setTrueFalseItems] = useState<TrueFalseItem[]>(
    editingQuestion?.trueFalseItems?.length
      ? editingQuestion.trueFalseItems
      : [
          { id: 'tf-1', statement: '', correctAnswer: true },
          { id: 'tf-2', statement: '', correctAnswer: false },
          { id: 'tf-3', statement: '', correctAnswer: true },
        ]
  );

  // Short answer
  const [shortAnswerKey, setShortAnswerKey] = useState(editingQuestion?.shortAnswerKey || '');

  // Essay rubric
  const [essayRubric, setEssayRubric] = useState(editingQuestion?.essayRubric || '');

  // Attachments
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachments, setAttachments] = useState<QuestionAttachment[]>(editingQuestion?.attachments || []);

  // Direct file upload state to Google Drive
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit upload file size to 15MB
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(`Ukuran berkas (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimum 15 MB.`);
      setIsUploading(false);
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('Membaca berkas dari perangkat...');
    setUploadError(null);

    try {
      const result = await uploadMediaToDriveOrFallback(
        file,
        (percent, statusText) => {
          setUploadProgress(percent);
          setUploadStatus(statusText);
        },
        { gasWebhookUrl: gasWebhookUrl || undefined, folderId: TKAD_DRIVE_FOLDER_ID }
      );

      const newId = `att-${Date.now()}`;
      const newAtt: QuestionAttachment = {
        id: newId,
        name: result.name,
        type: file.type.startsWith('video') ? 'document' : file.type.startsWith('audio') ? 'audio' : 'image',
        url: normalizeGoogleDriveImageUrl(result.url),
        size: result.size,
        width: 100, // default size percentage
        align: 'center', // default alignment
      };

      setAttachments((prev) => [...prev, newAtt]);
      setUploadProgress(100);
      setUploadStatus(
        result.storageProvider === 'google_drive'
          ? 'Berkas berhasil terunggah ke Google Drive (TKAD Adiwerna)!'
          : result.storageProvider === 'server'
          ? 'Berkas berhasil tersimpan di server media!'
          : 'Berkas berhasil terlampir (Inline Media)!'
      );

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setUploadError(err.message || 'Gagal mengunggah file. Silakan coba lagi.');
      setIsUploading(false);
    } finally {
      e.target.value = '';
    }
  };

  // Sync subtest when user role/department changes
  useEffect(() => {
    if (userDeptCategory && subtest !== userDeptCategory) {
      setSubtest(userDeptCategory);
    }
  }, [userDeptCategory]);

  // Quick Math Snippets inserter
  const insertLatex = (formula: string) => {
    setPrompt((prev) => `${prev} ${formula} `);
  };

  const handleAddOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length);
    if (options.length < 8) {
      setOptions((prev) => [
        ...prev,
        { id: `opt-${Date.now()}`, label: nextLabel, text: '', isCorrect: false },
      ]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const updated = options.filter((_, i) => i !== index).map((opt, i) => ({
        ...opt,
        label: String.fromCharCode(65 + i),
      }));
      setOptions(updated);
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    const rawUrl = attachmentUrl.trim();
    const normalizedUrl = normalizeGoogleDriveImageUrl(rawUrl);
    const driveFileId = extractDriveFileId(rawUrl);

    const newAtt: QuestionAttachment = {
      id: `att-${Date.now()}`,
      name: driveFileId
        ? `Media Google Drive (${driveFileId.slice(0, 8)}...)`
        : `Lampiran Gambar #${attachments.length + 1}`,
      type: 'image',
      url: normalizedUrl,
      width: 100,
      align: 'center',
    };
    setAttachments((prev) => [...prev, newAtt]);
    setAttachmentUrl('');
  };

  const handleSave = (submitForReview: boolean) => {
    if (!editPermission.allowed) {
      alert(editPermission.reason || 'Anda tidak memiliki izin menyimpan perubahan pada butir soal ini.');
      return;
    }

    if (!prompt.trim()) {
      alert('Teks soal tidak boleh kosong!');
      return;
    }

    // Validation for question types
    if (type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') {
      const hasCorrect = options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        alert('Wajib memilih minimal satu kunci jawaban yang benar!');
        return;
      }
      const emptyOption = options.some((o) => !o.text.trim());
      if (emptyOption) {
        alert('Semua opsi pilihan jawaban harus diisi teksnya!');
        return;
      }
    } else if (type === 'benar_salah') {
      const emptyStatement = trueFalseItems.some((tf) => !tf.statement.trim());
      if (emptyStatement) {
        alert('Semua baris pernyataan pada tabel Benar/Salah wajib diisi!');
        return;
      }
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const questionData: Partial<Question> = {
      code: code.trim() || undefined,
      type,
      subtest,
      element: element.trim() || 'Umum',
      subElement: subElement.trim() || undefined,
      competency: competency.trim() || undefined,
      cognitiveLevel: cognitiveLevel || undefined,
      topic: element.trim() || 'Umum',
      difficulty,
      defaultScore: Number(defaultScore) || 4,
      tags,
      prompt,
      explanation,
      attachments,
      options: type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks' ? options : undefined,
      matchingPairs: type === 'menjodohkan' ? matchingPairs : undefined,
      trueFalseItems: type === 'benar_salah' ? trueFalseItems : undefined,
      shortAnswerKey: type === 'isian_singkat' ? shortAnswerKey : undefined,
      essayRubric: type === 'esai' ? essayRubric : undefined,
    };

    if (editingQuestionId) {
      updateQuestion(editingQuestionId, questionData, submitForReview);
    } else {
      createQuestion(questionData, submitForReview);
    }

    setEditingQuestionId(null);
    setActiveTab(submitForReview && currentUser.role === 'reviewer' ? 'antrian_review' : 'bank_soal');
  };

  // Get topic suggestions for current subtest
  const currentCategoryObj = categories.find((c) => c.name === subtest);
  const suggestedTopics = currentCategoryObj?.topics || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => {
              setEditingQuestionId(null);
              setActiveTab('bank_soal');
            }}
            className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Bank Soal</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingQuestion ? `Edit Soal (${editingQuestion.code})` : 'Penyusunan Butir Soal Baru'}
            </h1>
            {userDeptCategory && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Mapel: {userDeptCategory}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dukungan formula LaTeX, gambar, tabel Benar/Salah terstruktur, dan kunci persegi untuk pilihan ganda kompleks.
          </p>
        </div>

        {editPermission.allowed ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Draf</span>
            </button>
            <button
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim untuk Review</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingQuestionId(null);
                setActiveTab(currentUser.role === 'reviewer' ? 'antrian_review' : 'bank_soal');
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Kembali
            </button>
          </div>
        )}
      </div>

      {/* Permission Block Banner */}
      {!editPermission.allowed && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start space-x-3 shadow-xs">
          <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Akses Pengeditan Soal Terkunci</p>
            <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
              {editPermission.reason}
            </p>
          </div>
        </div>
      )}

      {/* Status Notifications */}
      {editingQuestion?.status === 'perlu_revisi' && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-start space-x-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Catatan dari Penelaah (Perlu Revisi):</p>
            <p className="text-blue-800 dark:text-blue-300 mt-1 italic">
              &ldquo;{editingQuestion.reviews[0]?.generalComment || 'Silakan sesuaikan naskah butir soal sesuai catatan telaah.'}&rdquo;
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Controls */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Metadata Soal</h3>

            {/* Subtest Selector (Bahasa Indonesia, Matematika, IPAS) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mata Pelajaran / Departemen *
              </label>
              <select
                value={subtest}
                disabled={!!userDeptCategory || !editPermission.allowed}
                onChange={(e) => {
                  const newSub = e.target.value;
                  setSubtest(newSub);
                  const matched = categories.find((c) => c.name === newSub);
                  if (matched && matched.topics.length > 0) {
                    setElement(matched.topics[0]);
                  }
                }}
                className={`w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  userDeptCategory ? 'opacity-90 cursor-not-allowed font-semibold' : ''
                }`}
              >
                {availableSubtests.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub} {userDeptCategory ? '(Departemen Anda)' : ''}
                  </option>
                ))}
              </select>
              {userDeptCategory && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Terkunci sesuai penugasan departemen ({userDeptCategory}).
                </span>
              )}
            </div>

            {/* 1. Elemen (sebelumnya Topik/Bahasan) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  1. Elemen (Capaian / Materi Pokok) *
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">Bebas ketik</span>
              </div>
              <input
                type="text"
                disabled={!editPermission.allowed}
                value={element}
                onChange={(e) => setElement(e.target.value)}
                placeholder="Ketik nama elemen / capaian..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />

              {/* Suggestion Chips */}
              {suggestedTopics.length > 0 && editPermission.allowed && (
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">
                    Saran elemen untuk {subtest}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {suggestedTopics.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setElement(sug)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          element === sug
                            ? 'bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 font-semibold'
                            : 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Sub Elemen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                2. Sub Elemen
              </label>
              <input
                type="text"
                disabled={!editPermission.allowed}
                value={subElement}
                onChange={(e) => setSubElement(e.target.value)}
                placeholder="Ketik rincian sub-elemen / materi spesifik..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 3. Kompetensi (Indikator Soal) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                3. Kompetensi (Indikator Soal)
              </label>
              <textarea
                rows={2}
                disabled={!editPermission.allowed}
                value={competency}
                onChange={(e) => setCompetency(e.target.value)}
                placeholder="Disajikan data/teks..., peserta didik mampu..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* 4. Level Kognitif (Dropdown Taksonomi Bloom) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                4. Level Kognitif (Taksonomi Bloom) *
              </label>
              <select
                value={cognitiveLevel}
                disabled={!editPermission.allowed}
                onChange={(e) => setCognitiveLevel(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="C1 - Mengingat">C1 - Mengingat (Remembering: menyebutkan, mengenali, mendefinisikan)</option>
                <option value="C2 - Memahami">C2 - Memahami (Understanding: menjelaskan, menginterpretasi, mengelompokkan)</option>
                <option value="C3 - Menerapkan">C3 - Menerapkan (Applying: menghitung, menerapkan rumus, mendemonstrasikan)</option>
                <option value="C4 - Menganalisis">C4 - Menganalisis (Analyzing: membedakan, mengorganisasi, menguraikan masalah)</option>
                <option value="C5 - Mengevaluasi">C5 - Mengevaluasi (Evaluating: menilai, mengkritisi, menyimpulkan validitas)</option>
                <option value="C6 - Berkreasi / Mencipta">C6 - Berkreasi / Mencipta (Creating: merancang, menyusun konsep baru)</option>
              </select>
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipe Soal</label>
              <select
                value={type}
                disabled={!editPermission.allowed}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="pilihan_ganda">Pilihan Ganda Biasa (Kunci Bulat / Tunggal)</option>
                <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks (Kunci Persegi / Multi)</option>
                <option value="benar_salah">Benar / Salah (Format Tabel: No, Pernyataan, B/S)</option>
                <option value="menjodohkan">Menjodohkan (Matching Items)</option>
                <option value="isian_singkat">Isian Singkat (Short Answer)</option>
                <option value="esai">Esai / Uraian (Rubric-based)</option>
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tingkat Kesulitan</label>
              <div className="grid grid-cols-3 gap-2">
                {(['mudah', 'sedang', 'sulit'] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={!editPermission.allowed}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-1.5 rounded-lg text-xs font-medium capitalize border transition cursor-pointer ${
                      difficulty === lvl
                        ? lvl === 'mudah'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                          : lvl === 'sedang'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-800 dark:text-blue-300'
                          : 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 text-purple-800 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Score & Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Skor Default</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  disabled={!editPermission.allowed}
                  value={defaultScore}
                  onChange={(e) => setDefaultScore(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kode Soal (Otomatis)</label>
                <input
                  type="text"
                  placeholder="e.g. TKAD-MAT-009"
                  disabled={!editPermission.allowed}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kata Kunci / Tags (Pisahkan koma)</label>
              <input
                type="text"
                disabled={!editPermission.allowed}
                placeholder="misal: aljabar, persamaan, pecahan"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lampiran Gambar / Media</h3>
              {currentUser.role !== 'pembuat' && (
                <a
                  href="https://drive.google.com/drive/folders/1Adx3ZBQrcOx_X2iWWzag05xsywaHyOoC?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-slate-400 hover:text-blue-500 transition flex items-center space-x-1"
                  title="Buka Folder Google Drive Tujuan"
                >
                  <span>Buka Drive</span>
                  <ImageIcon className="w-3 h-3" />
                </a>
              )}
            </div>

            {editPermission.allowed && (
              <div className="space-y-3">
                {/* Hidden File Input */}
                <input
                  type="file"
                  id="media-file-input"
                  accept="image/*,audio/*,video/*"
                  onChange={handleDirectUpload}
                  className="hidden"
                  disabled={isUploading}
                />

                {/* Direct Upload Trigger */}
                <button
                  type="button"
                  onClick={() => document.getElementById('media-file-input')?.click()}
                  disabled={isUploading}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-dashed transition flex items-center justify-center space-x-2 cursor-pointer ${
                    isUploading
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>{isUploading ? 'Sedang Mengunggah Berkas...' : 'Unggah Media dari Perangkat'}</span>
                </button>

                {/* Direct Upload Progress Bar */}
                {isUploading && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center space-x-1.5 truncate max-w-[80%]">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0" />
                        <span className="truncate">{uploadStatus}</span>
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-[11px] flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Manual URL entry fallback */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                  <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">Atau tempel URL gambar eksternal</span>
                  <div className="flex space-x-1.5">
                    <input
                      type="url"
                      placeholder="https://example.com/gambar.png"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer shrink-0"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="space-y-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Berkas Terlampir ({attachments.length})</span>
                {attachments.map((att, idx) => {
                  const updateAttachmentConfig = (width: number, align: 'left' | 'center' | 'right') => {
                    setAttachments((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, width, align } : item))
                    );
                  };

                  return (
                    <div key={att.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs border border-slate-100 dark:border-slate-800/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate pr-4">
                          <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="truncate text-left">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-200">{att.name}</p>
                            {att.size && <span className="text-[10px] text-slate-400 block font-mono">{att.size}</span>}
                          </div>
                        </div>
                        {editPermission.allowed && (
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer shrink-0"
                            title="Hapus Lampiran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Formatting controls (size & position) */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-x-4 gap-y-2 items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Ukuran:</span>
                          <div className="flex items-center space-x-1">
                            {[25, 50, 75, 100].map((w) => (
                              <button
                                key={w}
                                type="button"
                                onClick={() => updateAttachmentConfig(w, att.align || 'center')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                  (att.width || 100) === w
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                              >
                                {w}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Posisi:</span>
                          <div className="flex items-center space-x-1">
                            {(['left', 'center', 'right'] as const).map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => updateAttachmentConfig(att.width || 100, pos)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition cursor-pointer ${
                                  (att.align || 'center') === pos
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                              >
                                {pos === 'left' ? 'Kiri' : pos === 'center' ? 'Tengah' : 'Kanan'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prompt & Constructive Answer Keys */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Question Stem / Prompt */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Teks Pokok Soal (Stem) *
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                {showPreview ? 'Sembunyikan Pratinjau' : 'Tampilkan Pratinjau'}
              </button>
            </div>

            {/* Quick LaTeX Buttons */}
            {editPermission.allowed && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                  <Code2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Sisipkan Rumus Matematika (LaTeX):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Pecahan \\frac{a}{b}', code: '$\\frac{a}{b}$' },
                    { label: 'Akar \\sqrt{x}', code: '$\\sqrt{x}$' },
                    { label: 'Pangkat x^2', code: '$x^2$' },
                    { label: 'Limit \\lim', code: '$\\lim_{x \\to 0} f(x)$' },
                    { label: 'Sigma \\sum', code: '$\\sum_{i=1}^n x_i$' },
                    { label: 'Derajat ^\\circ', code: '$180^\\circ$' },
                    { label: 'Pertaksamaan \\le', code: '$\\le$' },
                    { label: 'Pi \\pi', code: '$\\pi$' },
                    { label: 'Plus-Minus \\pm', code: '$\\pm$' },
                    { label: 'Implikasi \\to', code: '$p \\to q$' },
                    { label: 'Blok Tengah $$...$$', code: '$$\\int_0^1 x^2 dx$$' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => insertLatex(item.code)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 font-mono text-[11px] transition shadow-2xs cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Prompt Textarea */}
            <textarea
              rows={5}
              disabled={!editPermission.allowed}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ketikkan teks soal di sini. Gunakan $formula$ untuk rumus inline atau $$formula$$ untuk rumus terpusat..."
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
            />

            {/* Live Formula Preview Box */}
            {showPreview && prompt && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Pratinjau Teks & Rumus</span>
                </div>
                <div className="bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <LatexRenderer content={prompt} />
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {attachments.map((att) => {
                        const alignClass = 
                          att.align === 'left' ? 'text-left' :
                          att.align === 'right' ? 'text-right' :
                          'text-center';

                        const alignImgClass = 
                          att.align === 'left' ? 'mr-auto ml-0' :
                          att.align === 'right' ? 'ml-auto mr-0' :
                          'mx-auto';

                        const widthStyle = att.width ? `${att.width}%` : '100%';
                        const resolvedUrl = normalizeGoogleDriveImageUrl(att.url);

                        return (
                          <div key={att.id} className={alignClass}>
                            <img
                              src={resolvedUrl}
                              alt={att.name}
                              style={{ width: widthStyle }}
                              className={`max-h-96 object-contain rounded border border-slate-200 dark:border-slate-700 ${alignImgClass}`}
                              onError={(e) => handleDriveImageError(e, att.url)}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">{att.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Type-Specific Answer Inputs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Kunci Jawaban & Konstruksi Jawaban
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {type === 'pilihan_ganda' && 'Tipe Pilihan Ganda Tunggal: Kunci jawaban berbentuk lingkaran bulat (pilih satu opsi).'}
                  {type === 'pilihan_ganda_kompleks' && 'Tipe Pilihan Ganda Kompleks: Kunci jawaban berbentuk persegi (pilih satu atau lebih opsi yang benar).'}
                  {type === 'benar_salah' && 'Tipe Benar / Salah: Dikelola dalam bentuk tabel terstruktur (Nomor, Pernyataan, Benar, Salah).'}
                  {type === 'menjodohkan' && 'Tipe Menjodohkan: Pasangan premis dan respon jawaban valid.'}
                  {type === 'isian_singkat' && 'Tipe Isian Singkat: Kata atau angka kunci valid.'}
                  {type === 'esai' && 'Tipe Uraian / Esai: Rubrik pedoman penskoran bertahap.'}
                </p>
              </div>

              {type === 'pilihan_ganda_kompleks' && (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  <Square className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>Kunci Persegi</span>
                </div>
              )}

              {type === 'benar_salah' && (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Format Tabel</span>
                </div>
              )}
            </div>

            {/* Case: Pilihan Ganda (Single - Radio Circle) */}
            {type === 'pilihan_ganda' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Pilih satu lingkaran radio sebagai kunci jawaban yang benar:</span>
                  {editPermission.allowed && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Opsi</span>
                    </button>
                  )}
                </div>

                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border transition flex items-start space-x-3 ${
                      opt.isCorrect
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
                        : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Circle Radio for Pilihan Ganda */}
                    <div className="pt-2">
                      <input
                        type="radio"
                        name="correctOption"
                        disabled={!editPermission.allowed}
                        checked={opt.isCorrect}
                        onChange={() => {
                          setOptions((prev) =>
                            prev.map((o) => ({
                              ...o,
                              isCorrect: o.id === opt.id,
                            }))
                          );
                        }}
                        className="w-4 h-4 text-emerald-600 rounded-full focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {opt.label}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        disabled={!editPermission.allowed}
                        placeholder={`Teks pilihan ${opt.label} (mendukung $rumus$)`}
                        value={opt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOptions((prev) =>
                            prev.map((o) => (o.id === opt.id ? { ...o, text: val } : o))
                          );
                        }}
                        className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {opt.text && (opt.text.includes('$') || opt.text.includes('\\')) && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                          <LatexRenderer content={opt.text} />
                        </div>
                      )}
                    </div>

                    {options.length > 2 && editPermission.allowed && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-red-600 pt-2 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Case: Pilihan Ganda Kompleks (Multi - STRICT SQUARE SHAPE) */}
            {type === 'pilihan_ganda_kompleks' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center space-x-2">
                    <Square className="w-4 h-4 fill-emerald-600 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      Tampilan Kunci Persegi: Centang kotak persegi untuk semua opsi jawaban yang benar.
                    </span>
                  </div>
                  {editPermission.allowed && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-emerald-700 dark:text-emerald-300 hover:underline font-bold flex items-center space-x-1 cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Opsi</span>
                    </button>
                  )}
                </div>

                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`p-3.5 rounded-none border-2 transition flex items-start space-x-3.5 ${
                      opt.isCorrect
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-600 shadow-2xs'
                        : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {/* STRICT SQUARE CHECKBOX */}
                    <div className="pt-1.5">
                      <button
                        type="button"
                        disabled={!editPermission.allowed}
                        onClick={() => {
                          setOptions((prev) =>
                            prev.map((o) =>
                              o.id === opt.id ? { ...o, isCorrect: !o.isCorrect } : o
                            )
                          );
                        }}
                        className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition cursor-pointer ${
                          opt.isCorrect
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-500 hover:border-emerald-500'
                        }`}
                        title={opt.isCorrect ? 'Kunci Benar (Klik untuk batal)' : 'Klik untuk jadikan kunci'}
                      >
                        {opt.isCorrect && (
                          <span className="font-black text-xs leading-none">✓</span>
                        )}
                      </button>
                    </div>

                    {/* STRICT SQUARE LABEL BADGE */}
                    <div
                      className={`w-7 h-7 rounded-none font-bold flex items-center justify-center text-xs shrink-0 border ${
                        opt.isCorrect
                          ? 'bg-emerald-600 border-emerald-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      [{opt.label}]
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        disabled={!editPermission.allowed}
                        placeholder={`Teks pilihan ${opt.label} (mendukung $rumus$)`}
                        value={opt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOptions((prev) =>
                            prev.map((o) => (o.id === opt.id ? { ...o, text: val } : o))
                          );
                        }}
                        className="w-full text-xs rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {opt.text && (opt.text.includes('$') || opt.text.includes('\\')) && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 rounded-none border border-slate-200 dark:border-slate-700">
                          <LatexRenderer content={opt.text} />
                        </div>
                      )}
                    </div>

                    {options.length > 2 && editPermission.allowed && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-red-600 pt-2 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Case: Benar / Salah (STRICT TABLE FORMAT: No, Pernyataan, Benar, Salah, Aksi) */}
            {type === 'benar_salah' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-medium">
                    <TableIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Tabel Penetapan Pernyataan & Kunci Jawaban Benar / Salah:</span>
                  </div>
                  {editPermission.allowed && (
                    <button
                      type="button"
                      onClick={() =>
                        setTrueFalseItems((prev) => [
                          ...prev,
                          { id: `tf-${Date.now()}`, statement: '', correctAnswer: true },
                        ])
                      }
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris Pernyataan</span>
                    </button>
                  )}
                </div>

                {/* Structured Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                        <th className="py-2.5 px-3 font-bold">Pernyataan Evaluasi (Mendukung $Rumus$)</th>
                        <th className="py-2.5 px-3 font-bold w-28 text-center bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-l border-slate-200 dark:border-slate-700">
                          Benar (B)
                        </th>
                        <th className="py-2.5 px-3 font-bold w-28 text-center bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-l border-slate-200 dark:border-slate-700">
                          Salah (S)
                        </th>
                        {editPermission.allowed && (
                          <th className="py-2.5 px-2 font-bold w-12 text-center border-l border-slate-200 dark:border-slate-700">
                            Aksi
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {trueFalseItems.map((tf, idx) => (
                        <tr
                          key={tf.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-850/70 transition"
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                disabled={!editPermission.allowed}
                                placeholder={`Tuliskan pernyataan evaluasi butir #${idx + 1}...`}
                                value={tf.statement}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTrueFalseItems((prev) =>
                                    prev.map((item) => (item.id === tf.id ? { ...item, statement: val } : item))
                                  );
                                }}
                                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                              />
                              {tf.statement && (tf.statement.includes('$') || tf.statement.includes('\\')) && (
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  <LatexRenderer content={tf.statement} />
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Column Benar */}
                          <td className="py-3 px-3 text-center bg-emerald-50/20 dark:bg-emerald-950/20 border-l border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              disabled={!editPermission.allowed}
                              onClick={() =>
                                setTrueFalseItems((prev) =>
                                  prev.map((item) => (item.id === tf.id ? { ...item, correctAnswer: true } : item))
                                )
                              }
                              className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                tf.correctAnswer
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                              }`}
                            >
                              {tf.correctAnswer && <span className="text-xs leading-none">✓</span>}
                              <span>BENAR</span>
                            </button>
                          </td>
                          {/* Column Salah */}
                          <td className="py-3 px-3 text-center bg-rose-50/20 dark:bg-rose-950/20 border-l border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              disabled={!editPermission.allowed}
                              onClick={() =>
                                setTrueFalseItems((prev) =>
                                  prev.map((item) => (item.id === tf.id ? { ...item, correctAnswer: false } : item))
                                )
                              }
                              className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                !tf.correctAnswer
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-rose-400'
                              }`}
                            >
                              {!tf.correctAnswer && <span className="text-xs leading-none">✓</span>}
                              <span>SALAH</span>
                            </button>
                          </td>
                          {/* Column Aksi */}
                          {editPermission.allowed && (
                            <td className="py-3 px-2 text-center border-l border-slate-200 dark:border-slate-700">
                              {trueFalseItems.length > 2 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTrueFalseItems((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="Hapus baris pernyataan ini"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Case: Menjodohkan */}
            {type === 'menjodohkan' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Isi premis (Kolom Kiri) dan pasangan jawaban valid (Kolom Kanan).</span>
                  {editPermission.allowed && (
                    <button
                      type="button"
                      onClick={() =>
                        setMatchingPairs((prev) => [
                          ...prev,
                          { id: `m-${Date.now()}`, premise: '', response: '' },
                        ])
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Pasangan</span>
                    </button>
                  )}
                </div>

                {matchingPairs.map((pair, idx) => (
                  <div key={pair.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-400 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      disabled={!editPermission.allowed}
                      placeholder="Premis Kolom A"
                      value={pair.premise}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMatchingPairs((prev) =>
                          prev.map((p) => (p.id === pair.id ? { ...p, premise: val } : p))
                        );
                      }}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-400 font-bold">&rarr;</span>
                    <input
                      type="text"
                      disabled={!editPermission.allowed}
                      placeholder="Jawaban Pasangan Kolom B"
                      value={pair.response}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMatchingPairs((prev) =>
                          prev.map((p) => (p.id === pair.id ? { ...p, response: val } : p))
                        );
                      }}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {matchingPairs.length > 2 && editPermission.allowed && (
                      <button
                        type="button"
                        onClick={() =>
                          setMatchingPairs((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Case: Isian Singkat */}
            {type === 'isian_singkat' && (
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Kunci Jawaban Tepat</label>
                <input
                  type="text"
                  disabled={!editPermission.allowed}
                  placeholder="Misal: 129 atau Jakarta (tanpa tanda kutip)"
                  value={shortAnswerKey}
                  onChange={(e) => setShortAnswerKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Sistem penilaian akan mencocokkan input peserta dengan kunci ini secara case-insensitive atau pemangkasan spasi.
                </p>
              </div>
            )}

            {/* Case: Esai / Uraian */}
            {type === 'esai' && (
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Rubrik & Panduan Penskoran Esai</label>
                <textarea
                  rows={4}
                  disabled={!editPermission.allowed}
                  placeholder="Deskripsikan kriteria penilaian skor (misal: 4 poin untuk kesimpulan valid, 3 poin untuk penjelasan premis...)"
                  value={essayRubric}
                  onChange={(e) => setEssayRubric(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs leading-relaxed"
                />
              </div>
            )}

            {/* Explanation & Solution */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pembahasan / Kunci Solusi Lengkap (Mendukung rumus LaTeX)
              </label>
              <textarea
                rows={3}
                disabled={!editPermission.allowed}
                placeholder="Tuliskan pembahasan lengkap langkah-demi-langkah atau landasan teori untuk soal ini..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
              {explanation && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Pratinjau Pembahasan:</span>
                  <LatexRenderer content={explanation} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
