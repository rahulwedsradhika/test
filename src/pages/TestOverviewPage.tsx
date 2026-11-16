import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchTestDetail, startTestAttempt } from '../api';
import { SeriesTestItem, TestSeriesCard } from '../types';

export default function TestOverviewPage() {
  const { seriesId, testId } = useParams<{ seriesId: string; testId: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<SeriesTestItem | null>(null);
  const [series, setSeries] = useState<TestSeriesCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!testId) return;
    async function loadTest() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTestDetail(testId!);
        setTest(data.test);
        setSeries(data.series);
      } catch (err: any) {
        setError(err.message || 'Failed to load test instructions');
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testId]);

  const handleStartExam = async () => {
    if (!testId) return;
    setStarting(true);
    try {
      const res = await startTestAttempt(testId);
      navigate(`/test-series/exam/${res.attempt_id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize exam session');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#1A5344] mb-3"></i>
        <p className="text-stone-600 text-sm">Loading test instructions...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <div className="font-bold mb-1">Error</div>
          {error || 'Test instructions not found.'}
          <div className="mt-4">
            <Link to="/test-series" className="underline font-semibold">Back to Test Series</Link>
          </div>
        </div>
      </div>
    );
  }

  const isPlayable = test.availability_status === 'available';
  const durationMins = test.duration_minutes || 120;
  const questionCount = test.source_question_count || test.questions_count;
  const totalMarks = questionCount * (test.marks_per_correct || 4);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <Link to="/" className="hover:text-[#1A5344] transition-colors">Home</Link>
        <span>/</span>
        <Link to="/test-series" className="hover:text-[#1A5344] transition-colors">Test Series</Link>
        <span>/</span>
        {series && (
          <>
            <Link to={`/test-series/${series.local_series_id}`} className="hover:text-[#1A5344] transition-colors truncate max-w-[200px]">
              {series.title_source_exact}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-stone-800 font-semibold">{test.title_source_exact}</span>
      </nav>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A5344] text-white p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <i className="fa-solid fa-file-signature"></i>
            Official Test Examination
          </div>
          <h1 className="text-2xl sm:text-3xl font-outfit font-extrabold">
            {test.title_source_exact}
          </h1>
          {series && (
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Part of {series.title_source_exact} (Session {series.session})
            </p>
          )}

          {/* Test Parameters Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-center">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-emerald-200 text-[10px] uppercase font-bold block">Total Questions</span>
              <strong className="text-xl font-extrabold text-white">{questionCount}</strong>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-emerald-200 text-[10px] uppercase font-bold block">Duration</span>
              <strong className="text-xl font-extrabold text-white">{durationMins} Mins</strong>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-emerald-200 text-[10px] uppercase font-bold block">Maximum Marks</span>
              <strong className="text-xl font-extrabold text-white">{totalMarks}</strong>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-emerald-200 text-[10px] uppercase font-bold block">Marking Scheme</span>
              <strong className="text-xl font-extrabold text-white">+{test.marks_per_correct} / -{test.marks_per_incorrect}</strong>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* General Instructions */}
          <div>
            <h2 className="text-base font-outfit font-bold text-stone-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-[#1A5344]"></i>
              General Examination Instructions
            </h2>
            <ul className="space-y-2.5 text-xs text-stone-600 leading-relaxed list-disc list-inside">
              <li>The clock will be set at the server. The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the examination.</li>
              <li>When the timer reaches zero, the examination will end automatically. You will not be required to end or submit your examination.</li>
              <li>Each question carries <strong>+{test.marks_per_correct} marks</strong> for correct answer and <strong>-{test.marks_per_incorrect} mark</strong> negative marking for incorrect answer. Unattempted questions receive 0 marks.</li>
              <li>Questions are bilingual and presented in Sanskrit / Hindi alongside standard English terminology.</li>
              <li>You can navigate to any question directly by clicking on its number in the Question Palette on the right.</li>
            </ul>
          </div>

          {/* Navigating to a Question Palette Legend */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-3">
              Question Palette Status Legend
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px]">1</span>
                <span className="text-stone-600">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                <span className="text-stone-600">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                <span className="text-stone-600">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">4</span>
                <span className="text-stone-600">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] relative">
                  5
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border border-white"></span>
                </span>
                <span className="text-stone-600">Answered & Marked for Review</span>
              </div>
            </div>
          </div>

          {/* Declaration Checkbox */}
          {isPlayable && (
            <div className="pt-4 border-t border-stone-200">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#1A5344] focus:ring-[#1A5344] border-stone-300"
                />
                <span className="text-xs text-stone-700 leading-normal">
                  I have read and understood all the instructions. I declare that I will attempt the examination fairly according to the standard National Examination guidelines.
                </span>
              </label>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-stone-200">
            <Link
              to={series ? `/test-series/${series.local_series_id}` : '/test-series'}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors"
            >
              Cancel & Back
            </Link>

            {isPlayable ? (
              <button
                disabled={!agreed || starting}
                onClick={handleStartExam}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                  agreed && !starting
                    ? 'bg-[#1A5344] text-white hover:bg-[#133F34] hover:shadow-lg cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                }`}
              >
                {starting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Preparing Test...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play"></i>
                    <span>Start Test Now</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-xs text-amber-700 font-semibold flex items-center gap-2">
                <i className="fa-solid fa-lock"></i>
                <span>This test is scheduled for release on {test.scheduled_at_source || 'Schedule'}.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

