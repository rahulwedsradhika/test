import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchTestSeriesSessions, fetchTestSeries } from '../api';
import { TestSeriesCard, TestSeriesSession } from '../types';

export default function TestSeriesHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSession = searchParams.get('session') || '2026-2027';

  const [sessions, setSessions] = useState<TestSeriesSession[]>([]);
  const [seriesList, setSeriesList] = useState<TestSeriesCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [examFilter, setExamFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [sessData, seriesData] = await Promise.all([
          fetchTestSeriesSessions(),
          fetchTestSeries(activeSession)
        ]);
        setSessions(sessData);
        setSeriesList(seriesData);
      } catch (err: any) {
        setError(err.message || 'Failed to load test series');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeSession]);

  const handleSessionChange = (sess: string) => {
    setSearchParams({ session: sess });
  };

  const filteredSeries = seriesList.filter(s => {
    const matchesSearch = s.title_source_exact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAccess = accessFilter === 'ALL' || s.access_badge_source === accessFilter;
    const matchesExam = examFilter === 'ALL' || s.exam_button_label_source.toUpperCase() === examFilter.toUpperCase();
    return matchesSearch && matchesAccess && matchesExam;
  });

  const totalExpectedTests = seriesList.reduce((acc, s) => acc + (s.expected_test_count || 0), 0);
  const totalVerifiedTests = seriesList.reduce((acc, s) => acc + (s.verified_test_count || 0), 0);
  const totalQuestions = seriesList.reduce((acc, s) => acc + (s.questions_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1A5344] via-[#236653] to-[#123B30] rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <i className="fa-solid fa-trophy"></i>
            Authentic National Exam Simulator
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-outfit font-extrabold tracking-tight leading-tight">
            Exam-Specific Test Series
          </h1>
          <p className="text-stone-200 font-sanskrit text-lg mt-2 font-medium">
            परीक्षा-विशिष्ट टेस्ट श्रृंखला • 7 National Series • 362 Tests
          </p>
          <p className="text-stone-300 text-sm mt-3 leading-relaxed">
            AIAPGET, UPSC Ayurvedic Medical Officer, UPPSC & HPSC complete authentic test series with timed simulated exams, bilingual question palettes, and verified classical citations.
          </p>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/10 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-white">7 Test Series</span>
            </div>
            <span>•</span>
            <div className="text-stone-200">
              <strong className="text-white">362</strong> Expected Tests
            </div>
            <span>•</span>
            <div className="text-stone-200">
              <strong className="text-emerald-300 font-bold">100%</strong> Verified Assignments
            </div>
            <span>•</span>
            <div className="text-stone-200">
              <strong className="text-white">36,902</strong> Authentic Questions
            </div>
          </div>
        </div>
      </div>

      {/* Session Chooser Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-[#E8E5DD] mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {sessions.map(s => {
            const isActive = s.session === activeSession;
            return (
              <button
                key={s.session}
                onClick={() => handleSessionChange(s.session)}
                className={`py-3.5 px-4 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-[#1A5344] text-white shadow-md'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  Academic Session
                </div>
                <div className="text-lg font-outfit font-extrabold mt-0.5">
                  Session {s.session}
                </div>
                <div className={`text-xs mt-1 ${isActive ? 'text-emerald-200' : 'text-stone-500'}`}>
                  {s.series_count} Series • {s.total_tests} Tests ({s.total_questions.toLocaleString()} Qs)
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search test series by title, syllabus..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E5DD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5344]/20 focus:border-[#1A5344] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Access Filter */}
          <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 text-xs font-semibold">
            {(['ALL', 'FREE', 'PAID'] as const).map(badge => (
              <button
                key={badge}
                onClick={() => setAccessFilter(badge)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  accessFilter === badge
                    ? 'bg-white text-[#1A5344] shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {badge === 'ALL' ? 'All Tiers' : badge}
              </button>
            ))}
          </div>

          {/* Exam Filter */}
          <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 text-xs font-semibold">
            {['ALL', 'AIAPGET', 'UPSC'].map(ex => (
              <button
                key={ex}
                onClick={() => setExamFilter(ex)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  examFilter === ex
                    ? 'bg-[#1A5344] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#1A5344] mb-3"></i>
          <p className="text-stone-600 text-sm font-medium">Loading session test series...</p>
        </div>
      )}

      {error && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          <div className="font-bold flex items-center gap-2 mb-1">
            <i className="fa-solid fa-triangle-exclamation"></i>
            Error loading series
          </div>
          {error}
        </div>
      )}

      {/* Series Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeries.map(s => {
            const isFree = s.access_badge_source === 'FREE';
            return (
              <div
                key={s.local_series_id}
                className="bg-white rounded-2xl border border-[#E8E5DD] hover:border-[#1A5344]/30 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Card Top Banner */}
                <div className={`p-4 text-center border-b ${
                  isFree ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700">
                      {s.session}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Exam Tag */}
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                        <i className="fa-solid fa-graduation-cap mr-1"></i>
                        {s.exam_button_label_source}
                      </span>
                      {/* Access Badge */}
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                        isFree
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-700 text-white'
                      }`}>
                        {s.access_badge_source}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-outfit font-extrabold text-lg text-stone-900 group-hover:text-[#1A5344] transition-colors line-clamp-2">
                    {s.title_source_exact}
                  </h3>
                </div>

                {/* Card Date Row */}
                <div className="grid grid-cols-2 divide-x divide-stone-100 border-b border-stone-100 py-3 px-4 text-center text-xs bg-white">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Starts From</span>
                    <strong className="text-stone-700 font-semibold">{s.start_date_iso}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">End On</span>
                    <strong className="text-stone-700 font-semibold">{s.end_date_iso}</strong>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 flex-1 text-xs text-stone-600 leading-relaxed">
                  <p className="line-clamp-3">
                    {s.description || 'Authentic multi-stage examination series curated for Ayurvedic entrance candidates.'}
                  </p>
                </div>

                {/* Test Counts & Enrollment Bar */}
                <div className="grid grid-cols-2 divide-x divide-stone-100 border-t border-b border-stone-100 py-3 px-4 text-center bg-stone-50/60 text-xs">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-bold block">Total Tests</span>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-base font-extrabold text-[#1A5344]">{s.verified_test_count}</span>
                      <span className="text-[10px] text-stone-400 font-medium">/ {s.expected_test_count} expected</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-bold block">Students Enrolled</span>
                    <span className="text-base font-extrabold text-stone-800 mt-0.5 block">
                      {s.students_enrolled_source?.toLocaleString() || '—'}
                    </span>
                  </div>
                </div>

                {/* Card Footer / Action Button */}
                <div className="p-4 bg-white flex items-center justify-between gap-3">
                  <div className="text-[11px] text-stone-500">
                    <span className="font-bold text-[#1A5344]">{s.available_test_count} Available</span>
                    {s.scheduled_test_count > 0 && (
                      <span className="text-amber-600 ml-1">({s.scheduled_test_count} Upcoming)</span>
                    )}
                  </div>
                  <Link
                    to={`/test-series/${s.local_series_id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isFree
                        ? 'bg-[#1A5344] text-white hover:bg-[#133F34]'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    <span>{s.action_button_label_source || 'Join Now'}</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredSeries.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-12 text-center text-stone-500">
          <i className="fa-solid fa-filter-circle-xmark text-4xl text-stone-300 mb-3"></i>
          <p className="font-semibold text-base text-stone-700">No test series match your criteria</p>
          <p className="text-xs text-stone-400 mt-1">Try clearing search filters or selecting another session year.</p>
        </div>
      )}
    </div>
  );
}

