import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPreviousYearGroups } from '../api';
import { PreviousYearGroup } from '../types';

export const PreviousYearsHomePage: React.FC = () => {
  const [groups, setGroups] = useState<PreviousYearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pg' | 'upsc'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPreviousYearGroups()
      .then(res => {
        if (res.success && res.groups) {
          setGroups(res.groups);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching PYP groups:', err);
        setError('Failed to load Previous Year Papers categories.');
        setLoading(false);
      });
  }, []);

  const getCategoryTheme = (groupId: string) => {
    switch (groupId) {
      case 'PYP-ALL':
        return {
          icon: 'fa-layer-group',
          accent: 'from-emerald-700 via-teal-800 to-emerald-950',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          hoverBorder: 'hover:border-emerald-500',
          iconBg: 'bg-emerald-100 text-emerald-800',
          tag: 'Comprehensive Aggregate'
        };
      case 'PYP-PG':
        return {
          icon: 'fa-user-graduate',
          accent: 'from-teal-700 via-cyan-800 to-teal-950',
          badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
          hoverBorder: 'hover:border-teal-500',
          iconBg: 'bg-teal-100 text-teal-800',
          tag: 'AIAPGET & State Colleges'
        };
      case 'PYP-UPSC':
        return {
          icon: 'fa-landmark',
          accent: 'from-sky-700 via-blue-800 to-slate-900',
          badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
          hoverBorder: 'hover:border-sky-500',
          iconBg: 'bg-sky-100 text-sky-800',
          tag: 'Central & State PSC'
        };
      default:
        return {
          icon: 'fa-file-lines',
          accent: 'from-stone-700 to-stone-900',
          badgeBg: 'bg-stone-50 text-stone-800 border-stone-200',
          hoverBorder: 'hover:border-stone-500',
          iconBg: 'bg-stone-100 text-stone-800',
          tag: 'Exam Paper'
        };
    }
  };

  const filteredGroups = groups.filter(g => {
    if (selectedFilter === 'pg' && g.local_group_id !== 'PYP-PG') return false;
    if (selectedFilter === 'upsc' && g.local_group_id !== 'PYP-UPSC') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.screenshot_label_exact.toLowerCase().includes(q) ||
        g.screenshot_description_exact.toLowerCase().includes(q) ||
        (g.user_description_alias && g.user_description_alias.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 font-medium">
          <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
          <i className="fa-solid fa-chevron-right text-[10px] text-stone-400"></i>
          <span className="text-stone-800 font-semibold">Previous Year Papers</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>127 Unique Canonical Tests • 14,080 Exam Questions</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#133D32] via-[#1A5344] to-[#0D2922] text-white p-8 sm:p-12 shadow-xl border border-emerald-700/40">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-200 border border-white/15">
            <i className="fa-solid fa-calendar-days text-amber-300"></i>
            Original National & State Papers • Phase 6 Authenticated
          </div>
          <h1 className="text-3xl sm:text-5xl font-outfit font-bold tracking-tight leading-tight">
            Ayurveda Previous Year Papers <br className="hidden sm:inline" />
            <span className="text-amber-300 font-sanskrit">पूर्व वर्ष परीक्षा प्रश्न-पत्र</span>
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
            Practice actual past question papers from AIAPGET, UPSC, State Public Service Commissions (UPPSC, HPPSC, Kerala PSC), and premier institutions (BHU, NIA, IPGT&RA). All 127 papers feature authentic bilingual Sanskrit/Hindi stems, source answer keys, and classical Samhita commentary.
          </p>

          {/* Quick Metrics */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/15">
            <div>
              <div className="text-2xl font-bold font-outfit text-white">3 Categories</div>
              <div className="text-xs text-white/70">Source Group Hierarchy</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-outfit text-emerald-300">250 Memberships</div>
              <div className="text-xs text-white/70">127 All • 67 PG • 56 UPSC</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-outfit text-amber-300">127 Tests</div>
              <div className="text-xs text-white/70">Unique Exam Papers</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-outfit text-teal-200">14,080 Qs</div>
              <div className="text-xs text-white/70">100% Sourced & Solved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedFilter === 'all'
                ? 'bg-[#1A5344] text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Categories (3)
          </button>
          <button
            onClick={() => setSelectedFilter('pg')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedFilter === 'pg'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            PG Entrance (67)
          </button>
          <button
            onClick={() => setSelectedFilter('upsc')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedFilter === 'upsc'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            UPSC & PSC (56)
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search paper categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-stone-50 border border-stone-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-stone-800"
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-stone-200">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-emerald-600"></i>
          <p className="text-stone-600 font-medium">Loading Previous Year Paper categories...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
          <i className="fa-solid fa-circle-exclamation text-lg"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Category Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredGroups.map(group => {
            const theme = getCategoryTheme(group.local_group_id);
            return (
              <div
                key={group.local_group_id}
                className={`bg-white rounded-2xl border border-stone-200/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group ${theme.hoverBorder}`}
              >
                {/* Header Band */}
                <div className={`p-6 bg-gradient-to-r ${theme.accent} text-white relative`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl text-white shadow-inner">
                      <i className={`fa-solid ${theme.icon}`}></i>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                      {theme.tag}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-bold font-outfit text-white tracking-tight leading-snug">
                      {group.screenshot_label_exact}
                    </h3>
                    <p className="text-xs text-white/80 mt-1 line-clamp-2">
                      {group.screenshot_description_exact}
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 pb-3 border-b border-stone-100">
                      <span>Source Native Endpoint:</span>
                      <span className="font-mono text-[11px] text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                        cat={group.native_group_id || 'all'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-1">
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <div className="text-[11px] font-semibold text-stone-500">Expected (Claimed)</div>
                        <div className="text-xl font-bold font-outfit text-stone-800">
                          {group.expected_test_count} <span className="text-xs font-normal text-stone-400">Papers</span>
                        </div>
                      </div>
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                        <div className="text-[11px] font-semibold text-emerald-700">Verified & Ready</div>
                        <div className="text-xl font-bold font-outfit text-emerald-800">
                          {group.ready_test_memberships} <span className="text-xs font-semibold text-emerald-600">Live</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-100/80 flex items-center gap-2">
                      <i className="fa-solid fa-circle-check text-emerald-600"></i>
                      <span>
                        {group.local_group_id === 'PYP-ALL'
                          ? '127 Canonical papers across 2005–2025'
                          : group.local_group_id === 'PYP-PG'
                          ? 'All-India AIAPGET, BHU, NIA, State PGs'
                          : 'Central UPSC Medical Officer & State PSCs'}
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2">
                    <Link
                      to={`/previous-years/${group.local_group_id}`}
                      className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#1A5344] hover:bg-[#133D32] text-white flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-md"
                    >
                      <span>Explore {group.ready_test_memberships} Test Papers</span>
                      <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreviousYearsHomePage;

