import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPreviousYearTestQuestions, savePYPAttempt, submitPYPAttempt } from '../api';
import { PYPExamQuestion } from '../types';

export const PreviousYearsExamScreen: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt_id') || `pyp_att_${Date.now()}`;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState<PYPExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Exam state
  const [answers, setAnswers] = useState<Record<string, string>>({}); // question_uid -> option_key
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState<number>(7200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  const startTimeRef = useRef(Date.now());
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Load questions in strict EXAM mode
  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    fetchPreviousYearTestQuestions(testId, 'exam')
      .then(res => {
        if (res.success && res.questions) {
          setQuestions(res.questions);
          setTestTitle(res.test_title || 'Previous Year Examination');
          setTimeRemaining(res.duration_seconds || 7200);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load exam questions:', err);
        alert('Failed to load questions. Returning to test list.');
        navigate('/previous-years');
      });
  }, [testId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (loading || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, timeRemaining]);

  // Periodic autosave every 20 seconds
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const autosaveInterval = setInterval(() => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      savePYPAttempt(attemptId, {
        answers: answersRef.current,
        marked_for_review: Array.from(markedForReview),
        time_remaining_seconds: timeRemaining,
        time_spent_seconds: timeSpent
      }).catch(err => console.warn('Background autosave error:', err));
    }, 20000);
    return () => clearInterval(autosaveInterval);
  }, [attemptId, loading, markedForReview, questions.length, timeRemaining]);

  const handleSelectOption = (key: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => ({
      ...prev,
      [q.question_uid]: key
    }));
  };

  const handleClearChoice = () => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[q.question_uid];
      return updated;
    });
  };

  const handleToggleMarkForReview = () => {
    const q = questions[currentIndex];
    if (!q) return;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(q.question_uid)) {
        next.delete(q.question_uid);
      } else {
        next.add(q.question_uid);
      }
      return next;
    });
  };

  const handleNavigateQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    setVisitedIndices(prev => new Set(prev).add(index));
  };

  const handleAutoSubmit = () => {
    alert('Time has expired! Submitting your examination paper now...');
    performSubmit();
  };

  const performSubmit = async () => {
    try {
      setIsSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await submitPYPAttempt(attemptId, {
        answers,
        time_spent_seconds: timeSpent
      });
      if (res.success) {
        navigate(`/previous-years/attempts/${attemptId}/results`);
      } else {
        alert('Submission failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (e: any) {
      console.error('Submit error:', e);
      alert('Error submitting exam: ' + (e.message || 'Server error'));
      setIsSubmitting(false);
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-emerald-600"></i>
          <p className="text-stone-700 font-medium">Entering secure examination environment...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const unattemptedCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col justify-between select-none">
      {/* Top Exam Header */}
      <header className="bg-white border-b border-stone-200 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A5344] text-white flex items-center justify-center text-lg font-bold">
            🌿
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold font-outfit text-stone-900 truncate max-w-xs sm:max-w-md">
              {testTitle}
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">
              Candidate: <span className="text-emerald-800 font-semibold">Ayurveda Scholar</span> • Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Countdown Clock */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
            timeRemaining < 300
              ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
              : 'bg-stone-50 text-stone-800 border-stone-200'
          }`}>
            <i className={`fa-regular fa-clock ${timeRemaining < 300 ? 'text-red-600' : 'text-emerald-700'}`}></i>
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Palette Toggle for Mobile */}
          <button
            onClick={() => setShowPaletteMobile(!showPaletteMobile)}
            className="md:hidden px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold border border-stone-200"
          >
            <i className="fa-solid fa-table-cells text-xs mr-1"></i>
            <span>Palette</span>
          </button>

          {/* Finish & Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1A5344] hover:bg-[#133D32] text-white transition-all shadow-xs"
          >
            Submit Paper
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left 3 Cols: Question Stem & Options */}
        <main className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                  Question {currentIndex + 1}
                </span>
                {markedForReview.has(currentQ.question_uid) && (
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 flex items-center gap-1">
                    <i className="fa-solid fa-bookmark text-[10px]"></i>
                    <span>Marked for Review</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-stone-500 font-medium">
                Marking: <span className="text-emerald-700 font-bold">+4.0</span> / <span className="text-red-600 font-bold">-1.0</span>
              </div>
            </div>

            {/* Question Stem */}
            <div className="text-stone-900 text-base sm:text-lg leading-relaxed font-serif font-medium whitespace-pre-line">
              <div dangerouslySetInnerHTML={{ __html: currentQ.stem }} />
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map(opt => {
                const isSelected = answers[currentQ.question_uid] === opt.key;
                return (
                  <label
                    key={opt.position}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                        : 'bg-stone-50/60 border-stone-200 hover:border-emerald-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 transition-colors ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-stone-400 bg-white'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>

                    <div className="flex-1 text-sm sm:text-base text-stone-800 leading-snug">
                      <span className="font-bold text-stone-500 mr-2 font-mono">({opt.key})</span>
                      <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Bottom Actions for current question */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMarkForReview}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    markedForReview.has(currentQ.question_uid)
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <i className="fa-solid fa-bookmark text-xs"></i>
                  <span>{markedForReview.has(currentQ.question_uid) ? 'Unmark Review' : 'Mark for Review'}</span>
                </button>

                {answers[currentQ.question_uid] && (
                  <button
                    onClick={handleClearChoice}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors"
                  >
                    Clear Response
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigateQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="fa-solid fa-arrow-left mr-1.5"></i>
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => handleNavigateQuestion(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1A5344] hover:bg-[#133D32] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  <span>Next</span>
                  <i className="fa-solid fa-arrow-right ml-1.5"></i>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Col / Mobile Drawer: Question Palette */}
        <aside className={`md:block ${showPaletteMobile ? 'block' : 'hidden'} md:col-span-1 bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-5`}>
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Question Palette
            </h3>
            <span className="text-xs font-bold text-emerald-800 font-mono">
              {answeredCount}/{questions.length} Solved
            </span>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-stone-600 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-500"></span>
              <span>Review ({markedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-stone-100 border border-stone-300"></span>
              <span>Unvisited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-red-100 border border-red-300 text-red-700"></span>
              <span>Unanswered</span>
            </div>
          </div>

          {/* Palette Number Grid */}
          <div className="max-h-96 overflow-y-auto pr-1">
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.question_uid];
                const isMarked = markedForReview.has(q.question_uid);
                const isVisited = visitedIndices.has(idx);
                const isCurrent = idx === currentIndex;

                let btnClass = 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100';
                if (isMarked) {
                  btnClass = 'bg-purple-600 text-white font-bold border-purple-600';
                } else if (isAnswered) {
                  btnClass = 'bg-emerald-600 text-white font-bold border-emerald-600';
                } else if (isVisited) {
                  btnClass = 'bg-red-50 text-red-700 font-bold border-red-200';
                }

                if (isCurrent) {
                  btnClass += ' ring-2 ring-amber-400 ring-offset-1 scale-105';
                }

                return (
                  <button
                    key={q.question_uid}
                    onClick={() => {
                      handleNavigateQuestion(idx);
                      setShowPaletteMobile(false);
                    }}
                    className={`h-9 rounded-xl text-xs font-mono transition-all border flex items-center justify-center ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-scale-in">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl mx-auto shadow-xs">
                <i className="fa-solid fa-flag-checkered"></i>
              </div>
              <h3 className="text-xl font-bold font-outfit text-stone-900">
                Confirm Examination Submission?
              </h3>
              <p className="text-xs text-stone-500">
                Review your current paper summary before finalizing your attempt.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100 text-center">
              <div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">Answered</div>
                <div className="text-xl font-bold text-emerald-700 font-outfit">{answeredCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">Unanswered</div>
                <div className="text-xl font-bold text-red-600 font-outfit">{unattemptedCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">Review</div>
                <div className="text-xl font-bold text-purple-600 font-outfit">{markedCount}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              >
                Resume Test
              </button>
              <button
                onClick={performSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#1A5344] hover:bg-[#133D32] text-white flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {isSubmitting ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <span>Submit & Grade</span>
                    <i className="fa-solid fa-check text-xs"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousYearsExamScreen;
