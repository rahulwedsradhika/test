import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getMockTestQuestions, startMockAttempt, saveMockAttempt, submitMockAttempt } from '../api';
import { MockExamQuestion } from '../types';

export const MockTestExamScreen: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<string>(searchParams.get('attemptId') || '');
  const [testTitle, setTestTitle] = useState<string>('');
  const [testSubtitle, setTestSubtitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MockExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(1800); // 30 min default
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState<boolean>(false);

  const saveTimerRef = useRef<any>(null);

  // 1. Initialize Exam & Attempt
  useEffect(() => {
    if (!testId) return;

    getMockTestQuestions(testId)
      .then(async res => {
        if (!res.success || !res.questions || res.questions.length === 0) {
          throw new Error('No verified questions returned for this mock test.');
        }

        setTestTitle(res.exact_title);
        setTestSubtitle(res.exact_subtitle);
        setQuestions(res.questions);
        setTimeRemaining(res.duration_seconds || 1800);

        if (res.questions.length > 0) {
          setVisited(new Set([res.questions[0].question_id]));
        }

        let activeAttemptId = attemptId;
        if (!activeAttemptId) {
          const startRes = await startMockAttempt({ test_id: testId });
          if (startRes.success) {
            activeAttemptId = startRes.attempt_id;
            setAttemptId(activeAttemptId);
            if (startRes.answers) setAnswers(startRes.answers);
            if (startRes.marked_for_review) setMarkedForReview(new Set(startRes.marked_for_review));
            if (startRes.time_remaining_seconds) setTimeRemaining(startRes.time_remaining_seconds);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading mock exam questions:', err);
        setError(err.message || 'Failed to load test questions.');
        setLoading(false);
      });
  }, [testId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || isSubmitting || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isSubmitting, timeRemaining]);

  // 3. Autosave answers
  const scheduleAutosave = (updatedAnswers: Record<string, number>, updatedMarked: Set<string>) => {
    if (!attemptId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      saveMockAttempt(attemptId, {
        answers: updatedAnswers,
        marked_for_review: Array.from(updatedMarked),
        time_remaining_seconds: timeRemaining,
        time_spent_seconds: timeSpent
      }).catch(err => {
        console.warn('Autosave warning:', err);
      });
    }, 1200);
  };

  const handleSelectOption = (qId: string, optPos: number) => {
    const updated = { ...answers, [qId]: optPos };
    setAnswers(updated);
    scheduleAutosave(updated, markedForReview);
  };

  const handleClearResponse = (qId: string) => {
    const updated = { ...answers };
    delete updated[qId];
    setAnswers(updated);
    scheduleAutosave(updated, markedForReview);
  };

  const handleToggleReview = (qId: string) => {
    const nextMarked = new Set(markedForReview);
    if (nextMarked.has(qId)) {
      nextMarked.delete(qId);
    } else {
      nextMarked.add(qId);
    }
    setMarkedForReview(nextMarked);
    scheduleAutosave(answers, nextMarked);
  };

  const handleNavigateQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    const targetQ = questions[idx];
    setVisited(prev => new Set(prev).add(targetQ.question_id));
    setCurrentIdx(idx);
    setMobilePaletteOpen(false);
  };

  const handleAutoSubmit = () => {
    alert('Time limit reached! Submitting your exam automatically...');
    executeSubmit();
  };

  const executeSubmit = async () => {
    if (!attemptId || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await submitMockAttempt(attemptId, {
        answers,
        time_spent_seconds: timeSpent
      });
      if (res.success) {
        navigate(`/mock-tests/results/${attemptId}`);
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting test. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1A5344] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800">Loading AIAPGET Mock Test...</h2>
          <p className="text-xs text-gray-500 mt-1">Preparing verified questions and palette</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            ✕
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Cannot Load Mock Test</h2>
          <p className="text-xs text-gray-600 mb-6">{error || 'No questions available.'}</p>
          <Link
            to="/mock-tests"
            className="px-4 py-2 bg-[#1A5344] text-white rounded-lg text-xs font-semibold hover:bg-[#236856] transition-colors"
          >
            ← Return to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const reviewCount = markedForReview.size;
  const unansweredCount = totalQ - answeredCount;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between select-none">
      {/* 1. NTA Style Header Bar */}
      <header className="bg-[#1A5344] text-white px-4 py-3 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
              AIAPGET
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-serif leading-none truncate max-w-[200px] sm:max-w-md">
                {testTitle}
              </h1>
              <p className="text-[11px] text-emerald-200 mt-0.5 truncate hidden sm:block">
                {testSubtitle || 'AIAPGET Standard Mock Exam'}
              </p>
            </div>
          </div>

          {/* Timer & Palette Toggle */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
              timeRemaining < 180
                ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                : timeRemaining < 600
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : 'bg-black/20 border-white/20 text-white'
            }`}>
              <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTime(timeRemaining)}</span>
            </div>

            <button
              onClick={() => setMobilePaletteOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Palette</span>
              <span className="px-1.5 py-0.5 bg-amber-400 text-[#1A5344] rounded-full text-[10px] font-bold">
                {currentIdx + 1}/{totalQ}
              </span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-[#1A5344] font-extrabold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Exam Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Screen (9 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-2xl shadow-xs border border-gray-200 p-5 sm:p-7 min-h-[520px]">
          <div>
            {/* Top Question Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#1A5344]/10 text-[#1A5344] text-xs font-bold font-mono">
                  Question {currentIdx + 1} of {totalQ}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Marks: +{currentQ.question_marks || 4.0} / -{currentQ.negative_marks || 1.0}
                </span>
              </div>

              {/* Mark for Review Button */}
              <button
                onClick={() => handleToggleReview(currentQ.question_id)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  markedForReview.has(currentQ.question_id)
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>★</span>
                <span>{markedForReview.has(currentQ.question_id) ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            {/* Question Stem (Devanagari / English typography) */}
            <div className="text-gray-900 font-serif text-base sm:text-lg leading-relaxed mb-6 pt-2 select-text">
              <span className="font-sans font-bold text-gray-400 mr-2">Q{currentIdx + 1}.</span>
              <span dangerouslySetInnerHTML={{ __html: currentQ.stem_html }} />
            </div>

            {/* 4 Multiple Choice Options */}
            <div className="space-y-3">
              {currentQ.options.map(opt => {
                const isSelected = answers[currentQ.question_id] === opt.display_position;
                const letter = String.fromCharCode(64 + opt.display_position); // A, B, C, D

                return (
                  <div
                    key={opt.option_id}
                    onClick={() => handleSelectOption(currentQ.question_id, opt.display_position)}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1A5344] bg-[#1A5344]/5 ring-1 ring-[#1A5344] shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-[#1A5344] text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {letter}
                    </div>
                    <div className="text-sm sm:text-base text-gray-800 font-serif leading-snug flex-1 select-text">
                      <span dangerouslySetInnerHTML={{ __html: opt.option_html }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer Controls */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {answers[currentQ.question_id] && (
                <button
                  onClick={() => handleClearResponse(currentQ.question_id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Response
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigateQuestion(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              >
                ← Previous
              </button>

              {currentIdx < totalQ - 1 ? (
                <button
                  onClick={() => handleNavigateQuestion(currentIdx + 1)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1A5344] hover:bg-[#236856] rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Save & Next</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Save & Finish
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette Sidebar (Desktop) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col bg-white rounded-2xl shadow-xs border border-gray-200 p-5">
          <div className="pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Question Palette ({totalQ} Questions)
            </h3>
          </div>

          {/* Palette Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-emerald-600 shrink-0" />
              <span className="text-gray-700 font-medium">Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-rose-500 shrink-0" />
              <span className="text-gray-700 font-medium">Unanswered ({unansweredCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 shrink-0" />
              <span className="text-gray-700 font-medium">Review ({reviewCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-gray-200 shrink-0" />
              <span className="text-gray-700 font-medium">Not Visited</span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = answers[q.question_id] !== undefined;
                const isReview = markedForReview.has(q.question_id);
                const isVisited = visited.has(q.question_id);

                let btnClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';
                if (isReview) {
                  btnClass = 'bg-amber-500 text-white font-bold border-amber-600';
                } else if (isAnswered) {
                  btnClass = 'bg-emerald-600 text-white font-bold border-emerald-700';
                } else if (isVisited) {
                  btnClass = 'bg-rose-500 text-white font-bold border-rose-600';
                }

                return (
                  <button
                    key={q.question_id}
                    onClick={() => handleNavigateQuestion(idx)}
                    className={`h-9 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${btnClass} ${
                      isCurrent ? 'ring-2 ring-[#1A5344] ring-offset-1 scale-105 shadow-xs' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Submit Test Button in Sidebar */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full mt-4 py-2.5 bg-[#1A5344] hover:bg-[#236856] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Submit Full Examination
          </button>
        </div>
      </div>

      {/* Mobile Palette Drawer Modal */}
      {mobilePaletteOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="text-sm font-bold text-gray-900">Question Palette ({totalQ})</h3>
              <button
                onClick={() => setMobilePaletteOpen(false)}
                className="text-gray-400 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isAnswered = answers[q.question_id] !== undefined;
                  const isReview = markedForReview.has(q.question_id);
                  const isVisited = visited.has(q.question_id);

                  let btnClass = 'bg-gray-100 text-gray-700';
                  if (isReview) btnClass = 'bg-amber-500 text-white';
                  else if (isAnswered) btnClass = 'bg-emerald-600 text-white';
                  else if (isVisited) btnClass = 'bg-rose-500 text-white';

                  return (
                    <button
                      key={q.question_id}
                      onClick={() => handleNavigateQuestion(idx)}
                      className={`h-9 rounded-lg text-xs font-mono font-bold ${btnClass} ${
                        isCurrent ? 'ring-2 ring-[#1A5344] scale-105' : ''
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
      )}

      {/* 3. Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 font-serif mb-2">
              Submit Examination?
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to finalize your mock examination? You will not be able to change answers after submission.
            </p>

            {/* Summary Statistics Table */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/70 mb-5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-bold text-gray-900">{totalQ}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-medium">Answered:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-600 font-medium">Unanswered:</span>
                <span className="font-bold text-rose-600">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700 font-medium">Marked for Review:</span>
                <span className="font-bold text-amber-700">{reviewCount}</span>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Back to Exam
              </button>
              <button
                onClick={executeSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Grading Test...</span>
                  </>
                ) : (
                  <span>Yes, Submit Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
