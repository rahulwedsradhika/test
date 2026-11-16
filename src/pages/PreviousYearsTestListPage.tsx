import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchPreviousYearGroupTests, startPYPAttempt } from '../api';
import { PreviousYearGroup, PreviousYearTest } from '../types';

export const PreviousYearsTestListPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<PreviousYearGroup | null>(null);
  const [tests, setTests] = useState<PreviousYearTest[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Instructions Modal State
  const [selectedTestForModal, setSelectedTestForModal] = useState<PreviousYearTest | null>(null);
  const [launchingExam, setLaunchingExam] = useState<boolean>(false);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    fetchPreviousYearGroupTests(groupId, { limit: 200 })
      .then(res => {
        if (res.success) {
          setGroup(res.group);
          setTests(res.tests);
          setAvailableYears(res.available_years || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching PYP tests:', err);
        setError('Failed to load previous year papers for this category.');
        setLoading(false);
      });
  }, [groupId]);

  const filteredTests = tests.filter(t => {
    if (selectedYear !== 'all' && t.exam_year_source !== selectedYear) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title_source_exact.toLowerCase().includes(q) ||
        (t.exam_year_source && t.exam_year_source.toLowerCase().includes(q)) ||
        (t.exam_type_source && t.exam_type_source.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleLaunchExam = async (test: PreviousYearTest) => {
    try {
      setLaunchingExam(true);
      const res = await startPYPAttempt(test.test_uid);
      if (res.success && res.attempt_id) {
        navigate(`/previous-years/tests/${test.test_uid}/exam?attempt_id=${res.attempt_id}`);
      } else {
        alert('Could not start test session. Please try again.');
        setLaunchingExam(false);
      }
    } catch (e: any) {
      console.error('Error starting PYP exam:', e);
      alert('Error launching examination: ' + (e.message || 'Server error'));
      setLaunchingExam(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 font-medium">
          <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
          <i className="fa-solid fa-chevron-right text-[10px] text-stone-400"></i>
          <Link to="/previous-years" className="hover:text-emerald-700 transition-colors">Previous Year Papers</Link>
          <i className="fa-solid fa-chevron-right text-[10px] text-stone-400"></i>
          <span className="text-stone-800 font-semibold truncate max-w-[200px] sm:max-w-none">
            {group?.screenshot_label_exact || groupId}
          </span>
        </div>

        <Link
          to="/previous-years"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>All 3 Categories</span>
        </Link>
      </div>

      {/* Category Header Card */}
      {group && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <i className="fa-solid fa-calendar-check text-emerald-600"></i>
              <span>Category {group.local_group_id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-stone-900 tracking-tight">
              {group.screenshot_label_exact}
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              {group.screenshot_description_exact}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100 self-start md:self-auto">
            <div>
              <div className="text-xs font-semibold text-stone-500">Available Papers</div>
              <div className="text-2xl font-bold font-outfit text-emerald-800">
                {filteredTests.length} <span className="text-xs font-normal text-stone-400">of {tests.length}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-stone-200"></div>
            <div>
              <div className="text-xs font-semibold text-stone-500">Total MCQs</div>
              <div className="text-2xl font-bold font-outfit text-stone-800">
                {tests.reduce((acc, t) => acc + (t.actual_question_count || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Year Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedYear === 'all'
                  ? 'bg-[#1A5344] text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All Years ({tests.length})
            </button>
            {availableYears.map(yr => {
              const count = tests.filter(t => t.exam_year_source === yr).length;
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedYear === yr
                      ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {yr} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search paper title or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-stone-50 border border-stone-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-stone-800"
            />
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-stone-200">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-emerald-600"></i>
          <p className="text-stone-600 font-medium">Loading previous year examination papers...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
          <i className="fa-solid fa-circle-exclamation text-lg"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Tests Grid / List */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredTests.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <i className="fa-solid fa-file-circle-question text-4xl text-stone-300"></i>
              <p className="text-stone-600 font-medium">No previous year papers match your filter criteria.</p>
              <button
                onClick={() => { setSelectedYear('all'); setSearchQuery(''); }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTests.map((test, idx) => {
                const durationMin = Math.round(test.duration_seconds_source / 60);
                return (
                  <div
                    key={test.test_uid}
                    className="bg-white rounded-2xl border border-stone-200/90 p-5 hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center font-mono">
                            {test.source_position || (idx + 1)}
                          </span>
                          {test.exam_year_source && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              #{test.exam_year_source}
                            </span>
                          )}
                          {test.exam_type_source && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 uppercase">
                              #{test.exam_type_source}
                            </span>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Verified</span>
                        </span>
                      </div>

                      <h3 className="text-base font-bold font-outfit text-stone-900 group-hover:text-emerald-800 transition-colors">
                        {test.title_source_exact}
                      </h3>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-stone-50 rounded-xl border border-stone-100">
                        <div>
                          <div className="text-[10px] text-stone-500 font-semibold uppercase">Questions</div>
                          <div className="font-bold font-outfit text-stone-800">{test.actual_question_count} MCQs</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-stone-500 font-semibold uppercase">Duration</div>
                          <div className="font-bold font-outfit text-stone-800">{durationMin} min</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-stone-500 font-semibold uppercase">Marks</div>
                          <div className="font-bold font-outfit text-stone-800">{test.max_marks_source} M</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-stone-500 font-semibold uppercase">Marking</div>
                          <div className="font-bold font-outfit text-emerald-700">+{test.max_marks_source / test.actual_question_count} / -{test.negative_marking_source}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                      <button
                        onClick={() => setSelectedTestForModal(test)}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <i className="fa-solid fa-circle-info text-stone-500"></i>
                        <span>Instructions</span>
                      </button>

                      <button
                        onClick={() => handleLaunchExam(test)}
                        disabled={launchingExam}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#1A5344] hover:bg-[#133D32] text-white flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <i className="fa-solid fa-play text-xs text-amber-300"></i>
                        <span>Solve Paper</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Instructions / Overview Modal */}
      {selectedTestForModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-scale-in">
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-stone-100">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Examination Rules & Format
                </span>
                <h3 className="text-xl font-bold font-outfit text-stone-900">
                  {selectedTestForModal.title_source_exact}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTestForModal(null)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-600">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-center">
                <div>
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Total MCQs</div>
                  <div className="text-base font-bold text-stone-900">{selectedTestForModal.actual_question_count}</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Time Allowed</div>
                  <div className="text-base font-bold text-stone-900">{Math.round(selectedTestForModal.duration_seconds_source / 60)} min</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Total Marks</div>
                  <div className="text-base font-bold text-emerald-800">{selectedTestForModal.max_marks_source}</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Negative</div>
                  <div className="text-base font-bold text-red-600">-{selectedTestForModal.negative_marking_source}</div>
                </div>
              </div>

              <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-emerald-700"></i>
                  <span>Important Instructions for Candidate:</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-emerald-900/90 leading-relaxed">
                  <li>This test is simulated in strict National Testing Agency (NTA) exam mode.</li>
                  <li>Questions are presented with authentic Sanskrit shlokas and Hindi/English options.</li>
                  <li>The countdown timer starts as soon as you enter the exam simulator.</li>
                  <li>Your answers are continuously autosaved to prevent any accidental loss of progress.</li>
                  <li>Comprehensive classical references and Samhita citations are revealed immediately upon submission.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedTestForModal(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const t = selectedTestForModal;
                  setSelectedTestForModal(null);
                  handleLaunchExam(t);
                }}
                disabled={launchingExam}
                className="flex-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#1A5344] hover:bg-[#133D32] text-white flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <i className="fa-solid fa-play text-xs text-amber-300"></i>
                <span>Enter Examination Mode</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousYearsTestListPage;

