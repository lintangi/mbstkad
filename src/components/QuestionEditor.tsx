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
  } = useApp();

  const editingQuestion = editingQuestionId
    ? questions.find((q) => q.id === editingQuestionId)
    : null;

  // Standard subjects required
  const availableSubtests = categories.length > 0 
    ? categories.map((c) => c.name) 
    : ['Bahasa Indonesia', 'Matematika', 'IPAS'];

  // Form states
  const [code, setCode] = useState(editingQuestion?.code || '');
  const [type, setType] = useState<QuestionType>(editingQuestion?.type || 'pilihan_ganda');
  const [subtest, setSubtest] = useState(editingQuestion?.subtest || availableSubtests[0] || 'Bahasa Indonesia');
  const [topic, setTopic] = useState(editingQuestion?.topic || 'Aljabar & Persamaan');
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

  // True / False statements
  const [trueFalseItems, setTrueFalseItems] = useState<TrueFalseItem[]>(
    editingQuestion?.trueFalseItems?.length
      ? editingQuestion.trueFalseItems
      : [
          { id: 'tf-1', statement: '', correctAnswer: true },
          { id: 'tf-2', statement: '', correctAnswer: false },
        ]
  );

  // Short answer
  const [shortAnswerKey, setShortAnswerKey] = useState(editingQuestion?.shortAnswerKey || '');

  // Essay rubric
  const [essayRubric, setEssayRubric] = useState(editingQuestion?.essayRubric || '');

  // Attachments
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachments, setAttachments] = useState<QuestionAttachment[]>(editingQuestion?.attachments || []);

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
    const newAtt: QuestionAttachment = {
      id: `att-${Date.now()}`,
      name: `Lampiran Gambar #${attachments.length + 1}`,
      type: 'image',
      url: attachmentUrl.trim(),
    };
    setAttachments((prev) => [...prev, newAtt]);
    setAttachmentUrl('');
  };

  const handleSave = (submitForReview: boolean) => {
    if (!prompt.trim()) {
      alert('Teks soal tidak boleh kosong!');
      return;
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const questionData: Partial<Question> = {
      code: code.trim() || undefined,
      type,
      subtest,
      topic: topic.trim() || 'Umum',
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
    setActiveTab(submitForReview ? 'antrian_review' : 'bank_soal');
  };

  // Get topic suggestions for current subtest
  const currentCategoryObj = categories.find((c) => c.name === subtest);
  const suggestedTopics = currentCategoryObj?.topics || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Breadcrumb & Status Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => {
              setEditingQuestionId(null);
              setActiveTab('bank_soal');
            }}
            className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Bank Soal</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {editingQuestion ? `Edit Soal (${editingQuestion.code})` : 'Penyusunan Soal Baru TKAD-Adiwerna'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dukungan formula LaTeX, gambar, multi-format jawaban, dan alur review berjenjang.
          </p>
        </div>

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
      </div>

      {editingQuestion?.status === 'disetujui' && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Soal ini sudah berstatus Disetujui (Approved)</p>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              Menyimpan perubahan pada soal ini akan secara otomatis menaikkan nomor versi (cth: v{editingQuestion.version} &rarr; v
              {Number(editingQuestion.version.split('.')[0]) + 1}.0) dan mengunci versi lama di riwayat versioning.
            </p>
          </div>
        </div>
      )}

      {editingQuestion?.status === 'perlu_revisi' && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-start space-x-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Catatan dari Reviewer (Perlu Revisi):</p>
            <p className="text-blue-800 dark:text-blue-300 mt-1 italic">
              &ldquo;{editingQuestion.reviews[0]?.generalComment || 'Silakan sesuaikan isi soal sesuai catatan review.'}&rdquo;
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
                Mata Pelajaran / Subtes *
              </label>
              <select
                value={subtest}
                onChange={(e) => {
                  const newSub = e.target.value;
                  setSubtest(newSub);
                  const matched = categories.find((c) => c.name === newSub);
                  if (matched && matched.topics.length > 0) {
                    setTopic(matched.topics[0]);
                  }
                }}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableSubtests.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic / Bahasan (INPUT MANUAL with suggestion chips) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Topik / Bahasan (Input Manual) *
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">Bebas ketik</span>
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ketik topik materi secara manual..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Suggestion Chips */}
              {suggestedTopics.length > 0 && (
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">
                    Saran topik untuk {subtest}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {suggestedTopics.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTopic(sug)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          topic === sug
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

            {/* Question Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipe Soal</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pilihan_ganda">Pilihan Ganda (Single Answer)</option>
                <option value="pilihan_ganda_kompleks">Pilihan Ganda Kompleks (Multi Answer)</option>
                <option value="menjodohkan">Menjodohkan (Matching Items)</option>
                <option value="benar_salah">Benar / Salah (True-False Statements)</option>
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
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kata Kunci / Tags (Pisahkan koma)</label>
              <input
                type="text"
                placeholder="misal: aljabar, persamaan, pecahan"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lampiran Gambar / Media</h3>
            <div className="flex space-x-2">
              <input
                type="url"
                placeholder="URL Gambar (https://...)"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 py-2 bg-slate-800 dark:bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-slate-900 dark:hover:bg-blue-500 transition cursor-pointer"
              >
                Tambah
              </button>
            </div>

            {/* Sample image helpers */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              <span>Preset contoh: </span>
              <button
                type="button"
                onClick={() =>
                  setAttachmentUrl('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=60')
                }
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1 cursor-pointer"
              >
                Diagram Geometri
              </button>
              <span className="mx-1">•</span>
              <button
                type="button"
                onClick={() =>
                  setAttachmentUrl('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60')
                }
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Grafik Batang
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {attachments.map((att, idx) => (
                  <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate text-slate-800 dark:text-slate-200">{att.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Question Content, Formula Inserter, and Answer Key */}
        <div className="lg:col-span-2 space-y-5">
          {/* Editor Body */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Teks Pertanyaan (Mendukung LaTeX KaTeX)
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

            {/* Question Prompt Textarea */}
            <textarea
              rows={5}
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
                  <span>Pratinjau Tampilan Teks & Rumus</span>
                </div>
                <div className="bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <LatexRenderer content={prompt} />
                  {attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {attachments.map((att) => (
                        <img
                          key={att.id}
                          src={att.url}
                          alt={att.name}
                          className="max-h-48 object-contain rounded border border-slate-200 dark:border-slate-700 mx-auto"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Type-Specific Answer Inputs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kunci Jawaban & Konstruksi Jawaban
            </h3>

            {/* Case: Pilihan Ganda & Pilihan Ganda Kompleks */}
            {(type === 'pilihan_ganda' || type === 'pilihan_ganda_kompleks') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {type === 'pilihan_ganda'
                      ? 'Pilih satu opsi sebagai kunci jawaban yang benar.'
                      : 'Centang semua opsi yang benar (jawaban jamak).'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Opsi</span>
                  </button>
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
                    {/* Correct Selector (Radio or Checkbox) */}
                    <div className="pt-2">
                      {type === 'pilihan_ganda' ? (
                        <input
                          type="radio"
                          name="correctOption"
                          checked={opt.isCorrect}
                          onChange={() => {
                            setOptions((prev) =>
                              prev.map((o) => ({
                                ...o,
                                isCorrect: o.id === opt.id,
                              }))
                            );
                          }}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={opt.isCorrect}
                          onChange={(e) => {
                            setOptions((prev) =>
                              prev.map((o) =>
                                o.id === opt.id ? { ...o, isCorrect: e.target.checked } : o
                              )
                            );
                          }}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                      )}
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {opt.label}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
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

                    {options.length > 2 && (
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

            {/* Case: Menjodohkan */}
            {type === 'menjodohkan' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Isi premis (Kolom Kiri) dan pasangan jawaban valid (Kolom Kanan).</span>
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
                </div>

                {matchingPairs.map((pair, idx) => (
                  <div key={pair.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-400 w-5">{idx + 1}.</span>
                    <input
                      type="text"
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
                    {matchingPairs.length > 2 && (
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

            {/* Case: Benar / Salah */}
            {type === 'benar_salah' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Daftar pernyataan dengan penetapan kunci Benar (B) atau Salah (S).</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTrueFalseItems((prev) => [
                        ...prev,
                        { id: `tf-${Date.now()}`, statement: '', correctAnswer: true },
                      ])
                    }
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pernyataan</span>
                  </button>
                </div>

                {trueFalseItems.map((tf, idx) => (
                  <div key={tf.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center space-x-3 text-xs">
                    <span className="font-bold text-slate-400 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="Teks pernyataan evaluasi (mendukung $rumus$)"
                      value={tf.statement}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTrueFalseItems((prev) =>
                          prev.map((item) => (item.id === tf.id ? { ...item, statement: val } : item))
                        );
                      }}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setTrueFalseItems((prev) =>
                            prev.map((item) => (item.id === tf.id ? { ...item, correctAnswer: true } : item))
                          )
                        }
                        className={`px-3 py-1 text-xs font-bold transition cursor-pointer ${
                          tf.correctAnswer ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        Benar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTrueFalseItems((prev) =>
                            prev.map((item) => (item.id === tf.id ? { ...item, correctAnswer: false } : item))
                          )
                        }
                        className={`px-3 py-1 text-xs font-bold transition cursor-pointer ${
                          !tf.correctAnswer ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        Salah
                      </button>
                    </div>
                    {trueFalseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setTrueFalseItems((prev) => prev.filter((_, i) => i !== idx))
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
