import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveTagwiseAttempt, submitTagwiseAttempt } from '../api';

interface ExamQuestion {
  index: number;
  question_uid: string;
  source_question_id: string;
  stem: string;
  options: {
    option_position: number;
    option_source_raw: string;
  }[];
}

export const TagwiseExamScreen: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [tagLabel, setTagLabel] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800); // 30 mins default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<any>(null);
  const answersRef = useRef(answers);
  const markedRef = useRef(markedForReview);
  const timeSpentRef = useRef(0);

  answersRef.current = answers;
  markedRef.current = markedForReview;

  // Restore state or initialize session from server or storage
  useEffect(() => {
    if (!attemptId) return;

    fetch(`/api/tagwise/practice/${encodeURIComponent(attemptId)}/results`)
      .then(res => res.json())
      .then(data => {
        if (data.attempt && data.attempt.status === 'completed') {
          // Already completed, redirect to results
          navigate(`/tagwise/results/${attemptId}`);
        }
      })
      .catch(() => {});

    // Try fetching attempt start data or questions
    // In our start API, attempt questions are returned in start response;
    // Let's check if saved in session storage
    const cached = sessionStorage.getItem(`tagwise_exam_${attemptId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setQuestions(parsed.questions || []);
        setTagLabel(parsed.tag_label || 'Tagwise Exam');
        setTimeLeftSeconds((parsed.duration_minutes || 30) * 60);
        setLoading(false);
        return;
      } catch (e) {}
    }

    // Otherwise, fetch from server practice results endpoint or questions
    fetch(`/api/tags`)
      .then(res => res.json())
      .then(() => {
        // Fallback: fetch attempt results or default
        setLoading(false);
      });
  }, [attemptId]);

  // Mark current as visited
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex]) {
      const qid = questions[currentIndex].question_uid;
      setVisited(prev => new Set(prev).add(qid));
    }
  }, [currentIndex, questions]);

  // Timer countdown
  useEffect(() => {
    if (loading || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds(prev => {
        timeSpentRef.current += 1;
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, questions]);

  // Periodic autosave every 20 seconds
  useEffect(() => {
    if (!attemptId || loading || questions.length === 0) return;

    const interval = setInterval(() => {
      saveTagwiseAttempt(
        attemptId,
        answersRef.current,
        Array.from(markedRef.current),
        timeSpentRef.current
      ).catch(() => {});
    }, 20000);

    return () => clearInterval(interval);
  }, [attemptId, loading, questions]);

  const handleSelectOption = (pos: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.question_uid]: pos }));
  };

  const handleClearSelection = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQ.question_uid];
      return copy;
    });
  };

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentQ.question_uid)) {
        next.delete(currentQ.question_uid);
      } else {
        next.add(currentQ.question_uid);
      }
      return next;
    });
  };

  const handleAutoSubmit = async () => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitTagwiseAttempt(
        attemptId,
        answersRef.current,
        Array.from(markedRef.current),
        timeSpentRef.current
      );
      navigate(`/tagwise/results/${attemptId}`);
    } catch (err) {
      console.error('Error auto-submitting:', err);
      navigate(`/tagwise/results/${attemptId}`);
    }
  };

  const handleManualSubmit = async () => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitTagwiseAttempt(
        attemptId,
        answers,
        Array.from(markedForReview),
        timeSpentRef.current
      );
      navigate(`/tagwise/results/${attemptId}`);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Error submitting examination. Retrying...');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const isAnswered = currentQ ? answers[currentQ.question_uid] !== undefined : false;
  const isMarked = currentQ ? markedForReview.has(currentQ.question_uid) : false;

  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const unattemptedCount = Math.max(0, questions.length - answeredCount);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-[#1A5344]"></i>
          <p className="text-sm font-medium text-[#64746D]">Preparing examination environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5F0] flex flex-col select-none">
      {/* Examination Top Bar */}
      <header className="bg-white border-b border-[#E8E5DD] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1A5344] text-white flex items-center justify-center text-sm font-bold">
            🌿
          </div>
          <div>
            <div className="font-outfit font-bold text-sm text-[#1A5344]">AyurvedSiddhi Exam Simulator</div>
            <div className="text-xs text-[#64746D]">{tagLabel || 'Tagwise Practice Exam'}</div>
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-4">
          <div
            className={`px-3.5 py-1.5 rounded-full font-mono text-sm font-bold flex items-center gap-2 border shadow-2xs ${
              timeLeftSeconds < 300
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-[#FAF9F5] text-[#1A5344] border-[#E8E5DD]'
            }`}
          >
            <i className="fa-solid fa-clock text-xs"></i>
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Examination Viewport */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E8E5DD] shadow-xs p-6 sm:p-8 flex flex-col justify-between space-y-6">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question Meta */}
              <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#1A5344] text-white flex items-center justify-center font-bold text-xs">
                    Q{currentIndex + 1}
                  </span>
                  <span className="text-xs font-mono text-[#64746D]">
                    {currentQ.question_uid}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-[#E8F4F0] text-[#1A5344] font-semibold">
                    Marks: +4 / -1
                  </span>
                </div>
              </div>

              {/* Question Stem */}
              <div
                className="text-base sm:text-lg text-gray-900 leading-relaxed font-sanskrit prose prose-base max-w-none"
                dangerouslySetInnerHTML={{ __html: currentQ.stem }}
              />

              {/* Question Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map(opt => {
                  const isSelected = answers[currentQ.question_uid] === opt.option_position;
                  return (
                    <label
                      key={opt.option_position}
                      onClick={() => handleSelectOption(opt.option_position)}
                      className={`p-4 rounded-2xl border text-sm flex items-start gap-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#E8F4F0] border-[#1A5344] text-[#1A5344] font-semibold shadow-2xs'
                          : 'bg-[#FAF9F5]/60 border-[#E8E5DD] text-gray-800 hover:bg-[#FAF9F5] hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQ.question_uid}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(opt.option_position)}
                        className="mt-0.5 text-[#1A5344] focus:ring-[#1A5344]"
                      />
                      <span className="font-bold w-5 shrink-0">
                        ({String.fromCharCode(64 + opt.option_position)})
                      </span>
                      <div
                        className="leading-snug"
                        dangerouslySetInnerHTML={{ __html: opt.option_source_raw }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#64746D]">No question found.</div>
          )}

          {/* Bottom Action Controls */}
          <div className="pt-6 border-t border-[#E8E5DD] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleReview}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 ${
                  isMarked
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-[#FAF9F5] text-gray-700 border-[#E8E5DD] hover:bg-gray-100'
                }`}
              >
                <i className="fa-solid fa-flag text-xs"></i>
                <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {isAnswered && (
                <button
                  onClick={handleClearSelection}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-red-600 border border-[#E8E5DD] bg-white transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-[#E8E5DD] text-xs font-bold text-gray-700 bg-white hover:bg-[#FAF9F5] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-5 py-2.5 rounded-xl bg-[#1A5344] text-white text-xs font-bold hover:bg-[#2A7B62] shadow-xs disabled:opacity-40"
              >
                Save & Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Jump Palette & Legend */}
        <div className="space-y-6">
          {/* Palette Box */}
          <div className="bg-white rounded-3xl border border-[#E8E5DD] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
              <h4 className="font-outfit font-bold text-sm text-[#1A5344]">Question Palette</h4>
              <span className="text-xs font-semibold text-[#64746D]">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Jump Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const ans = answers[q.question_uid] !== undefined;
                const rev = markedForReview.has(q.question_uid);
                const vis = visited.has(q.question_uid);
                const isCurrent = idx === currentIndex;

                let btnClass = 'bg-gray-100 text-gray-600 border-gray-200'; // unvisited default
                if (rev && ans) {
                  btnClass = 'bg-purple-600 text-white border-purple-700 ring-2 ring-emerald-400';
                } else if (rev) {
                  btnClass = 'bg-purple-600 text-white border-purple-700';
                } else if (ans) {
                  btnClass = 'bg-emerald-600 text-white border-emerald-700';
                } else if (vis) {
                  btnClass = 'bg-rose-500 text-white border-rose-600';
                }

                return (
                  <button
                    key={q.question_uid}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-mono text-xs font-bold border transition-transform flex items-center justify-center ${btnClass} ${
                      isCurrent ? 'scale-110 shadow-md ring-2 ring-[#1A5344]' : 'hover:scale-105'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-[#E8E5DD]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <span>Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-200"></span>
                <span>Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E5DD] animate-scale-up">
            <div>
              <span className="text-xs font-bold text-[#1A5344] uppercase tracking-wider">Final Submission</span>
              <h3 className="font-outfit font-bold text-xl text-[#1A5344] mt-0.5">Submit Examination?</h3>
              <p className="text-xs text-[#64746D] mt-1">
                Are you sure you want to complete your test? You will receive an immediate scorecard with classical explanations.
              </p>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-lg font-bold text-emerald-800">{answeredCount}</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Answered</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <div className="text-lg font-bold text-rose-800">{unattemptedCount}</div>
                <div className="text-[10px] text-rose-700 font-semibold">Unanswered</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-lg font-bold text-purple-800">{markedCount}</div>
                <div className="text-[10px] text-purple-700 font-semibold">Review</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-1/2 py-3 rounded-xl border border-[#E8E5DD] text-xs font-bold text-gray-700 hover:bg-[#FAF9F5]"
              >
                Back to Test
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="w-1/2 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Grading...</span>
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
