import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDailyAttemptResults } from '../api';
import { DailyAttemptSummary, DailyReviewQuestion } from '../types';

export const DailyTestResultScreen: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [attempt, setAttempt] = useState<DailyAttemptSummary | null>(null);
  const [questions, setQuestions] = useState<DailyReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter for review questions
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!attemptId) return;

    fetchDailyAttemptResults(attemptId)
      .then(res => {
        if (res.success) {
          setAttempt(res.attempt);
          setQuestions(res.questions);
        } else {
          setError('Failed to fetch test results.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching results:', err);
        setError(err.message || 'Failed to load test scorecard.');
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-[#E8E5DD] shadow-sm max-w-sm w-full">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#1A5344] mb-4"></i>
          <h2 className="text-base font-bold text-stone-800">Calculating Scorecard...</h2>
          <p className="text-xs text-[#64746D] mt-1">Scoring attempt against verified answer keys</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md w-full">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2 className="text-base font-bold text-stone-800">Result Not Found</h2>
          <p className="text-xs text-[#64746D] mt-2 mb-6">{error || 'Could not locate this attempt record.'}</p>
          <Link
            to="/daily-tests"
            className="px-5 py-2.5 rounded-xl bg-[#1A5344] text-white text-xs font-bold shadow-xs hover:bg-[#236856]"
          >
            Back to Daily Tests
          </Link>
        </div>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => {
    if (filter !== 'all' && q.status !== filter) return false;
    if (search) {
      const qText = q.stem.toLowerCase();
      const exp = (q.explanation || '').toLowerCase();
      const s = search.toLowerCase();
      return qText.includes(s) || exp.includes(s);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-16">
      {/* Hero Scorecard Banner */}
      <div className="bg-gradient-to-r from-[#1A5344] via-[#236856] to-[#2E8B70] text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/daily-tests"
              className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs hover:bg-white/30 transition-colors flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
              Daily Tests
            </Link>
            <span className="text-xs text-white/80 font-medium">Performance Evaluation</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight">
            {attempt.test_title}
          </h1>
          {attempt.test_subtitle && (
            <p className="text-xs sm:text-sm text-white/85 mt-1 font-sanskrit max-w-2xl">
              {attempt.test_subtitle}
            </p>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center backdrop-blur-xs">
              <div className="text-[11px] text-white/70 uppercase font-bold">Total Score</div>
              <div className="text-xl sm:text-2xl font-black font-outfit text-amber-300 mt-0.5">
                {attempt.score} <span className="text-xs text-white/60 font-normal">/ {attempt.max_marks}</span>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center backdrop-blur-xs">
              <div className="text-[11px] text-white/70 uppercase font-bold">Percentage</div>
              <div className="text-xl sm:text-2xl font-black font-outfit text-white mt-0.5">
                {attempt.percentage}%
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center backdrop-blur-xs">
              <div className="text-[11px] text-white/70 uppercase font-bold">Accuracy</div>
              <div className="text-xl sm:text-2xl font-black font-outfit text-sky-200 mt-0.5">
                {attempt.accuracy}%
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center backdrop-blur-xs">
              <div className="text-[11px] text-white/70 uppercase font-bold">Correct</div>
              <div className="text-xl sm:text-2xl font-black font-outfit text-emerald-300 mt-0.5">
                {attempt.correct_count}
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center backdrop-blur-xs">
              <div className="text-[11px] text-white/70 uppercase font-bold">Incorrect</div>
              <div className="text-xl sm:text-2xl font-black font-outfit text-rose-300 mt-0.5">
                {attempt.incorrect_count}
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center backdrop-blur-xs">
              <div className="text-[11px] text-white/70 uppercase font-bold">Unattempted</div>
              <div className="text-xl sm:text-2xl font-black font-outfit text-stone-200 mt-0.5">
                {attempt.unattempted_count}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Navigation & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-[#E8E5DD] shadow-xs">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E5DD]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-white text-[#1A5344] shadow-xs border border-[#E8E5DD]'
                  : 'text-[#64746D] hover:text-[#1A5344]'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'correct'
                  ? 'bg-white text-emerald-700 shadow-xs border border-[#E8E5DD]'
                  : 'text-[#64746D] hover:text-emerald-700'
              }`}
            >
              Correct ({attempt.correct_count})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'incorrect'
                  ? 'bg-white text-rose-700 shadow-xs border border-[#E8E5DD]'
                  : 'text-[#64746D] hover:text-rose-700'
              }`}
            >
              Incorrect ({attempt.incorrect_count})
            </button>
            <button
              onClick={() => setFilter('unattempted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'unattempted'
                  ? 'bg-white text-stone-700 shadow-xs border border-[#E8E5DD]'
                  : 'text-[#64746D] hover:text-stone-700'
              }`}
            >
              Skipped ({attempt.unattempted_count})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search in questions or citations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-xs focus:outline-hidden focus:border-[#1A5344] focus:bg-white text-stone-800"
            />
          </div>
        </div>

        {/* Detailed Questions Review List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-10 text-center text-[#64746D]">
              <i className="fa-solid fa-filter text-2xl text-stone-300 mb-2"></i>
              <p className="text-xs font-semibold">No questions match the selected filter.</p>
            </div>
          ) : (
            filteredQuestions.map(q => {
              const isCorrect = q.status === 'correct';
              const isIncorrect = q.status === 'incorrect';
              const isUnattempted = q.status === 'unattempted';

              return (
                <div
                  key={q.question_uid}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
                    isCorrect
                      ? 'border-emerald-200'
                      : isIncorrect
                      ? 'border-rose-200'
                      : 'border-[#E8E5DD]'
                  }`}
                >
                  {/* Question Status Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DD] mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-[#FAF9F5] text-stone-700 border border-[#E8E5DD]">
                        Question {q.position}
                      </span>
                      {isCorrect && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i> Correct (+4.0)
                        </span>
                      )}
                      {isIncorrect && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <i className="fa-solid fa-circle-xmark"></i> Incorrect (-1.0)
                        </span>
                      )}
                      {isUnattempted && (
                        <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 flex items-center gap-1">
                          <i className="fa-regular fa-circle"></i> Unattempted (0.0)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Stem */}
                  <div
                    className="text-base text-stone-900 leading-relaxed font-serif prose prose-stone max-w-none mb-5"
                    dangerouslySetInnerHTML={{ __html: q.stem }}
                  />

                  {/* 4 Options */}
                  <div className="space-y-2 mb-4">
                    {q.options.map(opt => {
                      const isStudentChoice = q.student_selected_position === opt.position;
                      const isCorrectAnswer = q.correct_answer_position === opt.position;

                      let optStyle = 'bg-[#FAF9F5] border-[#E8E5DD] text-stone-800';
                      let badgeStyle = 'border-stone-300 text-stone-600';

                      if (isCorrectAnswer) {
                        optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400 font-medium';
                        badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                      } else if (isStudentChoice && !isCorrectAnswer) {
                        optStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-medium';
                        badgeStyle = 'bg-rose-600 text-white border-rose-600';
                      }

                      return (
                        <div
                          key={opt.option_uid}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 text-sm ${optStyle}`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${badgeStyle}`}>
                            {String.fromCharCode(64 + opt.position)}
                          </div>
                          <div
                            className="flex-1 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: opt.text }}
                          />
                          {isCorrectAnswer && (
                            <span className="text-xs font-bold text-emerald-700 shrink-0 flex items-center gap-1 self-center">
                              <i className="fa-solid fa-check"></i> Correct Key
                            </span>
                          )}
                          {isStudentChoice && !isCorrectAnswer && (
                            <span className="text-xs font-bold text-rose-600 shrink-0 flex items-center gap-1 self-center">
                              <i className="fa-solid fa-xmark"></i> Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Classical Commentary & Citation */}
                  {q.explanation && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                      <i className="fa-solid fa-book-open text-amber-700 mt-0.5 text-sm shrink-0"></i>
                      <div>
                        <span className="font-bold text-amber-900 block mb-0.5">Classical Reference / व्याख्या:</span>
                        <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyTestResultScreen;
