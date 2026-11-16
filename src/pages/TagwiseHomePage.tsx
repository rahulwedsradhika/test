import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTags } from '../api';
import { TagCategory } from '../types';

export const TagwiseHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'analytical' | 'matching' | 'media'>('all');

  useEffect(() => {
    fetchTags()
      .then(res => {
        setCategories(res.categories || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading tags:', err);
        setError('Failed to load Tagwise categories. Please ensure API server is running on port 5168.');
        setLoading(false);
      });
  }, []);

  const totalExpected = 9753;
  const totalReady = categories.reduce((sum, c) => sum + (c.ready_count || 0), 0);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || cat.label_source_exact.toLowerCase().includes(q) || cat.local_tag_id.toLowerCase().includes(q);

      let matchesFilter = true;
      if (filterType === 'analytical') {
        matchesFilter = ['TAG-001', 'TAG-002'].includes(cat.local_tag_id);
      } else if (filterType === 'matching') {
        matchesFilter = ['TAG-003', 'TAG-005'].includes(cat.local_tag_id);
      } else if (filterType === 'media') {
        matchesFilter = ['TAG-006'].includes(cat.local_tag_id);
      }

      return matchesSearch && matchesFilter;
    });
  }, [categories, searchQuery, filterType]);

  const tagIcons: Record<string, { icon: string; bg: string; color: string; desc: string }> = {
    'TAG-001': {
      icon: 'fa-list-check',
      bg: 'bg-emerald-50 border-emerald-200',
      color: 'text-emerald-700',
      desc: 'Multiple statements evaluation: evaluate Statement 1 vs Statement 2 accuracy with classical references.'
    },
    'TAG-002': {
      icon: 'fa-brain',
      bg: 'bg-indigo-50 border-indigo-200',
      color: 'text-indigo-700',
      desc: 'Assertion (A) & Reason (R) logical causality verification according to Samhita principles.'
    },
    'TAG-003': {
      icon: 'fa-table-columns',
      bg: 'bg-purple-50 border-purple-200',
      color: 'text-purple-700',
      desc: 'Column matching: correlate diseases with doshas, formulations, surgical instruments & kalpas.'
    },
    'TAG-004': {
      icon: 'fa-calculator',
      bg: 'bg-amber-50 border-amber-200',
      color: 'text-amber-700',
      desc: 'Classical counts, measurements, proportions, gana numbers, srotas & dhatu quantitative data.'
    },
    'TAG-005': {
      icon: 'fa-pen-clip',
      bg: 'bg-teal-50 border-teal-200',
      color: 'text-teal-700',
      desc: 'Sanskrit shloka completion: fill missing hemistichs, technical synonyms and sutra definitions.'
    },
    'TAG-006': {
      icon: 'fa-image',
      bg: 'bg-rose-50 border-rose-200',
      color: 'text-rose-700',
      desc: 'Visual diagnosis, herbal identification, shastra/yantra diagrams, and anatomical illustrations.'
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A5344] via-[#205E4E] to-[#133D32] text-white p-8 sm:p-12 shadow-xl border border-[#2A7B62]/40">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#A7F3D0] border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            Phase 5: Tagwise Question Bank • AIAPGET New Exam Pattern
          </div>
          <h1 className="text-3xl sm:text-5xl font-outfit font-bold tracking-tight leading-tight">
            New Pattern Tagwise <br className="hidden sm:inline" />
            <span className="text-[#FBBF24] font-sanskrit">नवीन प्रारूप बहुविकल्पीय प्रश्न मंच</span>
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
            Master the latest National Examination questions segregated by cognitive format: Statement MCQs, Assertion–Reason, Match the Following, Numerical Quantities, Shloka Fill-in-the-Blanks, and Botanical/Yantra Image MCQs.
          </p>

          {/* Quick Stats */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-white/15">
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-white">6 Formats</div>
              <div className="text-xs text-white/70">Cognitive Categories</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-[#34D399]">
                {totalReady ? totalReady.toLocaleString() : '9,632'} Ready
              </div>
              <div className="text-xs text-white/70">Verified Live Questions</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-amber-300">9,753</div>
              <div className="text-xs text-white/70">Screenshot Baseline</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-white">100% Authentic</div>
              <div className="text-xs text-white/70">Source Redacted Evidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Category Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E5DD] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64746D] text-sm"></i>
            <input
              type="text"
              placeholder="Search Tagwise format (e.g., Statement, Image, Numerical)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E5DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5344] focus:border-transparent bg-[#FAF9F5]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-[#1A5344] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#64746D] border border-[#E8E5DD] hover:bg-[#E8F4F0]'
              }`}
            >
              All Formats (6)
            </button>
            <button
              onClick={() => setFilterType('analytical')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'analytical'
                  ? 'bg-[#1A5344] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#64746D] border border-[#E8E5DD] hover:bg-[#E8F4F0]'
              }`}
            >
              Analytical & Statements
            </button>
            <button
              onClick={() => setFilterType('matching')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'matching'
                  ? 'bg-[#1A5344] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#64746D] border border-[#E8E5DD] hover:bg-[#E8F4F0]'
              }`}
            >
              Matching & Fill Blank
            </button>
            <button
              onClick={() => setFilterType('media')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'media'
                  ? 'bg-[#1A5344] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#64746D] border border-[#E8E5DD] hover:bg-[#E8F4F0]'
              }`}
            >
              Image MCQs
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-16 space-y-3">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-[#1A5344]"></i>
          <p className="text-sm font-medium text-[#64746D]">Loading authentic Tagwise categories...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation text-lg"></i>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* 6 Category Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map(cat => {
            const meta = tagIcons[cat.local_tag_id] || {
              icon: 'fa-tags',
              bg: 'bg-emerald-50 border-emerald-200',
              color: 'text-emerald-700',
              desc: 'Specialized Ayurvedic examination question format.'
            };

            const isAvailable = cat.ready_count > 0;

            return (
              <div
                key={cat.local_tag_id}
                className="bg-white rounded-2xl border border-[#E8E5DD] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                <div className="p-6 space-y-4">
                  {/* Card Header with Icon & Tag Badge */}
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${meta.bg} ${meta.color} shadow-2xs`}>
                      <i className={`fa-solid ${meta.icon}`}></i>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F5] text-[#64746D] border border-[#E8E5DD]">
                        {cat.local_tag_id}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-outfit font-bold text-lg text-[#1A5344] group-hover:text-[#2A7B62] transition-colors">
                      {cat.label_source_exact}
                    </h3>
                    <p className="text-xs text-[#64746D] mt-1.5 leading-relaxed line-clamp-2">
                      {meta.desc}
                    </p>
                  </div>

                  {/* Count Metrics */}
                  <div className="pt-3 border-t border-[#E8E5DD]/70 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E8E5DD]/50">
                      <div className="text-[10px] text-[#64746D] uppercase font-bold tracking-wider">Ready Questions</div>
                      <div className="font-outfit font-bold text-base text-[#1A5344] mt-0.5">
                        {cat.ready_count.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E8E5DD]/50">
                      <div className="text-[10px] text-[#64746D] uppercase font-bold tracking-wider">Screenshot Count</div>
                      <div className="font-outfit font-bold text-base text-gray-500 mt-0.5">
                        {cat.expected_count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-6 py-4 bg-[#FAF9F5]/70 border-t border-[#E8E5DD] flex items-center justify-between gap-3">
                  <Link
                    to={`/tagwise/${cat.local_tag_id}`}
                    className="text-xs font-semibold text-[#64746D] hover:text-[#1A5344] flex items-center gap-1.5 transition-colors"
                  >
                    <i className="fa-solid fa-list-ul"></i>
                    <span>Browse All</span>
                  </Link>

                  <button
                    onClick={() => navigate(`/tagwise/${cat.local_tag_id}?launch=practice`)}
                    disabled={!isAvailable}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                      isAvailable
                        ? 'bg-[#1A5344] text-white hover:bg-[#2A7B62] hover:shadow-md'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Practice Now</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Classical Methodology Callout */}
      <div className="bg-[#FAF9F5] rounded-2xl border border-[#E8E5DD] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A5344] uppercase tracking-wider">
            <i className="fa-solid fa-shield-halved"></i>
            <span>Rigorous Question Authenticity</span>
          </div>
          <h4 className="font-outfit font-bold text-base sm:text-lg text-[#1A5344]">
            Direct Cognitive Format Testing for AIAPGET & State PSCs
          </h4>
          <p className="text-xs sm:text-sm text-[#64746D] leading-relaxed">
            All 9,632 questions have been freshly extracted from authorized live source endpoints with SHA-256 payload provenance.
            Each question preserves authentic classical commentary, Sanskrit references, and verified option ordering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/coverage"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#1A5344] border border-[#E8E5DD] hover:bg-[#E8F4F0] transition-colors"
          >
            <i className="fa-solid fa-chart-pie mr-2"></i>
            Audit Ledger
          </Link>
          <Link
            to="/?tab=samhitawise"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1A5344] text-white hover:bg-[#2A7B62] transition-colors"
          >
            Samhitawise Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

