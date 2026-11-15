import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchTagwiseResults } from '../api';
import { TagwiseScorecard, TagwiseReviewQuestion } from '../types';

export const TagwiseResultScreen: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [scorecard, setScorecard] = useState<TagwiseScorecard | null>(null);
  const [questions, setQuestions] = useState<TagwiseReviewQuestion[]>([]);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    setLoading(true);
    fetchTagwiseResults(attemptId)
      .then(res => {
        setScorecard(res.attempt);
        setQuestions(res.questions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching results:', err);
        setError('Failed to load examination results.');
        setLoading(false);
      });
  }, [attemptId]);

  const filteredQuestions = questions.filter(q => {
    if (filter === 'correct') return q.is_correct;
    if (filter === 'incorrect') return q.selected_position !== null && !q.is_correct;
    if (filter === 'unattempted') return q.selected_position === null;
    return true;
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-[#1A5344]"></i>
        <p className="text-sm font-medium text-[#64746D]">Compiling your official scorecard & classical solutions...</p>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 className="font-outfit font-bold text-lg text-gray-800">Results Unavailable</h3>
        <p className="text-xs text-gray-500">{error || 'Attempt result record not found.'}</p>
        <Link
          to="/tagwise"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#1A5344] text-white text-xs font-bold shadow-xs hover:bg-[#2A7B62]"
        >
          Back to Tagwise Bank
        </Link>
      </div>
    );
  }

  const isPass = scorecard.score >= (scorecard.total_marks * 0.5);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#64746D]">
        <Link to="/" className="hover:text-[#1A5344]">Home</Link>
        <span>/</span>
        <Link to="/tagwise" className="hover:text-[#1A5344]">Tagwise Question Bank</Link>
        <span>/</span>
        <span className="text-[#1A5344] font-semibold">Scorecard & Review</span>
      </nav>

      {/* Main Scorecard Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A5344] via-[#205E4E] to-[#133D32] text-white p-8 sm:p-10 shadow-xl border border-[#2A7B62]/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-[#A7F3D0] border border-white/15">
              Official Evaluation
            </span>
            <h1 className="font-outfit font-bold text-2xl sm:text-4xl text-white">
              {scorecard.tag_label}
            </h1>
            <p className="text-xs text-white/70">
              Completed on {new Date(scorecard.submitted_at).toLocaleDateString()} at {new Date(scorecard.submitted_at).toLocaleTimeString()} • Time: {formatTime(scorecard.time_spent_seconds)}
            </p>
          </div>

          {/* Big Score Display */}
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shrink-0">
            <div className="text-xs text-white/80 font-medium uppercase tracking-wider">Your Final Score</div>
            <div className="text-3xl sm:text-5xl font-outfit font-bold text-white mt-0.5">
              {scorecard.score}
              <span className="text-lg text-white/60 font-normal"> / {scorecard.total_marks}</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#A7F3D0]">
              <i className="fa-solid fa-bullseye"></i>
              <span>{scorecard.accuracy_percent}% Accuracy</span>
            </div>
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/15 text-center">
          <div className="bg-white/5 p-3 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold font-outfit text-[#34D399]">{scorecard.correct_count}</div>
            <div className="text-[11px] text-white/70 font-medium">Correct (+{scorecard.correct_count * 4})</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold font-outfit text-rose-300">{scorecard.incorrect_count}</div>
            <div className="text-[11px] text-white/70 font-medium">Incorrect (-{scorecard.incorrect_count * 1})</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <div className="text-xl sm:text-2xl font-bold font-outfit text-amber-300">{scorecard.unattempted_count}</div>
            <div className="text-[11px] text-white/70 font-medium">Unattempted (0)</div>
          </div>
        </div>
      </div>

      {/* Review Filter Tabs & CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8E5DD] shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-[#1A5344] text-white' : 'bg-[#FAF9F5] text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'correct' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Correct ({scorecard.correct_count})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'incorrect' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Incorrect ({scorecard.incorrect_count})
          </button>
          <button
            onClick={() => setFilter('unattempted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'unattempted' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unattempted ({scorecard.unattempted_count})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/tagwise/${scorecard.tag_id}?launch=practice`)}
            className="px-4 py-2 rounded-xl bg-[#1A5344] text-white text-xs font-bold hover:bg-[#2A7B62] shadow-xs flex items-center gap-1.5"
          >
            <i className="fa-solid fa-arrow-rotate-right text-xs"></i>
            <span>Practice Again</span>
          </button>
          <Link
            to="/tagwise"
            className="px-4 py-2 rounded-xl border border-[#E8E5DD] bg-white text-gray-700 text-xs font-bold hover:bg-[#FAF9F5]"
          >
            Back to Bank
          </Link>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-6">
        {filteredQuestions.map(q => {
          const isUserCorrect = q.is_correct;
          const isUnattempted = q.selected_position === null;

          return (
            <div
              key={q.question_uid}
              className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 transition-all ${
                isUserCorrect
                  ? 'border-emerald-300'
                  : isUnattempted
                  ? 'border-gray-200'
                  : 'border-rose-300'
              }`}
            >
              {/* Question Header Status */}
              <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">Question {q.index}</span>
                  <span className="font-mono text-gray-400">({q.question_uid})</span>
                </div>
                <div>
                  {isUserCorrect ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-check text-xs"></i> Correct (+4)
                    </span>
                  ) : isUnattempted ? (
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-minus text-xs"></i> Unattempted (0)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-xmark text-xs"></i> Incorrect (-1)
                    </span>
                  )}
                </div>
              </div>

              {/* Stem */}
              <div
                className="text-sm sm:text-base text-gray-800 leading-relaxed font-sanskrit prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: q.stem }}
              />

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {q.options.map(opt => {
                  const isCorrectAnswer = opt.is_correct;
                  const isSelectedByUser = q.selected_position === opt.position;

                  let optClass = 'bg-[#FAF9F5]/60 border-[#E8E5DD] text-gray-700';
                  if (isCorrectAnswer) {
                    optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                  } else if (isSelectedByUser) {
                    optClass = 'bg-rose-50 border-rose-400 text-rose-900 font-medium ring-1 ring-rose-400';
                  }

                  return (
                    <div
                      key={opt.position}
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${optClass}`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCorrectAnswer
                            ? 'bg-emerald-600 text-white'
                            : isSelectedByUser
                            ? 'bg-rose-600 text-white'
                            : 'bg-[#E8E5DD] text-[#1A5344]'
                        }`}
                      >
                        {String.fromCharCode(64 + opt.position)}
                      </span>
                      <div className="flex-1 leading-snug">
                        <div dangerouslySetInnerHTML={{ __html: opt.text }} />
                        {isSelectedByUser && (
                          <span className="text-[10px] uppercase font-bold text-gray-600 block mt-1">
                            Your Selection
                          </span>
                        )}
                      </div>
                      {isCorrectAnswer && (
                        <i className="fa-solid fa-check text-emerald-600 text-sm shrink-0"></i>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Classical Explanation */}
              {q.explanation && (
                <div className="mt-3 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                  <i className="fa-solid fa-book-open text-emerald-700 text-sm mt-0.5"></i>
                  <div>
                    <span className="font-bold text-emerald-900 block mb-0.5">
                      Classical Shastra Reference & Justification:
                    </span>
                    <span className="leading-relaxed">{q.explanation}</span>
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
