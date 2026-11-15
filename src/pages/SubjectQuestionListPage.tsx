import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSubject, fetchQuestionsForNode } from '../api';
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
    is_correct?: boolean;
  }[];
  explanation?: string;
  media?: {
    type: string;
    placement: string;
    url: string;
  }[];
}

export default function SubjectQuestionListPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<(NodeDetail & { display_name: string; expected_count: number }) | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const limit = 30;

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);

    Promise.all([
      fetchSubject(subjectId),
      fetchQuestionsForNode(subjectId, limit, page * limit, search, true)
    ])
      .then(([subData, qData]) => {
        setSubject(subData);
        setQuestions(qData.questions);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [subjectId, page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  if (loading && !subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-12 h-12 border-4 border-[#1A5344] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-500 text-sm">Loading authentic Subjectwise questions...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-red-500">Subject category not found.</p>
        <button
          onClick={() => navigate('/?tab=subjects')}
          className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm"
        >
          Return to Subject Directory
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil((subject.validated_count || 1) / limit);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      <Breadcrumbs items={subject.breadcrumbs} />

      {/* Subject Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E8E5DD]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9F5] text-[#1A5344] border border-[#1A5344]/15">
                Subjectwise Discipline
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
                Direct Verified Ingestion
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
              {subject.display_name || subject.name_en}
            </h1>
            <p className="text-xs text-stone-500 flex flex-wrap items-center gap-3">
              <span>
                <strong className="text-stone-800">{subject.validated_count.toLocaleString()}</strong> Validated Questions
              </span>
              <span>•</span>
              <span>
                Expected: <strong className="text-stone-800">{subject.expected_count.toLocaleString()}</strong>
              </span>
              <span>•</span>
              <span>
                Coverage: <strong className="text-emerald-700">{subject.coverage_percent}%</strong>
              </span>
              <span>•</span>
              <span className="text-stone-400">Direct Question Bank (No Sthanas)</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                showAnswers
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <i className={`fa-solid ${showAnswers ? 'fa-eye-slash' : 'fa-eye'} mr-1.5`}></i>
              {showAnswers ? 'Hide Answers' : 'Show Answer Keys'}
            </button>

            <button
              onClick={() => setModalOpen(true)}
              disabled={subject.validated_count === 0}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition ${
                subject.validated_count > 0
                  ? 'bg-[#1A5344] hover:bg-[#133D32] text-white shadow-emerald-900/20 cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-play"></i>
              Practice This Subject
            </button>
          </div>
        </div>
      </div>

      {/* Questions Filter & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E5DD] flex items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search within ${subject.display_name} (e.g. dosha, dravya, chikitsa, yoga)...`}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5344]/30 focus:border-[#1A5344]"
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
            <p className="text-stone-500 text-sm">No questions matched your search query.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.question_id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 hover:border-emerald-300 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                  #{page * limit + idx + 1} • {q.question_id}
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  AyurQuest ID: {q.source_qid}
                </span>
              </div>

              {/* Stem with proper HTML rendering */}
              <div
                className="text-stone-900 text-base font-serif mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: q.stem }}
              />

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isCorrect = opt.is_correct;
                  return (
                    <div
                      key={opt.option_id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition ${
                        showAnswers && isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium'
                          : 'bg-stone-50/50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        showAnswers && isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-stone-300 text-stone-600'
                      }`}>
                        {letter}
                      </span>
                      <div
                        className="flex-1"
                        dangerouslySetInnerHTML={{ __html: opt.text }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Verified Explanation & Classical Citation */}
              {showAnswers && q.explanation && (
                <div className="mt-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                  <div
                    dangerouslySetInnerHTML={{ __html: q.explanation }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-stone-200">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              page === 0
                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-chevron-left mr-1"></i> Previous Page
          </button>

          <span className="text-xs text-stone-600 font-medium">
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              page >= totalPages - 1
                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 cursor-pointer'
            }`}
          >
            Next Page <i className="fa-solid fa-chevron-right ml-1"></i>
          </button>
        </div>
      )}

      {/* Practice Configuration Modal */}
      <PracticeConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        nodeId={subject.id}
        nodeTitle={subject.display_name || subject.name_en}
        maxAvailable={subject.validated_count}
        mode="chapter"
      />
    </div>
  );
}
