import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { fetchDailyTestQuestions, startDailyAttempt, saveDailyAttempt, submitDailyAttempt } from '../api';
import { DailyExamQuestion } from '../types';

export const DailyTestExamScreen: React.FC = () => {
  const { testUid } = useParams<{ testUid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<string>(searchParams.get('attemptId') || '');
  const [testTitle, setTestTitle] = useState<string>('');
  const [testSubtitle, setTestSubtitle] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DailyExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(2700); // 45 min default
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  const saveTimerRef = useRef<any>(null);

  // 1. Initialize Exam & Attempt
  useEffect(() => {
    if (!testUid) return;

    fetchDailyTestQuestions(testUid)
      .then(async res => {
        if (!res.success || !res.questions || res.questions.length === 0) {
          throw new Error('No verified questions returned for this daily test.');
        }

        setTestTitle(res.title);
        setTestSubtitle(res.subtitle);
        setQuestions(res.questions);
        setTimeRemaining(res.duration_seconds || 2700);

        // Track first question visited
        if (res.questions.length > 0) {
          setVisited(new Set([res.questions[0].question_uid]));
        }

        // Start attempt if no attemptId in URL
        let activeAttemptId = attemptId;
        if (!activeAttemptId) {
          const startRes = await startDailyAttempt({ test_uid: testUid });
          if (startRes.success) {
            activeAttemptId = startRes.attempt_id;
            setAttemptId(activeAttemptId);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading exam questions:', err);
        setError(err.message || 'Failed to load test questions.');
        setLoading(false);
      });
  }, [testUid]);

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
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isSubmitting, timeRemaining]);

  // 3. Autosave answers whenever they change
  const scheduleAutosave = (updatedAnswers: Record<string, number>) => {
    if (!attemptId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      saveDailyAttempt(attemptId, { answers: updatedAnswers }).catch(err => {
        console.warn('Autosave warning:', err);
      });
    }, 1200);
  };

  const handleSelectOption = (qUid: string, optPos: number) => {
    const updated = { ...answers, [qUid]: optPos };
    setAnswers(updated);
    scheduleAutosave(updated);
  };

  const handleClearOption = (qUid: string) => {
    const updated = { ...answers };
    delete updated[qUid];
    setAnswers(updated);
    scheduleAutosave(updated);
  };

  const handleToggleMarkReview = (qUid: string) => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(qUid)) {
        next.delete(qUid);
      } else {
        next.add(qUid);
      }
      return next;
    });
  };

  const goToQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setCurrentIdx(idx);
    const targetUid = questions[idx].question_uid;
    setVisited(prev => new Set(prev).add(targetUid));
  };

  const handleAutoSubmit = () => {
    alert('Time has expired! Submitting your test automatically.');
    performSubmit();
  };

  const performSubmit = async () => {
    if (!attemptId) return;
    try {
      setIsSubmitting(true);
      const res = await submitDailyAttempt(attemptId, { answers });
      if (res.success) {
        navigate(`/daily-tests/results/${attemptId}`);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to submit daily test');
      setIsSubmitting(false);
    }
  };

  // Format Timer String
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-[#E8E5DD] shadow-sm max-w-sm w-full">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#1A5344] mb-4"></i>
          <h2 className="text-base font-bold text-stone-800">Preparing Daily Test...</h2>
          <p className="text-xs text-[#64746D] mt-1">Fetching verified questions from database</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md w-full">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2 className="text-base font-bold text-stone-800">Cannot Launch Daily Test</h2>
          <p className="text-xs text-[#64746D] mt-2 mb-6">{error || 'No questions available.'}</p>
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

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const unattemptedCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between">
      {/* Top Test Header Bar */}
      <header className="bg-white border-b border-[#E8E5DD] sticky top-0 z-30 shadow-2xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/daily-tests"
              className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-[#FAF9F5]"
              title="Exit Exam"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  Daily Test
                </span>
                <h1 className="text-sm sm:text-base font-bold text-stone-900 font-outfit truncate max-w-xs sm:max-w-md md:max-w-xl">
                  {testTitle}
                </h1>
              </div>
              {testSubtitle && (
                <p className="text-[11px] text-[#64746D] truncate max-w-sm sm:max-w-lg hidden sm:block">
                  {testSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Header: Timer & Submit */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm ${
              timeRemaining < 300
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-[#FAF9F5] text-stone-800 border-[#E8E5DD]'
            }`}>
              <i className="fa-regular fa-clock text-xs"></i>
              <span>{formatTime(timeRemaining)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Question Canvas & Side Palette */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Active Question */}
        <section className="lg:col-span-8 flex flex-col justify-between bg-white rounded-2xl border border-[#E8E5DD] shadow-xs p-5 sm:p-7 min-h-[500px]">
          <div>
            {/* Question Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DD] mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-lg bg-[#E8F4F0] text-[#1A5344]">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs text-stone-500 font-medium">Single Correct MCQ</span>
              </div>
              <div className="text-xs font-bold text-stone-600 bg-[#FAF9F5] px-2.5 py-1 rounded-md border border-[#E8E5DD]">
                +4.0 / -1.0
              </div>
            </div>

            {/* Question Stem */}
            <div
              className="text-base sm:text-lg text-stone-900 leading-relaxed font-serif prose prose-stone max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: currentQ.stem }}
            />

            {/* 4 Options */}
            <div className="space-y-3">
              {currentQ.options.map(opt => {
                const isSelected = answers[currentQ.question_uid] === opt.position;
                return (
                  <button
                    key={opt.option_uid}
                    onClick={() => handleSelectOption(currentQ.question_uid, opt.position)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isSelected
                        ? 'bg-[#E8F4F0] border-[#1A5344] shadow-xs ring-1 ring-[#1A5344]'
                        : 'bg-[#FAF9F5] border-[#E8E5DD] hover:border-[#1A5344]/40 hover:bg-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isSelected
                        ? 'bg-[#1A5344] text-white border-[#1A5344]'
                        : 'border-stone-300 text-stone-600 group-hover:border-[#1A5344]'
                    }`}>
                      {String.fromCharCode(64 + opt.position)}
                    </div>
                    <div
                      className="text-sm sm:text-base text-stone-800 leading-relaxed font-sans prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: opt.text }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar at Bottom of Question Canvas */}
          <div className="pt-6 mt-8 border-t border-[#E8E5DD] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleMarkReview(currentQ.question_uid)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                  markedForReview.has(currentQ.question_uid)
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-[#FAF9F5] text-stone-700 border-[#E8E5DD] hover:bg-white'
                }`}
              >
                <i className="fa-solid fa-bookmark text-xs"></i>
                <span>{markedForReview.has(currentQ.question_uid) ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {answers[currentQ.question_uid] !== undefined && (
                <button
                  onClick={() => handleClearOption(currentQ.question_uid)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                >
                  Clear Choice
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToQuestion(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-xl border border-[#E8E5DD] text-stone-700 text-xs font-bold hover:bg-[#FAF9F5] disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-left mr-1.5"></i> Previous
              </button>

              <button
                onClick={() => goToQuestion(currentIdx + 1)}
                disabled={currentIdx === questions.length - 1}
                className="px-5 py-2 rounded-xl bg-[#1A5344] hover:bg-[#236856] text-white text-xs font-bold shadow-xs disabled:opacity-40"
              >
                Save & Next <i className="fa-solid fa-chevron-right ml-1.5"></i>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column (4 cols): NTA Question Palette */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#E8E5DD] shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-800 font-outfit uppercase tracking-wider mb-4 pb-2 border-b border-[#E8E5DD]">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 mb-4 pb-4 border-b border-[#E8E5DD]">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500"></span>
                <span>Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500"></span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-stone-300"></span>
                <span>Not Visited</span>
              </div>
            </div>

            {/* Number Grid (1..N) */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = answers[q.question_uid] !== undefined;
                const isMarked = markedForReview.has(q.question_uid);
                const isQVisited = visited.has(q.question_uid);

                let btnClass = 'bg-stone-100 text-stone-600 border-stone-200';
                if (isCurrent) {
                  btnClass = 'ring-2 ring-[#1A5344] ring-offset-1 font-black';
                }
                if (isMarked) {
                  btnClass += ' bg-purple-500 text-white border-purple-600';
                } else if (isAnswered) {
                  btnClass += ' bg-emerald-600 text-white border-emerald-700';
                } else if (isQVisited) {
                  btnClass += ' bg-rose-500 text-white border-rose-600';
                }

                return (
                  <button
                    key={q.question_uid}
                    onClick={() => goToQuestion(idx)}
                    className={`h-9 rounded-lg border text-xs font-bold flex items-center justify-center transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Summary Pill at bottom of palette */}
          <div className="mt-6 pt-4 border-t border-[#E8E5DD] text-center">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-flag-checkered"></i>
              <span>Final Submit Test</span>
            </button>
          </div>
        </aside>
      </main>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8E5DD] shadow-2xl relative">
            <h3 className="text-base font-bold text-stone-900 font-outfit mb-2">
              Ready to Submit Your Daily Test?
            </h3>
            <p className="text-xs text-[#64746D] mb-4">
              Review your attempt status below before finalizing your submission.
            </p>

            <div className="grid grid-cols-3 gap-2.5 text-center mb-6 text-xs">
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Answered</div>
                <div className="text-lg font-black mt-0.5">{answeredCount}</div>
              </div>
              <div className="p-3 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
                <div className="text-[10px] uppercase font-bold text-rose-700">Unanswered</div>
                <div className="text-lg font-black mt-0.5">{unattemptedCount}</div>
              </div>
              <div className="p-3 bg-purple-50 text-purple-900 rounded-xl border border-purple-200">
                <div className="text-[10px] uppercase font-bold text-purple-700">Review</div>
                <div className="text-lg font-black mt-0.5">{markedCount}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E5DD] text-stone-600 font-bold text-xs hover:bg-[#FAF9F5]"
              >
                Return to Exam
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  performSubmit();
                }}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Yes, Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTestExamScreen;
