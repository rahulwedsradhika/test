import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTestResult } from '../api';
import { ExamScorecard, ExamReviewQuestion } from '../types';

export default function TestResultScreen() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [scorecard, setScorecard] = useState<ExamScorecard | null>(null);
  const [questions, setQuestions] = useState<ExamReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!attemptId) return;
    async function loadResult() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTestResult(attemptId!);
        setScorecard(data.scorecard);
        setQuestions(data.questions);
      } catch (err: any) {
        setError(err.message || 'Failed to load test results');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  const toggleBookmark = (qid: string) => {
    setBookmarked(prev => ({
      ...prev,
      [qid]: !prev[qid]
    }));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#1A5344] mb-3"></i>
        <p className="text-stone-600 text-sm">Evaluating test results and preparing scorecard...</p>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <div className="font-bold mb-1">Result Error</div>
          {error || 'Unable to retrieve test results for this attempt.'}
          <div className="mt-4">
            <Link to="/test-series" className="underline font-semibold">Back to Test Series</Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => {
    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'CORRECT' && q.is_correct) ||
      (filterType === 'INCORRECT' && q.is_attempted && !q.is_correct) ||
      (filterType === 'UNATTEMPTED' && !q.is_attempted);

    const matchesSearch =
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const formatMinutes = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const percentage = Math.round((scorecard.score / (scorecard.total_marks || 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <Link to="/" className="hover:text-[#1A5344] transition-colors">Home</Link>
        <span>/</span>
        <Link to="/test-series" className="hover:text-[#1A5344] transition-colors">Test Series</Link>
        <span>/</span>
        <span className="text-stone-800 font-semibold">Scorecard & Solutions</span>
      </nav>

      {/* Hero Scorecard Card */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] shadow-sm overflow-hidden mb-8">
        <div className="bg-gradient-to-br from-[#1A5344] to-[#123B30] text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-white/10">
                Examination Completed
              </span>
              <h1 className="text-2xl sm:text-3xl font-outfit font-extrabold mt-2">
                {scorecard.test_title}
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                {scorecard.series_title} • Session {scorecard.session}
              </p>
            </div>

            {/* Score Pill */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 sm:min-w-[160px]">
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Total Score</span>
              <div className="text-3xl font-outfit font-black text-amber-300 mt-0.5">
                {scorecard.score}
                <span className="text-sm font-semibold text-white/80"> / {scorecard.total_marks}</span>
              </div>
              <span className="text-[11px] text-white/90 font-medium">
                {percentage}% Score • {scorecard.accuracy_percent}% Accuracy
              </span>
            </div>
          </div>

          {/* Detailed Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-center text-xs">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-emerald-300 text-[10px] uppercase font-bold block flex items-center justify-center gap-1">
                <i className="fa-solid fa-check"></i> Correct
              </span>
              <strong className="text-xl font-extrabold text-white mt-1 block">
                {scorecard.correct_count}
              </strong>
              <span className="text-[10px] text-emerald-200">+{scorecard.correct_count * 4} Marks</span>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-rose-300 text-[10px] uppercase font-bold block flex items-center justify-center gap-1">
                <i className="fa-solid fa-xmark"></i> Incorrect
              </span>
              <strong className="text-xl font-extrabold text-white mt-1 block">
                {scorecard.incorrect_count}
              </strong>
              <span className="text-[10px] text-rose-200">-{scorecard.incorrect_count * 1} Penalty</span>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-stone-300 text-[10px] uppercase font-bold block flex items-center justify-center gap-1">
                <i className="fa-solid fa-minus"></i> Unattempted
              </span>
              <strong className="text-xl font-extrabold text-white mt-1 block">
                {scorecard.unattempted_count}
              </strong>
              <span className="text-[10px] text-stone-300">0 Marks</span>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-amber-200 text-[10px] uppercase font-bold block flex items-center justify-center gap-1">
                <i className="fa-solid fa-stopwatch"></i> Time Taken
              </span>
              <strong className="text-xl font-extrabold text-white mt-1 block">
                {formatMinutes(scorecard.time_spent_seconds)}
              </strong>
              <span className="text-[10px] text-amber-200">120m Allotted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Solutions Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Category Tabs */}
        <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'ALL'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setFilterType('CORRECT')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'CORRECT'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-800 hover:bg-stone-200/50'
            }`}
          >
            Correct ({scorecard.correct_count})
          </button>
          <button
            onClick={() => setFilterType('INCORRECT')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'INCORRECT'
                ? 'bg-rose-700 text-white shadow-xs font-bold'
                : 'text-rose-800 hover:bg-stone-200/50'
            }`}
          >
            Incorrect ({scorecard.incorrect_count})
          </button>
          <button
            onClick={() => setFilterType('UNATTEMPTED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'UNATTEMPTED'
                ? 'bg-stone-800 text-white shadow-xs font-bold'
                : 'text-stone-600 hover:bg-stone-200/50'
            }`}
          >
            Unattempted ({scorecard.unattempted_count})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search questions or citations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-[#E8E5DD] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5344]/20"
          />
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-4">
        {filteredQuestions.map(q => {
          const isUserCorrect = q.is_correct;
          const isUserAttempted = q.is_attempted;
          const isFavorited = bookmarked[q.local_question_id];

          return (
            <div
              key={q.local_question_id}
              className={`p-6 rounded-3xl border transition-all bg-white ${
                isUserCorrect
                  ? 'border-emerald-200 shadow-xs'
                  : isUserAttempted
                  ? 'border-rose-200 shadow-xs'
                  : 'border-[#E8E5DD]'
              }`}
            >
              {/* Question Top Header */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-outfit font-extrabold text-sm text-stone-900">
                    Q.{q.question_position}
                  </span>
                  {isUserCorrect ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      <i className="fa-solid fa-circle-check mr-1"></i> Correct (+4)
                    </span>
                  ) : isUserAttempted ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200">
                      <i className="fa-solid fa-circle-xmark mr-1"></i> Incorrect (-1)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md">
                      <i className="fa-solid fa-circle-minus mr-1"></i> Unattempted (0)
                    </span>
                  )}
                </div>

                {/* Bookmark Toggle */}
                <button
                  type="button"
                  onClick={() => toggleBookmark(q.local_question_id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    isFavorited
                      ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold'
                      : 'text-stone-400 hover:text-stone-700 border-stone-200'
                  }`}
                >
                  <i className={`fa-${isFavorited ? 'solid' : 'regular'} fa-bookmark`}></i>
                  <span className="hidden sm:inline">{isFavorited ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div
                className="text-stone-900 font-serif text-base sm:text-lg leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: q.question_text }}
              />

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                {q.options.map(opt => {
                  const isCorrectAnswer = opt.position === q.correct_answer;
                  const isUserSelection = opt.position === q.user_answer;
                  const optionLetters = ['A', 'B', 'C', 'D'];
                  const letter = optionLetters[opt.position - 1] || String(opt.position);

                  let optClass = 'border-stone-200 bg-stone-50/50 text-stone-700';
                  if (isCorrectAnswer) {
                    optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500/20';
                  } else if (isUserSelection && !isCorrectAnswer) {
                    optClass = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold';
                  }

                  return (
                    <div
                      key={opt.position}
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${optClass}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isCorrectAnswer
                          ? 'bg-emerald-600 text-white'
                          : isUserSelection
                          ? 'bg-rose-600 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        {letter}
                      </div>

                      <div className="flex-1 leading-normal" dangerouslySetInnerHTML={{ __html: opt.option_text }} />

                      {isCorrectAnswer && (
                        <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                          Correct
                        </span>
                      )}
                      {isUserSelection && !isCorrectAnswer && (
                        <span className="text-[10px] font-extrabold uppercase text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Classical Reference & Explanation Citation */}
              {(q.explanation || q.reference?.subject || q.reference?.samhita) && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 text-xs text-stone-700">
                  <div className="font-bold text-[#1A5344] uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-book-open"></i>
                    Classical Reference & Commentary
                  </div>
                  {q.explanation && (
                    <div className="font-sanskrit text-stone-800 text-sm font-medium">
                      {q.explanation}
                    </div>
                  )}
                  {q.reference?.subject && (
                    <div className="text-[11px] text-stone-500 mt-1">
                      Subject / Discipline: <span className="font-semibold text-stone-700">{q.reference.subject}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-stone-200">
        <Link
          to="/test-series"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-xs"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Return to Test Series</span>
        </Link>

        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1A5344] hover:bg-[#133F34] text-white font-bold text-xs shadow-md"
        >
          <span>Explore All Question Banks</span>
          <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}
