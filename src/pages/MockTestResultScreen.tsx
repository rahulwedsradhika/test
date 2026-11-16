import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMockAttemptResults } from '../api';
import { MockAttemptSummary, MockReviewQuestion } from '../types';

export const MockTestResultScreen: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [attempt, setAttempt] = useState<MockAttemptSummary | null>(null);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<MockReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for review questions
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!attemptId) return;

    fetchMockAttemptResults(attemptId)
      .then(res => {
        if (res.success) {
          setAttempt(res.attempt);
          setTest(res.test);
          setQuestions(res.questions);
        } else {
          setError('Failed to fetch test results.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching mock results:', err);
        setError(err.message || 'Failed to load test scorecard.');
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-xs max-w-sm w-full">
          <div className="w-10 h-10 border-4 border-[#1A5344] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-bold text-gray-800 font-serif">Calculating Scorecard...</h2>
          <p className="text-xs text-gray-500 mt-1">Grading response against verified classical answer keys</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md w-full">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            ✕
          </div>
          <h2 className="text-base font-bold text-gray-800 font-serif">Scorecard Not Found</h2>
          <p className="text-xs text-gray-500 mt-2 mb-6">{error || 'Could not locate this attempt record.'}</p>
          <Link
            to="/mock-tests"
            className="px-5 py-2.5 rounded-xl bg-[#1A5344] text-white text-xs font-bold shadow-xs hover:bg-[#236856]"
          >
            ← Return to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => {
    if (filter === 'correct' && !q.is_correct) return false;
    if (filter === 'incorrect' && (q.is_correct || q.is_unattempted)) return false;
    if (filter === 'unattempted' && !q.is_unattempted) return false;

    if (search) {
      const qText = q.stem_html.toLowerCase();
      const exp = (q.explanation_html || '').toLowerCase();
      const s = search.toLowerCase();
      return qText.includes(s) || exp.includes(s);
    }
    return true;
  });

  const percentage = Math.round((attempt.score / (attempt.max_marks || 100)) * 100);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16">
      {/* 1. Scorecard Hero Banner */}
      <div className="bg-gradient-to-r from-[#1A5344] via-[#236856] to-[#2E8B70] text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/mock-tests"
              className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs hover:bg-white/30 transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>All Mock Tests</span>
            </Link>
            <span className="text-xs text-emerald-200 font-medium">• AIAPGET Performance Scorecard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight">
            {test?.exact_title || 'Mock Examination'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            {test?.exact_subtitle || 'All Samhitas & Subjects Comprehensive AIAPGET Mock'}
          </p>

          {/* Key Score Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
            {/* Score */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
              <span className="text-xs text-emerald-200 uppercase font-semibold block">Total Marks</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                {attempt.score} <span className="text-xs font-normal text-white/70">/ {attempt.max_marks}</span>
              </div>
              <span className="text-[11px] text-white/80 mt-0.5 block">{percentage}% Score</span>
            </div>

            {/* Accuracy */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
              <span className="text-xs text-emerald-200 uppercase font-semibold block">Accuracy</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {attempt.accuracy_percent}%
              </div>
              <span className="text-[11px] text-emerald-200 mt-0.5 block">Precision Rate</span>
            </div>

            {/* Correct / Incorrect */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
              <span className="text-xs text-emerald-200 uppercase font-semibold block">Performance</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-emerald-300">✓ {attempt.correct_count}</span>
                <span className="text-white/40">•</span>
                <span className="text-xl font-bold text-rose-300">✕ {attempt.incorrect_count}</span>
              </div>
              <span className="text-[11px] text-white/80 mt-0.5 block">{attempt.unattempted_count} Unattempted</span>
            </div>

            {/* Time Taken */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
              <span className="text-xs text-emerald-200 uppercase font-semibold block">Time Spent</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {Math.floor(attempt.time_spent_seconds / 60)}m {attempt.time_spent_seconds % 60}s
              </div>
              <span className="text-[11px] text-emerald-200 mt-0.5 block">Total Duration</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Questions Review Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {/* Review Toolbar & Filter Tabs */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-serif">
              Question-by-Question Review
            </h2>
            <p className="text-xs text-gray-500">
              Verified answers with classical Ayurvedic citations and commentary
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 text-xs">
              {[
                { id: 'all', label: `All (${questions.length})` },
                { id: 'correct', label: `Correct (${attempt.correct_count})` },
                { id: 'incorrect', label: `Incorrect (${attempt.incorrect_count})` },
                { id: 'unattempted', label: `Skipped (${attempt.unattempted_count})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    filter === t.id
                      ? 'bg-[#1A5344] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question Review Cards List */}
        <div className="space-y-5">
          {filteredQuestions.map((q, qIndex) => {
            const isCorrect = q.is_correct;
            const isUnattempted = q.is_unattempted;
            const isIncorrect = !isCorrect && !isUnattempted;

            return (
              <div
                key={q.question_id}
                className={`bg-white rounded-2xl p-6 border shadow-xs transition-all ${
                  isCorrect
                    ? 'border-emerald-200'
                    : isIncorrect
                    ? 'border-rose-200'
                    : 'border-gray-200'
                }`}
              >
                {/* Question Status Banner */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 font-mono text-xs font-bold text-gray-700 flex items-center justify-center">
                      {q.display_position}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      Marks: {isCorrect ? `+${q.question_marks || 4}` : isIncorrect ? `-${q.negative_marks || 1}` : '0'}
                    </span>
                  </div>

                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Correct Response
                    </span>
                  ) : isIncorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      ✕ Incorrect Response
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Unattempted
                    </span>
                  )}
                </div>

                {/* Question Stem */}
                <div className="text-base sm:text-lg font-serif text-gray-900 mb-4 select-text leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: q.stem_html }} />
                </div>

                {/* 4 Options */}
                <div className="space-y-2.5 mb-5">
                  {q.options.map(opt => {
                    const isStudentChoice = q.student_choice === opt.display_position;
                    const isActualCorrect = opt.is_correct;
                    const letter = String.fromCharCode(64 + opt.display_position);

                    let optClasses = 'border-gray-200 bg-white text-gray-800';
                    if (isActualCorrect) {
                      optClasses = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                    } else if (isStudentChoice && !isActualCorrect) {
                      optClasses = 'border-rose-400 bg-rose-50/70 text-rose-900 line-through';
                    }

                    return (
                      <div
                        key={opt.option_id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${optClasses}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isActualCorrect
                            ? 'bg-emerald-600 text-white'
                            : isStudentChoice
                            ? 'bg-rose-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {letter}
                        </div>
                        <div className="flex-1 font-serif text-sm sm:text-base leading-snug">
                          <span dangerouslySetInnerHTML={{ __html: opt.option_html }} />
                        </div>
                        {isActualCorrect && (
                          <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded-full shrink-0">
                            Correct Answer
                          </span>
                        )}
                        {isStudentChoice && !isActualCorrect && (
                          <span className="text-xs font-bold text-rose-700 px-2 py-0.5 bg-rose-100 rounded-full shrink-0">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Classical Reference & Explanation Box */}
                {q.explanation_html && (
                  <div className="p-4 rounded-xl bg-[#F6F4ED] border border-[#E7E2D5] text-xs text-[#3E4E46]">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#1A5344] mb-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Classical Citation & Explanation</span>
                    </div>
                    <div
                      className="font-serif leading-relaxed text-gray-700 select-text"
                      dangerouslySetInnerHTML={{ __html: q.explanation_html }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            to="/mock-tests"
            className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-xs transition-colors"
          >
            ← Return to Mock Tests
          </Link>
          <Link
            to={`/mock-tests/exam/${attempt.test_id}`}
            className="px-5 py-2.5 rounded-xl bg-[#1A5344] hover:bg-[#236856] text-white text-xs font-bold shadow-xs transition-colors"
          >
            Retake This Mock Test →
          </Link>
        </div>
      </div>
    </div>
  );
};
