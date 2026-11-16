import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchDailySessions, fetchDailySessionTests, startDailyAttempt } from '../api';
import { DailySession, DailyTestCatalogItem } from '../types';

export const DailyTestsHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId: paramSessionId } = useParams<{ sessionId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(paramSessionId || 'DLY-2026-2027');
  const [tests, setTests] = useState<DailyTestCatalogItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingTests, setLoadingTests] = useState(true);

  // Filters
  const activeFilter = (searchParams.get('filter') || 'all').toLowerCase();
  const [searchQuery, setSearchQuery] = useState('');

  // Instructions Modal
  const [selectedTestForModal, setSelectedTestForModal] = useState<DailyTestCatalogItem | null>(null);
  const [startingAttempt, setStartingAttempt] = useState(false);

  // Expanded subtitles
  const [expandedSubtitles, setExpandedSubtitles] = useState<Record<string, boolean>>({});

  // 1. Fetch Sessions
  useEffect(() => {
    fetchDailySessions()
      .then(res => {
        if (res.success && res.sessions.length > 0) {
          setSessions(res.sessions);
          if (!paramSessionId) {
            setSelectedSessionId(res.sessions[0].local_session_id);
          }
        }
        setLoadingSessions(false);
      })
      .catch(err => {
        console.error('Error fetching daily sessions:', err);
        setLoadingSessions(false);
      });
  }, []);

  // Update selected session if URL param or query param changes
  useEffect(() => {
    const qSession = searchParams.get('session');
    if (paramSessionId) {
      setSelectedSessionId(paramSessionId);
    } else if (qSession) {
      setSelectedSessionId(qSession);
    }
  }, [paramSessionId, searchParams]);

  // 2. Fetch Tests for Selected Session
  useEffect(() => {
    if (!selectedSessionId) return;
    setLoadingTests(true);

    fetchDailySessionTests(selectedSessionId, {
      filter: activeFilter,
      search: searchQuery
    })
      .then(res => {
        if (res.success) {
          setTests(res.tests);
          const modalUid = searchParams.get('modal');
          if (modalUid) {
            const target = res.tests.find(t => t.test_uid === modalUid);
            if (target) setSelectedTestForModal(target);
          }
        }
        setLoadingTests(false);
      })
      .catch(err => {
        console.error('Error fetching tests for session:', err);
        setLoadingTests(false);
      });
  }, [selectedSessionId, activeFilter, searchQuery]);

  const handleSelectSession = (sId: string) => {
    setSelectedSessionId(sId);
    navigate(`/daily-tests/sessions/${sId}${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  };

  const handleFilterChange = (newFilter: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('filter', newFilter);
    setSearchParams(nextParams);
  };

  const handleStartExam = async (test: DailyTestCatalogItem) => {
    try {
      setStartingAttempt(true);
      const res = await startDailyAttempt({
        test_uid: test.test_uid,
        session_id: selectedSessionId
      });
      if (res.success) {
        navigate(`/daily-tests/exam/${test.test_uid}?attemptId=${res.attempt_id}`);
      }
    } catch (e: any) {
      alert(e.message || 'Could not start daily test attempt');
    } finally {
      setStartingAttempt(false);
      setSelectedTestForModal(null);
    }
  };

  const toggleSubtitle = (testUid: string) => {
    setExpandedSubtitles(prev => ({
      ...prev,
      [testUid]: !prev[testUid]
    }));
  };

  const currentSession = sessions.find(s => s.local_session_id === selectedSessionId);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-16">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#1A5344] via-[#236856] to-[#2E8B70] text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                  Phase 7 Module
                </span>
                <span className="text-xs text-white/80 font-medium">Daily Exam Simulation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-outfit tracking-tight">
                DAILY TESTS
              </h1>
              <p className="text-sm sm:text-base text-white/85 mt-1 font-sanskrit">
                दैनिक परीक्षण — Authentic Ayurvedic Samhita & Subject Daily Practice
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap gap-2.5">
              <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-center backdrop-blur-xs">
                <div className="text-xs text-white/70">Sessions</div>
                <div className="text-lg font-bold">3 Academic</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-center backdrop-blur-xs">
                <div className="text-xs text-white/70">Catalogued</div>
                <div className="text-lg font-bold text-amber-300">750 Tests</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-center backdrop-blur-xs">
                <div className="text-xs text-white/70">Verified Qs</div>
                <div className="text-lg font-bold text-emerald-300">12,350 Qs</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-center backdrop-blur-xs">
                <div className="text-xs text-white/70">Owner Target</div>
                <div className="text-lg font-bold text-sky-200">750 Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Session Switcher Tabs (Screenshot #1 Style) */}
        <div className="bg-white p-3 rounded-2xl border border-[#E8E5DD] shadow-xs">
          <div className="text-xs font-bold text-[#64746D] uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-layer-group text-xs text-[#1A5344]"></i>
            Select Academic Session
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {loadingSessions ? (
              <div className="col-span-3 text-center py-4 text-[#64746D]">
                <i className="fa-solid fa-circle-notch fa-spin text-lg mr-2"></i> Loading sessions...
              </div>
            ) : (
              sessions.map(s => {
                const isSelected = s.local_session_id === selectedSessionId;
                return (
                  <button
                    key={s.local_session_id}
                    onClick={() => handleSelectSession(s.local_session_id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1A5344] text-white border-[#1A5344] shadow-md shadow-[#1A5344]/15'
                        : 'bg-[#FAF9F5] text-stone-700 border-[#E8E5DD] hover:border-[#1A5344]/40 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-wider opacity-75">
                        SESSION
                      </div>
                      <div className="text-base sm:text-lg font-extrabold font-outfit">
                        {s.session_year}
                      </div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#64746D]'}`}>
                        {s.verified_catalog_memberships} Catalogued • {s.ready_tests} Playable
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#E8E5DD] text-[#1A5344]'
                      }`}>
                        Target 250
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Filter Controls & Search (Screenshot #1: All, Solved, Un Solved) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-[#E8E5DD] shadow-xs">
          {/* Screenshot #1 Exact Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E5DD]">
            <button
              onClick={() => handleFilterChange('all')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-white text-[#1A5344] shadow-xs border border-[#E8E5DD]'
                  : 'text-[#64746D] hover:text-[#1A5344]'
              }`}
            >
              <i className="fa-solid fa-list-ol text-xs"></i>
              <span>All</span>
            </button>
            <button
              onClick={() => handleFilterChange('solved')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeFilter === 'solved'
                  ? 'bg-white text-emerald-700 shadow-xs border border-[#E8E5DD]'
                  : 'text-[#64746D] hover:text-emerald-700'
              }`}
            >
              <i className="fa-solid fa-circle-check text-xs text-emerald-600"></i>
              <span>Solved</span>
            </button>
            <button
              onClick={() => handleFilterChange('unsolved')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeFilter === 'unsolved'
                  ? 'bg-white text-rose-700 shadow-xs border border-[#E8E5DD]'
                  : 'text-[#64746D] hover:text-rose-700'
              }`}
            >
              <i className="fa-solid fa-circle-xmark text-xs text-rose-500"></i>
              <span>Un Solved</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tests by title or chapter..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] text-xs sm:text-sm focus:outline-hidden focus:border-[#1A5344] focus:bg-white transition-all text-stone-800 placeholder-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Tests List Header */}
        <div className="flex items-center justify-between text-xs text-[#64746D] px-1">
          <div>
            Showing <span className="font-bold text-stone-800">{tests.length}</span> tests in Session{' '}
            <span className="font-bold text-[#1A5344]">{currentSession?.session_year}</span>
            {activeFilter !== 'all' && (
              <span className="ml-1 font-semibold text-stone-600">({activeFilter})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ready: {tests.filter(t => t.is_ready).length}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Scheduled: {tests.filter(t => !t.is_ready).length}
            </span>
          </div>
        </div>

        {/* Test Cards Grid */}
        {loadingTests ? (
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-12 text-center text-[#64746D]">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#1A5344] mb-3"></i>
            <p className="text-sm font-semibold">Loading daily test records...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-12 text-center text-[#64746D]">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-center mx-auto mb-4 text-2xl text-stone-400">
              <i className="fa-solid fa-clipboard-question"></i>
            </div>
            <h3 className="text-base font-bold text-stone-800">No daily tests found</h3>
            <p className="text-xs text-[#64746D] mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No tests match your search "${searchQuery}". Try a different keyword.`
                : activeFilter === 'solved'
                ? 'You have not completed any tests in this session yet. Solve a test to see it here!'
                : 'No tests available under the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map(test => {
              const isExpanded = !!expandedSubtitles[test.test_uid];
              const badgeNum = test.source_badge_text || test.session_position || '•';

              return (
                <div
                  key={test.test_uid}
                  className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top row: Badge and Date */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {/* Circular Pink Badge (matching Screenshot #2) */}
                      <div className="w-9 h-9 rounded-full bg-pink-50 border border-pink-200 text-pink-700 font-extrabold text-xs flex items-center justify-center shadow-2xs font-outfit">
                        {badgeNum}
                      </div>

                      {/* Displayed Date */}
                      <div className="text-xs font-semibold text-[#64746D] flex items-center gap-1.5 bg-[#FAF9F5] px-2.5 py-1 rounded-full border border-[#E8E5DD]/70">
                        <i className="fa-regular fa-calendar text-[11px] text-stone-400"></i>
                        <span>{test.source_date_text || 'Active Daily Test'}</span>
                      </div>
                    </div>

                    {/* Original Title (Screenshot #2) */}
                    <h3 className="text-base font-bold text-stone-900 font-outfit group-hover:text-[#1A5344] transition-colors leading-snug">
                      {test.original_title}
                    </h3>

                    {/* Original Subtitle (Separate, Preserved Exact) */}
                    {test.original_subtitle && (
                      <div className="mt-2 text-xs text-[#64746D] leading-relaxed">
                        <p className={isExpanded ? '' : 'line-clamp-2'}>
                          {test.original_subtitle}
                        </p>
                        {test.original_subtitle.length > 80 && (
                          <button
                            onClick={() => toggleSubtitle(test.test_uid)}
                            className="text-[11px] font-bold text-[#1A5344] hover:underline mt-0.5 inline-block"
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* 4-Stat Metric Box (Screenshot #2: Marks 200, MCQ 50, Time 45 min, Status) */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 my-4 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD]/70 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          <i className="fa-solid fa-award mr-1 text-amber-500"></i> Marks
                        </div>
                        <div className="font-extrabold text-stone-800 text-sm mt-0.5">
                          {test.declared_marks || 200}
                        </div>
                      </div>
                      <div className="border-x border-[#E8E5DD]">
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          <i className="fa-solid fa-circle-question mr-1 text-blue-500"></i> MCQ
                        </div>
                        <div className="font-extrabold text-stone-800 text-sm mt-0.5">
                          {test.declared_mcq_count || 50}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          <i className="fa-regular fa-clock mr-1 text-teal-500"></i> Time
                        </div>
                        <div className="font-extrabold text-stone-800 text-sm mt-0.5">
                          {Math.round((test.duration_seconds || 2700) / 60)} min
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions / CTA Buttons */}
                  <div className="pt-2 border-t border-[#E8E5DD]/70">
                    {test.student_solved ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedTestForModal(test)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <i className="fa-solid fa-circle-check text-emerald-600"></i>
                          <span>Solved • Review</span>
                        </button>
                      </div>
                    ) : test.is_ready ? (
                      <button
                        onClick={() => setSelectedTestForModal(test)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1A5344] hover:bg-[#236856] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <i className="fa-solid fa-play text-xs text-white/80"></i>
                        <span>Solve Test</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-500 text-xs text-center font-medium flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-lock text-[11px] text-stone-400"></i>
                        <span>Upstream Gated / Upcoming</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions Modal (Screenshot #2) */}
      {selectedTestForModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E8E5DD] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setSelectedTestForModal(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-700 font-black text-base flex items-center justify-center font-outfit border border-pink-200">
                {selectedTestForModal.source_badge_text || selectedTestForModal.session_position || '•'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-outfit">
                  {selectedTestForModal.original_title}
                </h3>
                <p className="text-xs text-[#64746D]">
                  {selectedTestForModal.source_date_text || 'Daily Test'}
                </p>
              </div>
            </div>

            {/* Subtitle */}
            {selectedTestForModal.original_subtitle && (
              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD] text-xs text-[#64746D] mb-4 leading-relaxed">
                <span className="font-bold text-stone-700 block mb-0.5">Syllabus / Chapters:</span>
                {selectedTestForModal.original_subtitle}
              </div>
            )}

            {/* Exam Parameters */}
            <div className="grid grid-cols-3 gap-2.5 text-center mb-5 text-xs">
              <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD]">
                <div className="text-[10px] text-stone-400 font-bold uppercase">Total Marks</div>
                <div className="text-base font-extrabold text-[#1A5344] mt-0.5">
                  {selectedTestForModal.declared_marks || 200}
                </div>
              </div>
              <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD]">
                <div className="text-[10px] text-stone-400 font-bold uppercase">Questions</div>
                <div className="text-base font-extrabold text-[#1A5344] mt-0.5">
                  {selectedTestForModal.declared_mcq_count || 50} MCQs
                </div>
              </div>
              <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD]">
                <div className="text-[10px] text-stone-400 font-bold uppercase">Duration</div>
                <div className="text-base font-extrabold text-[#1A5344] mt-0.5">
                  {Math.round((selectedTestForModal.duration_seconds || 2700) / 60)} min
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-1.5 text-xs text-[#64746D] mb-6">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-emerald-600"></i>
                <span><strong>+4.0 Marks</strong> for each correct response</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-minus text-rose-500"></i>
                <span><strong>-1.0 Negative Mark</strong> for each incorrect response</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-sky-600"></i>
                <span>Answer keys and classical commentary remain hidden until submission</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTestForModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E5DD] text-stone-600 font-bold text-xs hover:bg-[#FAF9F5]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartExam(selectedTestForModal)}
                disabled={startingAttempt}
                className="flex-2 py-2.5 rounded-xl bg-[#1A5344] hover:bg-[#236856] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {startingAttempt ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span>Initializing Exam...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play text-xs"></i>
                    <span>Begin Test</span>
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

export default DailyTestsHomePage;
