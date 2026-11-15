import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveAnswer, submitPractice, fetchPracticeSession } from '../api';
import { PracticeQuestion, PracticeSessionResponse } from '../types';

export default function PracticeScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // Session state from localStorage or API
  const [session, setSession] = useState<PracticeSessionResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  // Load session from storage or API
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const savedSessionStr = localStorage.getItem(`ayur_session_${sessionId}`);
    if (savedSessionStr) {
      try {
        const parsed = JSON.parse(savedSessionStr);
        setSession(parsed.session);
        setUserAnswers(parsed.answers || {});
        setMarkedForReview(parsed.marked || {});
        setBookmarked(parsed.bookmarks || {});
        setCurrentIndex(parsed.currentIndex || 0);
        setTimeLeft(parsed.timeLeft !== undefined ? parsed.timeLeft : parsed.session.duration_seconds);
        return;
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }

    // Fallback: load directly from API server
    fetchPracticeSession(sessionId)
      .then(data => {
        setSession(data);
        setUserAnswers(data.saved_answers || {});
        setBookmarked(data.saved_bookmarks || {});
        setCurrentIndex(0);
        setTimeLeft(data.duration_seconds);
      })
      .catch(err => {
        console.error('Failed to load session:', err);
        alert('Practice session not found or expired.');
        navigate('/');
      });
  }, [sessionId, navigate]);

  // Persist session changes to localStorage
  useEffect(() => {
    if (!sessionId || !session) return;
    const toSave = {
      session,
      answers: userAnswers,
      marked: markedForReview,
      bookmarks: bookmarked,
      currentIndex,
      timeLeft
    };
    localStorage.setItem(`ayur_session_${sessionId}`, JSON.stringify(toSave));
  }, [sessionId, session, userAnswers, markedForReview, bookmarked, currentIndex, timeLeft]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const currentQuestion: PracticeQuestion | undefined = session?.questions[currentIndex];

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion || !sessionId) return;
    const qid = currentQuestion.question_id;
    // For single select
    const newAnswers = { ...userAnswers, [qid]: [optionId] };
    setUserAnswers(newAnswers);

    // Save answer asynchronously to server
    saveAnswer(sessionId, qid, [optionId], 0, !!bookmarked[qid]).catch(console.error);
  };

  const handleClearResponse = () => {
    if (!currentQuestion || !sessionId) return;
    const qid = currentQuestion.question_id;
    const newAnswers = { ...userAnswers };
    delete newAnswers[qid];
    setUserAnswers(newAnswers);

    saveAnswer(sessionId, qid, [], 0, !!bookmarked[qid]).catch(console.error);
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    const qid = currentQuestion.question_id;
    setMarkedForReview(prev => ({
      ...prev,
      [qid]: !prev[qid]
    }));
  };

  const toggleBookmark = () => {
    if (!currentQuestion || !sessionId) return;
    const qid = currentQuestion.question_id;
    const newState = !bookmarked[qid];
    setBookmarked(prev => ({
      ...prev,
      [qid]: newState
    }));

    saveAnswer(
      sessionId,
      qid,
      userAnswers[qid] || [],
      0,
      newState
    ).catch(console.error);
  };

  const handleSubmitTest = async (autoSubmit = false) => {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitPractice(sessionId);
      // Clean up localStorage session
      localStorage.removeItem(`ayur_session_${sessionId}`);
      // Store result for display
      sessionStorage.setItem(`ayur_result_${sessionId}`, JSON.stringify(result));
      navigate(`/results/${sessionId}`);
    } catch (err: any) {
      alert(`Error submitting test: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Stats calculation for palette
  const stats = useMemo(() => {
    if (!session) return { answered: 0, marked: 0, unanswered: 0 };
    let answered = 0;
    let marked = 0;
    session.questions.forEach(q => {
      const isAns = (userAnswers[q.question_id] || []).length > 0;
      const isMrk = !!markedForReview[q.question_id];
      if (isAns) answered++;
      if (isMrk) marked++;
    });
    const unanswered = session.questions.length - answered;
    return { answered, marked, unanswered };
  }, [session, userAnswers, markedForReview]);

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-600 text-sm font-medium">Initializing Practice Test...</p>
        </div>
      </div>
    );
  }

  // Format time remaining
  const formatTime = (secs: number | null) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCurrentAnswered = (userAnswers[currentQuestion.question_id] || []).length > 0;
  const isCurrentMarked = !!markedForReview[currentQuestion.question_id];
  const isCurrentBookmarked = !!bookmarked[currentQuestion.question_id];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Test Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 px-4 sm:px-8 py-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-900 font-bold flex items-center justify-center text-sm border border-amber-200">
            {currentIndex + 1}
          </span>
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Question {currentIndex + 1} of {session.total_questions}
            </div>
            <div className="text-sm font-bold text-stone-900 hidden sm:block">
              Ayurveda Samhita Practice
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Timer Display */}
          {session.timed && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold ${
                timeLeft !== null && timeLeft < 300
                  ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              <i className="fa-regular fa-clock text-xs"></i>
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Mobile Palette Toggle */}
          <button
            onClick={() => setMobilePaletteOpen(true)}
            className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            title="Open Question Palette"
          >
            <i className="fa-solid fa-table-cells-large text-lg"></i>
          </button>

          {/* Finish Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-8">
        {/* Left/Center Pane: Question & Options */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-6">
            {/* Question Meta Bar */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-100 text-xs">
              <span className="font-semibold text-stone-500">
                Question #{currentIndex + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleBookmark}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    isCurrentBookmarked
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <i className={`fa-bookmark ${isCurrentBookmarked ? 'fa-solid text-amber-600' : 'fa-regular'}`}></i>
                  {isCurrentBookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
            </div>

            {/* Question Stem (Rich Bilingual Text) */}
            <div
              className="text-stone-900 font-serif text-base sm:text-lg sm:leading-relaxed mb-8 selection:bg-amber-200"
              dangerouslySetInnerHTML={{ __html: currentQuestion.stem }}
            />

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = (userAnswers[currentQuestion.question_id] || []).includes(opt.option_id);
                const letter = String.fromCharCode(65 + idx);

                return (
                  <div
                    key={opt.option_id}
                    onClick={() => handleSelectOption(opt.option_id)}
                    className={`group flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 shadow-sm'
                        : 'bg-stone-50/60 border-stone-200 hover:border-amber-300 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 font-extrabold'
                          : 'bg-stone-200 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-900'
                      }`}
                    >
                      {letter}
                    </div>
                    <div
                      className={`text-sm sm:text-base leading-relaxed pt-0.5 ${
                        isSelected ? 'text-stone-950 font-semibold' : 'text-stone-800'
                      }`}
                      dangerouslySetInnerHTML={{ __html: opt.text }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation & Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMarkForReview}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                  isCurrentMarked
                    ? 'bg-purple-100 border-purple-300 text-purple-900'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <i className="fa-regular fa-flag mr-1.5"></i>
                {isCurrentMarked ? 'Marked for Review' : 'Mark for Review'}
              </button>

              {isCurrentAnswered && (
                <button
                  onClick={handleClearResponse}
                  className="px-3 py-2 text-xs font-medium text-stone-500 hover:text-red-600 transition"
                >
                  Clear Response
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-stone-700 transition"
              >
                <i className="fa-solid fa-arrow-left mr-1.5"></i> Previous
              </button>

              {currentIndex < session.total_questions - 1 ? (
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs shadow-xs transition"
                >
                  Next <i className="fa-solid fa-arrow-right ml-1.5"></i>
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  Review & Submit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Desktop Sidebar: Question Palette */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm h-[calc(100vh-8rem)] sticky top-24">
          <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-table-cells text-amber-600"></i>
            Question Palette
          </h3>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
              <div className="text-xs font-semibold text-emerald-800">{stats.answered}</div>
              <div className="text-[10px] text-emerald-600">Answered</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-2">
              <div className="text-xs font-semibold text-purple-800">{stats.marked}</div>
              <div className="text-[10px] text-purple-600">Marked</div>
            </div>
            <div className="bg-stone-100 border border-stone-200 rounded-xl p-2">
              <div className="text-xs font-semibold text-stone-700">{stats.unanswered}</div>
              <div className="text-[10px] text-stone-500">Left</div>
            </div>
          </div>

          {/* Question Grid (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-5 gap-2 content-start">
            {session.questions.map((q, idx) => {
              const isAns = (userAnswers[q.question_id] || []).length > 0;
              const isMrk = !!markedForReview[q.question_id];
              const isCurr = idx === currentIndex;

              let style = 'bg-stone-100 text-stone-600 border-stone-200 hover:border-stone-400';
              if (isAns && isMrk) {
                style = 'bg-purple-600 text-white border-purple-700 font-bold';
              } else if (isAns) {
                style = 'bg-emerald-600 text-white border-emerald-700 font-bold';
              } else if (isMrk) {
                style = 'bg-purple-100 text-purple-900 border-purple-400 font-bold';
              }

              return (
                <button
                  key={q.question_id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${style} ${
                    isCurr ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-stone-100 mt-4">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Finish & Review Test
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Question Palette Modal / Drawer */}
      {mobilePaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Question Palette</h3>
              <button
                onClick={() => setMobilePaletteOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-emerald-50 rounded-xl p-2 text-emerald-800 text-xs font-bold">
                {stats.answered} Answered
              </div>
              <div className="bg-purple-50 rounded-xl p-2 text-purple-800 text-xs font-bold">
                {stats.marked} Marked
              </div>
              <div className="bg-stone-100 rounded-xl p-2 text-stone-700 text-xs font-bold">
                {stats.unanswered} Left
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 p-1">
              {session.questions.map((q, idx) => {
                const isAns = (userAnswers[q.question_id] || []).length > 0;
                const isMrk = !!markedForReview[q.question_id];
                const isCurr = idx === currentIndex;

                let style = 'bg-stone-100 text-stone-600 border-stone-200';
                if (isAns && isMrk) style = 'bg-purple-600 text-white';
                else if (isAns) style = 'bg-emerald-600 text-white';
                else if (isMrk) style = 'bg-purple-100 text-purple-900 border-purple-400';

                return (
                  <button
                    key={q.question_id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setMobilePaletteOpen(false);
                    }}
                    className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center ${style} ${
                      isCurr ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 text-xl">
              <i className="fa-solid fa-flag-checkered"></i>
            </div>
            <h3 className="text-xl font-bold font-serif text-stone-900 text-center mb-2">
              Ready to Submit Test?
            </h3>
            <p className="text-xs text-stone-500 text-center mb-6 leading-relaxed">
              Once submitted, your responses will be scored against source-verified answer keys and complete classical explanations will be unlocked.
            </p>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 mb-6 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Total Questions:</span>
                <span className="font-bold text-stone-900">{session.total_questions}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Answered:</span>
                <span className="font-bold">{stats.answered}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Marked for Review:</span>
                <span className="font-bold">{stats.marked}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Unanswered:</span>
                <span className="font-bold">{stats.unanswered}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={() => handleSubmitTest(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scoring...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

