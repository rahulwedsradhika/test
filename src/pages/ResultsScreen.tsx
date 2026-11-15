import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PracticeResult, ReviewQuestion } from '../types';
import { submitPractice } from '../api';

export default function ResultsScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct' | 'unattempted'>('all');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Try retrieving from sessionStorage first
    const cached = sessionStorage.getItem(`ayur_result_${sessionId}`);
    if (cached) {
      try {
        setResult(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // If not cached, re-fetch via submitPractice endpoint
    submitPractice(sessionId)
      .then(res => {
        setResult(res);
        sessionStorage.setItem(`ayur_result_${sessionId}`, JSON.stringify(res));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [sessionId, navigate]);

  const filteredQuestions = useMemo(() => {
    if (!result) return [];
    return result.review.filter(q => {
      if (filter === 'correct') return q.is_correct;
      if (filter === 'incorrect') return !q.is_correct && !q.is_unattempted;
      if (filter === 'unattempted') return q.is_unattempted;
      return true;
    });
  }, [result, filter]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-600 text-sm font-medium">Calculating Authentic Results & Explanations...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-3xl mb-3"></i>
          <h2 className="text-lg font-bold text-stone-900 mb-2">Results Not Found</h2>
          <p className="text-xs text-stone-500 mb-6">We could not load scorecard data for this session.</p>
          <Link
            to="/"
            className="inline-flex px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Performance Badge
  const accuracy = result.accuracy_percent;
  let tier = { title: 'Needs Revision', color: 'bg-amber-100 text-amber-900 border-amber-200', icon: 'fa-book-bookmark' };
  if (accuracy >= 80) {
    tier = { title: 'Excellence Achieved (उत्कृष्ट)', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: 'fa-trophy' };
  } else if (accuracy >= 60) {
    tier = { title: 'Proficient Mastery (प्रवीण)', color: 'bg-blue-100 text-blue-900 border-blue-300', icon: 'fa-award' };
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Banner / Scorecard */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3 ${tier.color}`}>
              <i className={`fa-solid ${tier.icon}`}></i>
              {tier.title}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900 mb-1">
              Test Performance Scorecard
            </h1>
            <p className="text-xs text-stone-500">
              Scored under strict source-verified Ayurveda answer keys (+4 correct, -1 negative marking).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
            >
              Dashboard
            </Link>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition"
            >
              <i className="fa-solid fa-print mr-1.5"></i> Print Score
            </button>
          </div>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
            <div className="text-xs text-stone-500 font-medium mb-1">Final Score</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
              {result.total_score}
              <span className="text-xs font-normal text-stone-400 ml-1">/ {result.max_score}</span>
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
            <div className="text-xs text-stone-500 font-medium mb-1">Accuracy</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-600">
              {result.accuracy_percent}%
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80">
            <div className="text-xs text-emerald-700 font-medium mb-1">Correct Answers</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-emerald-800">
              {result.correct_count}
              <span className="text-xs font-normal text-emerald-600 ml-1">/ {result.total_questions}</span>
            </div>
          </div>

          <div className="bg-red-50/70 rounded-2xl p-4 border border-red-200/80">
            <div className="text-xs text-red-700 font-medium mb-1">Incorrect Answers</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-serif text-red-800">
              {result.incorrect_count}
              <span className="text-xs font-normal text-red-500 ml-1">({result.unattempted_count} left)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section Header & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-amber-600"></i>
          Question-by-Question Solution Review
        </h2>

        <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({result.review.length})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'incorrect' ? 'bg-white text-red-700 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Incorrect ({result.incorrect_count})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'correct' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Correct ({result.correct_count})
          </button>
          <button
            onClick={() => setFilter('unattempted')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'unattempted' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Unattempted ({result.unattempted_count})
          </button>
        </div>
      </div>

      {/* Detailed Review Cards */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => {
          let badge = { text: 'Correct (+4)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
          if (q.is_unattempted) {
            badge = { text: 'Unattempted (0)', color: 'bg-stone-100 text-stone-600 border-stone-200' };
          } else if (!q.is_correct) {
            badge = { text: 'Incorrect (-1)', color: 'bg-red-100 text-red-800 border-red-200' };
          }

          return (
            <div
              key={q.question_id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs hover:border-stone-300 transition"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md">
                    Q {idx + 1}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md font-bold border ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
                <span className="font-mono text-stone-400 text-[11px]">
                  ID: {q.source_qid || q.question_id.slice(0, 8)}
                </span>
              </div>

              {/* Question Stem */}
              <div
                className="text-stone-900 font-serif text-base sm:text-lg sm:leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: q.stem }}
              />

              {/* Options Breakdown */}
              <div className="space-y-2.5 mb-6">
                {q.options.map((opt, optIdx) => {
                  const isSelected = q.selected_options.includes(opt.option_id);
                  const isSourceCorrect = opt.is_correct;
                  const letter = String.fromCharCode(65 + optIdx);

                  let cardStyle = 'bg-stone-50 border-stone-200 text-stone-700';
                  let badgeStyle = 'bg-stone-200 text-stone-700';

                  if (isSourceCorrect) {
                    cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-400';
                    badgeStyle = 'bg-emerald-600 text-white font-bold';
                  } else if (isSelected && !isSourceCorrect) {
                    cardStyle = 'bg-red-50 border-red-400 text-red-950 font-medium ring-1 ring-red-400';
                    badgeStyle = 'bg-red-600 text-white font-bold';
                  }

                  return (
                    <div
                      key={opt.option_id}
                      className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border text-sm transition ${cardStyle}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${badgeStyle}`}>
                          {letter}
                        </span>
                        <div
                          className="pt-0.5 leading-snug"
                          dangerouslySetInnerHTML={{ __html: opt.text }}
                        />
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold pt-1">
                        {isSourceCorrect && (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <i className="fa-solid fa-check"></i> Correct Answer
                          </span>
                        )}
                        {isSelected && !isSourceCorrect && (
                          <span className="text-red-600 flex items-center gap-1">
                            <i className="fa-solid fa-xmark"></i> Your Choice
                          </span>
                        )}
                        {isSelected && isSourceCorrect && (
                          <span className="text-emerald-700 text-[11px]">
                            (Your Choice)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Source-Verified Explanation */}
              {q.explanation && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-stone-800">
                  <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                    <i className="fa-solid fa-lightbulb text-amber-600"></i>
                    Authentic Classical Solution & Reference:
                  </div>
                  <div
                    className="leading-relaxed font-sans text-stone-700 selection:bg-amber-200"
                    dangerouslySetInnerHTML={{ __html: q.explanation }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

