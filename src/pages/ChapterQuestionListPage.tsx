import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchNode, fetchQuestionsForNode } from '../api';
import { NodeDetail } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import PracticeConfigModal from '../components/PracticeConfigModal';

interface QuestionItem {
  question_id: string;
  source_qid: string;
  stem: string;
  options: {
    option_id: string;
    position: number;
    text: string;
  }[];
}

export default function ChapterQuestionListPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<NodeDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);

    Promise.all([
      fetchNode(chapterId),
      fetchQuestionsForNode(chapterId, limit, page * limit, search)
    ])
      .then(([nodeData, qData]) => {
        setChapter(nodeData);
        setQuestions(qData.questions);
        setTotalQuestions(qData.count);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [chapterId, page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  if (loading && !chapter) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-500 text-sm">Loading authentic chapter questions...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-red-500">Chapter not found.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm"
        >
          Return Home
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil((chapter.validated_count || 1) / limit);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Breadcrumbs items={chapter.breadcrumbs} />

      {/* Chapter Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                {chapter.chapter_number !== null ? `Adhyaya ${chapter.chapter_number}` : 'Section'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
                Verified AyurQuest Source
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900 mb-1">
              {chapter.name_en}
            </h1>
            {chapter.name_hi && (
              <p className="text-lg font-devanagari text-amber-900 font-medium">
                {chapter.name_hi}
              </p>
            )}
            <p className="text-xs text-stone-500 mt-3 flex items-center gap-4">
              <span>
                <strong className="text-stone-800">{chapter.validated_count}</strong> Verified Questions
              </span>
              <span>•</span>
              <span>
                Expected: <strong className="text-stone-800">{chapter.expected_count}</strong>
              </span>
              <span>•</span>
              <span>
                Match: <strong className="text-emerald-700">{chapter.coverage_percent}%</strong>
              </span>
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            disabled={chapter.validated_count === 0}
            className={`shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition ${
              chapter.validated_count > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-amber-500/25 cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-play"></i>
            Practice This Adhyaya
          </button>
        </div>
      </div>

      {/* Questions Filter & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6 flex items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search within this adhyaya (e.g. rasa, dosha, agni, sutra)..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </form>

        <span className="text-xs text-stone-500 font-medium shrink-0">
          Showing {questions.length} questions
        </span>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
            <i className="fa-solid fa-book-open text-stone-300 text-3xl mb-3"></i>
            <h3 className="text-base font-semibold text-stone-800 mb-1">No Questions Found</h3>
            <p className="text-xs text-stone-500">
              {chapter.validated_count === 0
                ? 'Questions for this chapter are actively being ingested afresh from source.'
                : 'No questions matched your search query.'}
            </p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.question_id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-stone-300 transition"
            >
              <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
                <span className="font-semibold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md">
                  Q {page * limit + idx + 1}
                </span>
                <span className="font-mono text-[11px] text-stone-400">
                  ID: {q.source_qid || q.question_id.slice(0, 8)}
                </span>
              </div>

              {/* Stem */}
              <div
                className="text-stone-900 font-medium text-sm sm:text-base leading-relaxed mb-4 font-sans"
                dangerouslySetInnerHTML={{ __html: q.stem }}
              />

              {/* Options Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={opt.option_id}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-800"
                  >
                    <span className="w-5 h-5 rounded-md bg-stone-200 text-stone-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span
                      className="leading-snug pt-0.5"
                      dangerouslySetInnerHTML={{ __html: opt.text }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-stone-200 text-xs text-stone-600">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            <i className="fa-solid fa-chevron-left mr-1.5"></i> Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            Next <i className="fa-solid fa-chevron-right ml-1.5"></i>
          </button>
        </div>
      )}

      {/* Practice Configuration Modal */}
      <PracticeConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        nodeId={chapter.id}
        nodeTitle={chapter.name_en}
        maxAvailable={chapter.validated_count}
        mode="chapter"
      />
    </div>
  );
}
