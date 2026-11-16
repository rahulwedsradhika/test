import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPYPResults } from '../api';
import { PYPScorecard, PYPReviewQuestion } from '../types';

export const PreviousYearsResultScreen: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<PYPScorecard | null>(null);
  const [questions, setQuestions] = useState<PYPReviewQuestion[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'incorrect' | 'correct' | 'unattempted'>('all');

  useEffect(() => {
    if (!attemptId) return;
    setLoading(true);
    fetchPYPResults(attemptId)
      .then(res => {
        if (res.success) {
          setScorecard(res.scorecard);
          setQuestions(res.questions || []);
        } else {
          setError('Could not retrieve results.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching PYP results:', err);
        setError('Failed to load scorecard and answers.');
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-emerald-600"></i>
        <p className="text-stone-600 font-medium">Computing official scorecard and classical references...</p>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
          <i className="fa-solid fa-circle-exclamation text-4xl text-red-600"></i>
          <h2 className="text-xl font-bold text-red-900 font-outfit">Results Unavailable</h2>
          <p className="text-sm text-red-700">{error || 'Attempt could not be found.'}</p>
          <Link
            to="/previous-years"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
          >
            <span>Return to Previous Year Papers</span>
          </Link>
        </div>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => {
    if (activeFilter === 'correct') return q.is_correct;
    if (activeFilter === 'incorrect') return q.is_attempted && !q.is_correct;
    if (activeFilter === 'unattempted') return !q.is_attempted;
    return true;
  });

  const durationMin = Math.round(scorecard.time_spent_seconds / 60);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 font-medium">
          <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
          <i className="fa-solid fa-chevron-right text-[10px] text-stone-400"></i>
          <Link to="/previous-years" className="hover:text-emerald-700 transition-colors">Previous Year Papers</Link>
          <i className="fa-solid fa-chevron-right text-[10px] text-stone-400"></i>
          <span className="text-stone-800 font-semibold">Examination Scorecard</span>
        </div>

        <Link
          to="/previous-years"
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
        >
          <i className="fa-solid fa-arrow-left mr-1.5"></i>
          <span>Choose Another Paper</span>
        </Link>
      </div>

      {/* Scorecard Hero Card */}
      <div className="bg-gradient-to-br from-[#1A5344] via-[#205E4E] to-[#133D32] rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 text-emerald-200 border border-white/20">
                Official Examination Summary
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-white mt-2">
                {scorecard.test_title}
              </h1>
              {scorecard.exam_year && (
                <p className="text-xs text-white/80 mt-1">
                  Exam Year: <span className="font-semibold text-amber-300">#{scorecard.exam_year}</span> • Duration: {durationMin} min
                </p>
              )}
            </div>

            {/* Score Metric Pill */}
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center">
              <div className="text-xs text-white/80 font-bold uppercase tracking-wider">Final Score</div>
              <div className="text-3xl sm:text-4xl font-extrabold font-outfit text-amber-300">
                {scorecard.score} <span className="text-base font-normal text-white/70">/ {scorecard.max_marks}</span>
              </div>
              <div className="text-xs text-emerald-200 font-semibold mt-0.5">
                Accuracy: {scorecard.accuracy_percent}%
              </div>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15 text-center">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-xs text-white/70">Correct Answers</div>
              <div className="text-xl font-bold text-emerald-300 font-outfit">{scorecard.correct_count}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-xs text-white/70">Incorrect Answers</div>
              <div className="text-xl font-bold text-red-300 font-outfit">{scorecard.incorrect_count}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-xs text-white/70">Unattempted</div>
              <div className="text-xl font-bold text-stone-300 font-outfit">{scorecard.unattempted_count}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-xs text-white/70">Time Spent</div>
              <div className="text-xl font-bold text-teal-200 font-outfit">{durationMin} min</div>
            </div>
          </div>
        </div>
      </div>

      {/* Solutions Review Header & Filter Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-base sm:text-lg font-bold font-outfit text-stone-900 flex items-center gap-2">
          <i className="fa-solid fa-book-open-reader text-emerald-700"></i>
          <span>Classical Solutions & Commentary Review</span>
        </h2>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#1A5344] text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => setActiveFilter('incorrect')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'incorrect'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Incorrect ({scorecard.incorrect_count})
          </button>
          <button
            onClick={() => setActiveFilter('correct')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'correct'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Correct ({scorecard.correct_count})
          </button>
          <button
            onClick={() => setActiveFilter('unattempted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'unattempted'
                ? 'bg-stone-700 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Unattempted ({scorecard.unattempted_count})
          </button>
        </div>
      </div>

      {/* Question Solutions Cards */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => {
          let statusBadge = (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
              Unattempted
            </span>
          );
          if (q.is_attempted) {
            statusBadge = q.is_correct ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <i className="fa-solid fa-check text-[10px]"></i> Correct (+4.0)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <i className="fa-solid fa-xmark text-[10px]"></i> Incorrect (-1.0)
              </span>
            );
          }

          return (
            <div
              key={q.question_uid}
              className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-stone-100 text-stone-700 font-mono font-bold text-xs">
                    Q #{q.position || (idx + 1)}
                  </span>
                  {statusBadge}
                </div>

                {q.structure?.sam && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    {q.structure.sam} {q.structure.sth ? `• ${q.structure.sth}` : ''}
                  </span>
                )}
              </div>

              {/* Question Stem */}
              <div className="text-stone-900 text-base sm:text-lg leading-relaxed font-serif font-medium whitespace-pre-line">
                <div dangerouslySetInnerHTML={{ __html: q.stem }} />
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-1">
                {q.options.map(opt => {
                  const isUserSelection = q.user_choice === opt.key;
                  const isTrueCorrect = opt.is_correct;

                  let optClass = 'bg-stone-50/70 border-stone-200 text-stone-800';
                  if (isTrueCorrect) {
                    optClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                  } else if (isUserSelection && !isTrueCorrect) {
                    optClass = 'bg-red-50 border-red-400 text-red-950';
                  }

                  return (
                    <div
                      key={opt.position}
                      className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${optClass}`}
                    >
                      <div className="flex items-start gap-2.5 text-sm sm:text-base leading-snug">
                        <span className="font-bold text-stone-500 font-mono">({opt.key})</span>
                        <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isTrueCorrect && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                            Correct Key
                          </span>
                        )}
                        {isUserSelection && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isTrueCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-200 text-red-800'
                          }`}>
                            Your Choice
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Commentary & Explanation Box */}
              {q.explanation && (
                <div className="bg-[#FAF9F5] rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wide">
                    <i className="fa-solid fa-scroll text-amber-600"></i>
                    <span>Classical Commentary & Samhita Citation:</span>
                  </div>
                  <div className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif whitespace-pre-line">
                    <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousYearsResultScreen;

