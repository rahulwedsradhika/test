import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTestSeriesDetail } from '../api';
import { TestSeriesCard, SeriesTestItem } from '../types';

export default function TestSeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [series, setSeries] = useState<TestSeriesCard | null>(null);
  const [tests, setTests] = useState<SeriesTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [tabFilter, setTabFilter] = useState<'ALL' | 'AVAILABLE' | 'SCHEDULED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!seriesId) return;
    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTestSeriesDetail(seriesId!);
        setSeries(data.series);
        setTests(data.tests);
      } catch (err: any) {
        setError(err.message || 'Failed to load test series details');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [seriesId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#1A5344] mb-3"></i>
        <p className="text-stone-600 text-sm">Loading test series and tests catalog...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <div className="font-bold flex items-center gap-2 mb-1">
            <i className="fa-solid fa-triangle-exclamation"></i>
            Series not found
          </div>
          {error || 'The requested test series could not be loaded.'}
          <div className="mt-4">
            <Link to="/test-series" className="text-red-700 underline font-semibold text-xs">
              Return to Test Series Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredTests = tests.filter(t => {
    const matchesTab =
      tabFilter === 'ALL' ||
      (tabFilter === 'AVAILABLE' && t.availability_status === 'available') ||
      (tabFilter === 'SCHEDULED' && t.availability_status === 'scheduled');
    const matchesSearch = t.title_source_exact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const availableCount = tests.filter(t => t.availability_status === 'available').length;
  const scheduledCount = tests.filter(t => t.availability_status === 'scheduled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <Link to="/" className="hover:text-[#1A5344] transition-colors">Home</Link>
        <span>/</span>
        <Link to="/test-series" className="hover:text-[#1A5344] transition-colors">Test Series</Link>
        <span>/</span>
        <Link to={`/test-series?session=${series.session}`} className="hover:text-[#1A5344] transition-colors">
          Session {series.session}
        </Link>
        <span>/</span>
        <span className="text-stone-800 font-semibold truncate max-w-xs">{series.title_source_exact}</span>
      </nav>

      {/* Series Hero Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DD] shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700">
                Session {series.session}
              </span>
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                <i className="fa-solid fa-graduation-cap mr-1"></i>
                {series.exam_button_label_source}
              </span>
              <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                series.access_badge_source === 'FREE' ? 'bg-emerald-600 text-white' : 'bg-rose-700 text-white'
              }`}>
                {series.access_badge_source}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                <i className="fa-solid fa-circle-check mr-1 text-emerald-600"></i>
                100% Source Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-outfit font-extrabold text-stone-900 tracking-tight">
              {series.title_source_exact}
            </h1>

            <p className="text-stone-600 text-xs sm:text-sm mt-3 leading-relaxed">
              {series.description || 'Complete official tests schedule with authentic bilingual questions, timed examination environment, and classical Ayurvedic references.'}
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-4 text-xs text-stone-500">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Schedule Period</span>
                <strong className="text-stone-700">{series.start_date_iso} to {series.end_date_iso}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Students Enrolled</span>
                <strong className="text-stone-700">{series.students_enrolled_source?.toLocaleString() || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Quick Metrics Box */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 min-w-[260px] p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center text-xs">
            <div className="p-2">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Total Tests</span>
              <span className="text-xl font-extrabold text-[#1A5344] mt-0.5 block">{tests.length}</span>
              <span className="text-[10px] text-stone-500 font-medium">Expected: {series.expected_test_count}</span>
            </div>
            <div className="p-2">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Available Now</span>
              <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">{availableCount}</span>
              <span className="text-[10px] text-emerald-600 font-medium">Ready to Solve</span>
            </div>
            <div className="p-2 col-span-2 sm:col-span-1 lg:col-span-2 border-t sm:border-t-0 lg:border-t border-stone-200 pt-2 sm:pt-0 lg:pt-2">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Verified Questions</span>
              <span className="text-lg font-extrabold text-stone-800 mt-0.5 block">
                {tests.reduce((acc, t) => acc + (t.questions_count || 0), 0).toLocaleString()} Qs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Tab Filter */}
        <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setTabFilter('ALL')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              tabFilter === 'ALL'
                ? 'bg-white text-[#1A5344] shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Tests ({tests.length})
          </button>
          <button
            onClick={() => setTabFilter('AVAILABLE')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              tabFilter === 'AVAILABLE'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Available to Solve ({availableCount})
          </button>
          <button
            onClick={() => setTabFilter('SCHEDULED')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              tabFilter === 'SCHEDULED'
                ? 'bg-white text-amber-800 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Scheduled / Upcoming ({scheduledCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search tests in this series..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-[#E8E5DD] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5344]/20 focus:border-[#1A5344]"
          />
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filteredTests.map((test, index) => {
          const isPlayable = test.availability_status === 'available' && test.questions_count > 0;
          return (
            <div
              key={test.local_test_id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isPlayable
                  ? 'bg-white border-[#E8E5DD] hover:border-[#1A5344]/40 hover:shadow-sm'
                  : 'bg-stone-50/60 border-stone-200/80 opacity-90'
              }`}
            >
              {/* Test Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-outfit font-extrabold text-sm shrink-0 ${
                  isPlayable ? 'bg-[#E8F4F0] text-[#1A5344]' : 'bg-stone-200 text-stone-600'
                }`}>
                  {test.source_order}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-outfit font-extrabold text-base text-stone-900">
                      {test.title_source_exact}
                    </h3>
                    {isPlayable ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <i className="fa-solid fa-circle-play mr-1"></i>
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        <i className="fa-solid fa-clock mr-1"></i>
                        Scheduled for {test.scheduled_at_source || 'Upcoming Date'}
                      </span>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-circle-question text-stone-400 text-[10px]"></i>
                      <strong>{test.source_question_count || test.questions_count}</strong> MCQs
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-clock text-stone-400 text-[10px]"></i>
                      {test.duration_minutes || 120} Minutes
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-award text-stone-400 text-[10px]"></i>
                      +{test.marks_per_correct} / -{test.marks_per_incorrect} Marks
                    </span>
                    {test.scheduled_at_source && (
                      <>
                        <span>•</span>
                        <span className="text-stone-400">
                          Date: {test.scheduled_at_source}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 sm:self-center">
                {isPlayable ? (
                  <Link
                    to={`/test-series/${series.local_series_id}/test/${test.local_test_id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A5344] text-white hover:bg-[#133F34] font-bold text-xs shadow-xs hover:shadow-md transition-all"
                  >
                    <i className="fa-solid fa-play text-[11px]"></i>
                    <span>Solve Test</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 text-stone-400 text-xs font-semibold cursor-not-allowed border border-stone-200"
                  >
                    <i className="fa-solid fa-lock text-[10px]"></i>
                    <span>Available on {test.scheduled_at_source || 'Schedule'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-12 text-center text-stone-500">
          <p className="font-semibold text-stone-700">No tests match your filter</p>
          <p className="text-xs text-stone-400 mt-1">Try selecting a different filter tab or clearing your search.</p>
        </div>
      )}
    </div>
  );
}

