import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExamQuestions, saveTestProgress, submitTestAttempt } from '../api';
import { ExamQuestion } from '../types';

export default function TestExamScreen() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  // Test ID extracted or received
  const [testMeta, setTestMeta] = useState<any>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attempt State
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({ '0': true });

  // Timer
  const [secondsLeft, setSecondsLeft] = useState<number>(120 * 60);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  // Ref to track latest state for auto-save & unload
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const reviewRef = useRef(markedForReview);
  reviewRef.current = markedForReview;
  const timeSpentRef = useRef(timeSpent);
  timeSpentRef.current = timeSpent;

  // Derive testId from attemptId if encoded or query attempt details
  useEffect(() => {
    async function loadExam() {
      if (!attemptId) return;
      setLoading(true);
      setError(null);
      try {
        // First get attempt details from server sessions
        const attRes = await fetch(`/api/test-series/attempts/${attemptId}/result`).then(r => r.json()).catch(() => null);
        const testId = attRes?.scorecard?.test_id || 'TS-2026-27-01-T01';

        // Load exam questions
        const data = await fetchExamQuestions(testId);
        setTestMeta(data.test);
        setQuestions(data.questions);
        const totalSecs = (data.test?.duration_minutes || 120) * 60;
        setSecondsLeft(totalSecs);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize exam environment');
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [attemptId]);

  // Countdown Timer
  useEffect(() => {
    if (loading || !questions.length) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitPaper();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, questions.length]);

  // Auto-save periodically (every 15s)
  useEffect(() => {
    if (!attemptId || loading || !questions.length) return;
    const saveTimer = setInterval(() => {
      const markedKeys = Object.keys(reviewRef.current).filter(k => reviewRef.current[k]);
      saveTestProgress(attemptId, answersRef.current, markedKeys, timeSpentRef.current).catch(() => {});
    }, 15000);

    return () => clearInterval(saveTimer);
  }, [attemptId, loading, questions.length]);

  // Prevent accidental back/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (pos: number) => {
    if (!currentQ) return;
    const qid = currentQ.local_question_id;
    setAnswers(prev => ({ ...prev, [qid]: pos }));
  };

  const handleClearSelection = () => {
    if (!currentQ) return;
    const qid = currentQ.local_question_id;
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[qid];
      return copy;
    });
  };

  const handleToggleReview = () => {
    if (!currentQ) return;
    const qid = currentQ.local_question_id;
    setMarkedForReview(prev => ({
      ...prev,
      [qid]: !prev[qid]
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setVisited(prev => ({ ...prev, [nextIdx]: true }));
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setVisited(prev => ({ ...prev, [prevIdx]: true }));
    }
  };

  const handleJump = (idx: number) => {
    setCurrentIndex(idx);
    setVisited(prev => ({ ...prev, [idx]: true }));
    setShowPaletteMobile(false);
  };

  const handleSubmitPaper = async () => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitTestAttempt(attemptId, answersRef.current, timeSpentRef.current);
      navigate(`/test-series/results/${attemptId}`);
    } catch (err: any) {
      alert(err.message || 'Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Format Time Remaining (HH:MM:SS)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Stats calculation
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
  const unattemptedCount = questions.length - answeredCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center text-white">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-emerald-400 mb-4"></i>
          <p className="font-outfit font-bold text-lg">Launching Secure Examination...</p>
          <p className="text-stone-400 text-xs mt-1">Setting up question palette and timer.</p>
        </div>
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 text-center border border-red-200 shadow-md">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-3"></i>
          <h2 className="text-lg font-bold text-stone-900">Unable to load examination</h2>
          <p className="text-stone-600 text-xs mt-2">{error || 'Questions could not be retrieved.'}</p>
          <button
            onClick={() => navigate('/test-series')}
            className="mt-6 px-6 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
          >
            Back to Test Series
          </button>
        </div>
      </div>
    );
  }

  const isLowTime = secondsLeft < 300; // < 5 mins
  const isCriticalTime = secondsLeft < 60; // < 1 min

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans select-none">
      {/* Top Test Header Bar */}
      <header className="bg-white border-b border-[#E8E5DD] px-4 py-3 sm:px-6 sticky top-0 z-30 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A5344] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            🌿
          </div>
          <div>
            <h1 className="font-outfit font-extrabold text-sm sm:text-base text-stone-900 truncate max-w-[200px] sm:max-w-md">
              {testMeta?.title_source_exact || 'Examination'}
            </h1>
            <p className="text-[11px] text-stone-500">
              Question {currentIndex + 1} of {questions.length} • (+{testMeta?.marks_per_correct || 4} / -{testMeta?.marks_per_incorrect || 1})
            </p>
          </div>
        </div>

        {/* Center / Right: Countdown Timer & Actions */}
        <div className="flex items-center gap-3">
          {/* Timer Clock */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-xs transition-colors ${
            isCriticalTime
              ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
              : isLowTime
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-stone-50 text-stone-800 border-stone-200'
          }`}>
            <i className="fa-solid fa-clock text-xs"></i>
            <span>{formatTime(secondsLeft)}</span>
          </div>

          {/* Question Palette Toggle on Mobile */}
          <button
            onClick={() => setShowPaletteMobile(!showPaletteMobile)}
            className="lg:hidden p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5"
            aria-label="Toggle Question Palette"
          >
            <i className="fa-solid fa-table-cells-large text-xs"></i>
            <span className="hidden sm:inline">Palette</span>
          </button>

          {/* Submit Exam Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-paper-plane text-[11px]"></i>
            <span className="hidden sm:inline">Submit Test</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Active Question Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E8E5DD] shadow-sm p-6 sm:p-8 flex flex-col min-h-[540px]">
          {/* Question Header */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-100 mb-6">
            <span className="text-xs font-bold text-[#1A5344] uppercase tracking-wider bg-[#E8F4F0] px-3 py-1 rounded-full">
              Question {currentIndex + 1}
            </span>
            <div className="flex items-center gap-2">
              {markedForReview[currentQ?.local_question_id] && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                  <i className="fa-solid fa-bookmark mr-1"></i>
                  Marked for Review
                </span>
              )}
              {answers[currentQ?.local_question_id] !== undefined && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <i className="fa-solid fa-check mr-1"></i>
                  Answered
                </span>
              )}
            </div>
          </div>

          {/* Question Stem (Bilingual) */}
          <div className="flex-1 mb-8">
            <div
              className="text-stone-900 font-serif text-base sm:text-lg leading-relaxed space-y-2"
              dangerouslySetInnerHTML={{ __html: currentQ?.question_text || '' }}
            />
          </div>

          {/* 4 Radio Options */}
          <div className="space-y-3 mb-8">
            {currentQ?.options?.map((opt, optIdx) => {
              const isSelected = answers[currentQ.local_question_id] === opt.position;
              const optionLetters = ['A', 'B', 'C', 'D'];
              const letter = optionLetters[optIdx] || String(opt.position);

              return (
                <button
                  key={opt.position}
                  type="button"
                  onClick={() => handleSelectOption(opt.position)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-[#1A5344] bg-[#E8F4F0]/60 ring-2 ring-[#1A5344]/10 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-[#1A5344] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {letter}
                  </div>
                  <div
                    className="flex-1 text-sm text-stone-800 leading-normal"
                    dangerouslySetInnerHTML={{ __html: opt.option_text }}
                  />
                </button>
              );
            })}
          </div>

          {/* Bottom Action Controls */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  currentIndex === 0
                    ? 'text-stone-300 cursor-not-allowed bg-stone-50'
                    : 'text-stone-700 bg-stone-100 hover:bg-stone-200'
                }`}
              >
                <i className="fa-solid fa-arrow-left text-[10px]"></i>
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                disabled={answers[currentQ?.local_question_id] === undefined}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReview}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  markedForReview[currentQ?.local_question_id]
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <i className="fa-solid fa-bookmark text-[10px]"></i>
                <span>{markedForReview[currentQ?.local_question_id] ? 'De-Tag Review' : 'Mark for Review'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#1A5344] hover:bg-[#133F34] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <span>{currentIndex === questions.length - 1 ? 'End of Test' : 'Save & Next'}</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side / Drawer: Question Palette */}
        <div className={`lg:col-span-4 bg-white rounded-3xl border border-[#E8E5DD] shadow-sm p-6 flex flex-col ${
          showPaletteMobile ? 'fixed inset-x-4 top-20 bottom-6 z-50 overflow-y-auto block shadow-2xl' : 'hidden lg:flex'
        }`}>
          {/* Palette Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
            <h2 className="font-outfit font-bold text-sm text-stone-900 flex items-center gap-2">
              <i className="fa-solid fa-table-cells-large text-[#1A5344]"></i>
              <span>Question Palette</span>
            </h2>
            <button
              onClick={() => setShowPaletteMobile(false)}
              className="lg:hidden p-1 text-stone-400 hover:text-stone-700"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Status Counter Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                {answeredCount}
              </span>
              <span className="text-stone-600 text-[11px]">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                {markedCount}
              </span>
              <span className="text-stone-600 text-[11px]">Marked Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">
                {Object.keys(visited).length - answeredCount > 0 ? Object.keys(visited).length - answeredCount : 0}
              </span>
              <span className="text-stone-600 text-[11px]">Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px]">
                {questions.length - Object.keys(visited).length}
              </span>
              <span className="text-stone-600 text-[11px]">Not Visited</span>
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.local_question_id] !== undefined;
                const isMarked = !!markedForReview[q.local_question_id];
                const isWasVisited = !!visited[idx];

                let bgClasses = 'bg-stone-100 text-stone-600 border-stone-200';
                if (isAnswered && isMarked) {
                  bgClasses = 'bg-purple-600 text-white border-purple-700 ring-2 ring-emerald-400';
                } else if (isAnswered) {
                  bgClasses = 'bg-emerald-600 text-white border-emerald-700';
                } else if (isMarked) {
                  bgClasses = 'bg-purple-600 text-white border-purple-700';
                } else if (isWasVisited) {
                  bgClasses = 'bg-amber-500 text-white border-amber-600';
                }

                return (
                  <button
                    key={q.local_question_id}
                    type="button"
                    onClick={() => handleJump(idx)}
                    className={`h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${bgClasses} ${
                      isCurrent ? 'ring-2 ring-stone-900 scale-105 shadow-xs font-extrabold' : 'hover:opacity-90'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl mx-auto mb-4">
              <i className="fa-solid fa-flag-checkered"></i>
            </div>

            <h3 className="font-outfit font-extrabold text-xl text-stone-900 text-center">
              Submit Examination Paper?
            </h3>
            <p className="text-xs text-stone-500 text-center mt-1">
              Are you sure you want to conclude your attempt? Your score will be evaluated immediately.
            </p>

            {/* Summary Breakdown */}
            <div className="grid grid-cols-3 gap-2 my-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Attempted</span>
                <strong className="text-lg font-extrabold text-emerald-700">{answeredCount}</strong>
              </div>
              <div className="border-x border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Unattempted</span>
                <strong className="text-lg font-extrabold text-stone-700">{unattemptedCount}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold block">For Review</span>
                <strong className="text-lg font-extrabold text-purple-700">{markedCount}</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitPaper}
                className="flex-1 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Submit</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
