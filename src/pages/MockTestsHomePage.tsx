import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getMockYears, getMockTests, startMockAttempt } from '../api';
import { MockYear, MockTestListing } from '../types';

export const MockTestsHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { year: paramYear } = useParams<{ year?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [years, setYears] = useState<MockYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(paramYear ? parseInt(paramYear, 10) : 2027);
  const [tests, setTests] = useState<MockTestListing[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingTests, setLoadingTests] = useState(true);

  // Filters
  const activeFilter = (searchParams.get('filter') || 'all').toLowerCase();
  const [searchQuery, setSearchQuery] = useState('');

  // Instructions Modal
  const [selectedTestForModal, setSelectedTestForModal] = useState<MockTestListing | null>(null);
  const [startingAttempt, setStartingAttempt] = useState(false);

  // 1. Fetch Years
  useEffect(() => {
    getMockYears()
      .then(res => {
        if (res.success && res.years.length > 0) {
          setYears(res.years);
          if (!paramYear) {
            setSelectedYear(res.years[0].display_year);
          }
        }
        setLoadingYears(false);
      })
      .catch(err => {
        console.error('Error fetching mock years:', err);
        setLoadingYears(false);
      });
  }, []);

  // Update selected year if URL param changes
  useEffect(() => {
    if (paramYear) {
      const y = parseInt(paramYear, 10);
      if (!isNaN(y)) {
        setSelectedYear(y);
      }
    }
  }, [paramYear]);

  // 2. Fetch Tests for Selected Year
  useEffect(() => {
    if (!selectedYear) return;
    setLoadingTests(true);

    getMockTests(selectedYear, {
      filter: activeFilter,
      search: searchQuery
    })
      .then(res => {
        if (res.success) {
          setTests(res.tests);
        }
        setLoadingTests(false);
      })
      .catch(err => {
        console.error('Error fetching mock tests for year:', err);
        setLoadingTests(false);
      });
  }, [selectedYear, activeFilter, searchQuery]);

  const handleSelectYear = (yr: number) => {
    setSelectedYear(yr);
    navigate(`/mock-tests/${yr}${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  };

  const handleFilterChange = (newFilter: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('filter', newFilter);
    setSearchParams(nextParams);
  };

  const handleStartExam = async (test: MockTestListing) => {
    try {
      setStartingAttempt(true);
      const res = await startMockAttempt({
        test_id: test.test_id,
        year_id: currentYearObj ? currentYearObj.year_id : `MOCK-YR-${selectedYear}`
      });
      if (res.success) {
        navigate(`/mock-tests/exam/${test.test_id}?attemptId=${res.attempt_id}`);
      }
    } catch (e: any) {
      alert(e.message || 'Could not start mock test attempt');
    } finally {
      setStartingAttempt(false);
      setSelectedTestForModal(null);
    }
  };

  const currentYearObj = years.find(y => y.display_year === selectedYear);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#1A5344] via-[#236856] to-[#2E8B70] text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                  Phase 8 • AIAPGET & UPSC
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  Verified Classical MCQs
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif">
                AIAPGET & UPSC Mock Tests
              </h1>
              <p className="mt-2 text-emerald-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                Standard full-syllabus Ayurveda simulated examinations with authentic classical question banks, negative marking, question palette, and detailed verse commentary.
              </p>
            </div>

            {/* Quick Metrics Badge Card */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/15">
              <div className="text-right">
                <div className="text-2xl font-black text-amber-300">
                  {years.reduce((acc, y) => acc + (y.verified_listings || y.expected_listings || 0), 0) || 398}
                </div>
                <div className="text-xs text-emerald-100 font-medium">Total Mock Tests</div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-right">
                <div className="text-2xl font-black text-white">4</div>
                <div className="text-xs text-emerald-100 font-medium">Year Groups</div>
              </div>
            </div>
          </div>

          {/* 4-Year Selector Bar matching source screenshot layout */}
          <div className="mt-8 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Select Examination Year:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
              {years.map(y => {
                const isSelected = y.display_year === selectedYear;
                return (
                  <button
                    key={y.year_id}
                    onClick={() => handleSelectYear(y.display_year)}
                    className={`relative flex flex-col items-center justify-center py-3.5 px-4 rounded-xl text-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#1A5344] shadow-lg shadow-black/10 font-bold scale-[1.02]'
                        : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wider opacity-75 font-semibold">
                      Year
                    </span>
                    <span className="text-2xl font-extrabold font-serif mt-0.5">
                      {y.display_year}
                    </span>
                    <span className={`text-[11px] mt-1 px-2 py-0.5 rounded-full font-medium ${
                      isSelected
                        ? 'bg-[#1A5344]/10 text-[#1A5344]'
                        : 'bg-white/15 text-emerald-100'
                    }`}>
                      {y.verified_listings || y.expected_listings} Tests ({y.academic_session})
                    </span>
                    {isSelected && (
                      <span className="absolute -bottom-1.5 w-6 h-1 bg-amber-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Session Info & Search / Filter Toolbar */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 font-serif">
                  {currentYearObj?.display_year} Mock Tests Catalog
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  Academic Session {currentYearObj?.academic_session}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Showing {tests.length} authentic AIAPGET mock tests • Route: {currentYearObj?.source_route_hint}
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search test name or topic..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5344] focus:bg-white transition-all"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 text-xs">
                {(['all', 'unsolved', 'solved'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-all cursor-pointer ${
                      activeFilter === f
                        ? 'bg-[#1A5344] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        {loadingTests ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-4" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 max-w-md mx-auto my-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">No Mock Tests Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              No tests match your current search or filter criteria.
            </p>
            <button
              onClick={() => { setSearchQuery(''); handleFilterChange('all'); }}
              className="mt-4 px-4 py-2 bg-[#1A5344] text-white text-xs font-semibold rounded-lg hover:bg-[#236856] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.map(test => {
              const isSolved = test.is_solved;
              const isInProgress = test.is_in_progress;
              const attempt = test.attempt;

              return (
                <div
                  key={test.test_id}
                  className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                    isSolved
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isInProgress
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-gray-200/90'
                  }`}
                >
                  <div className="p-5">
                    {/* Top Row: Number badge + Exam Date */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-md bg-[#1A5344]/10 text-[#1A5344] font-mono text-xs font-bold flex items-center justify-center">
                          {test.original_listing_order}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500">
                          {test.exam_date || 'AIAPGET'}
                        </span>
                      </div>

                      {/* Status Badges */}
                      {isSolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Solved • {attempt?.score}/{attempt?.max_marks} pts
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          In Progress
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Unsolved
                        </span>
                      )}
                    </div>

                    {/* Test Title & Subtitle */}
                    <h3 className="text-base font-bold text-gray-900 font-serif leading-snug">
                      {test.exact_title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {test.exact_subtitle || 'All Samhitas & Subjects Comprehensive Mock'}
                    </p>

                    {/* Metadata Grid (Marks, Questions, Time, Pattern) */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold block">MCQs</span>
                        <span className="text-xs font-bold text-gray-800">{test.mcq_count} Qs</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold block">Max Marks</span>
                        <span className="text-xs font-bold text-emerald-700">{test.max_marks} Pts</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold block">Duration</span>
                        <span className="text-xs font-bold text-gray-800">{Math.round(test.duration_seconds / 60)} Min</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedTestForModal(test)}
                      className="text-xs font-semibold text-[#1A5344] hover:text-[#236856] flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Instructions
                    </button>

                    <div className="flex items-center gap-2">
                      {isSolved && attempt ? (
                        <>
                          <button
                            onClick={() => navigate(`/mock-tests/results/${attempt.attempt_id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => setSelectedTestForModal(test)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            Retake
                          </button>
                        </>
                      ) : isInProgress && attempt ? (
                        <button
                          onClick={() => navigate(`/mock-tests/exam/${test.test_id}?attemptId=${attempt.attempt_id}`)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>Resume</span>
                          <span>→</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTestForModal(test)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1A5344] text-white hover:bg-[#236856] transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>Solve Test</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Start Instructions Modal */}
      {selectedTestForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#1A5344] bg-[#1A5344]/10 px-2.5 py-0.5 rounded-full">
                  AIAPGET Examination
                </span>
                <h3 className="text-xl font-bold text-gray-900 font-serif mt-1">
                  {selectedTestForModal.exact_title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedTestForModal.exact_subtitle || 'All Samhitas & Subjects Comprehensive Mock'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTestForModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 text-lg rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Test Specifications Summary */}
            <div className="grid grid-cols-3 gap-3 mb-5 p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-center">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Questions</span>
                <span className="text-sm font-bold text-gray-900">{selectedTestForModal.mcq_count} MCQs</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Marks</span>
                <span className="text-sm font-bold text-emerald-700">{selectedTestForModal.max_marks} Marks</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Time Allowed</span>
                <span className="text-sm font-bold text-gray-900">{Math.round(selectedTestForModal.duration_seconds / 60)} Mins</span>
              </div>
            </div>

            {/* Guidelines */}
            <div className="space-y-2.5 text-xs text-gray-600 mb-6 max-h-48 overflow-y-auto pr-1">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Marking Scheme:</strong> +4 marks for each correct response, -1 mark deducted for incorrect responses (0 for unattempted).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Question Palette:</strong> Navigate freely between questions. You can mark items for review and revisit anytime.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Autosave & Resume:</strong> Your selections are saved continuously. You can resume in-progress attempts.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Comprehensive Review:</strong> Detailed scorecards, accuracy metrics, and classical citations are available immediately upon test submission.</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedTestForModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartExam(selectedTestForModal)}
                disabled={startingAttempt}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1A5344] hover:bg-[#236856] rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {startingAttempt ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing Test...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Mock Test</span>
                    <span>→</span>
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
