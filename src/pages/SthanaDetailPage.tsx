import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchNode } from '../api';
import { NodeDetail, LeafNode } from '../types';
import Breadcrumbs from '../components/Breadcrumbs';
import PracticeConfigModal from '../components/PracticeConfigModal';

export default function SthanaDetailPage() {
  const { divisionId } = useParams<{ divisionId: string }>();
  const navigate = useNavigate();
  const [division, setDivision] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'pending'>('all');
  
  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    open: boolean;
    title: string;
    nodeId: string;
    maxQuestions: number;
    mode: 'chapter' | 'division';
  }>({
    open: false,
    title: '',
    nodeId: '',
    maxQuestions: 50,
    mode: 'division'
  });

  useEffect(() => {
    if (!divisionId) return;
    setLoading(true);
    fetchNode(divisionId)
      .then(data => {
        setDivision(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [divisionId]);

  const filteredChapters = useMemo(() => {
    if (!division) return [];
    return division.children.filter(ch => {
      const matchesSearch =
        ch.name_en.toLowerCase().includes(search.toLowerCase()) ||
        (ch.name_hi && ch.name_hi.includes(search)) ||
        (ch.chapter_number !== null && ch.chapter_number.toString() === search.trim());
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'ready' && ch.is_ready) ||
        (statusFilter === 'pending' && !ch.is_ready);

      return matchesSearch && matchesStatus;
    });
  }, [division, search, statusFilter]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-500 text-sm">Loading Sthana adhyayas...</p>
      </div>
    );
  }

  if (error || !division) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl max-w-lg mx-auto">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-3xl mb-3"></i>
          <h2 className="text-xl font-bold text-red-900 mb-2">Division Not Found</h2>
          <p className="text-sm text-red-700 mb-6">{error || 'Unable to retrieve this division.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Breadcrumbs items={division.breadcrumbs} />

      {/* Sthana Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 border border-amber-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-layer-group"></i>
              {division.type === 'division' ? 'Samhita Sthana' : 'Section'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight mb-2">
              {division.name_en}
            </h1>
            {division.name_hi && (
              <p className="text-amber-200/90 font-devanagari text-lg sm:text-xl font-medium mb-3">
                {division.name_hi}
              </p>
            )}
            <p className="text-stone-300 text-sm max-w-2xl leading-relaxed">
              Explore and practice individual adhyayas from this classical division. All questions are strictly mapped to their authentic classical sections without cross-chapter leakage.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between sm:justify-start gap-6">
              <div>
                <div className="text-xs text-stone-300 font-medium">Verified Questions</div>
                <div className="text-2xl font-bold font-serif text-amber-300">
                  {division.validated_count.toLocaleString()}
                  <span className="text-xs font-normal text-stone-300 ml-1">
                    / {division.expected_count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-white/20"></div>
              <div>
                <div className="text-xs text-stone-300 font-medium">Chapters</div>
                <div className="text-2xl font-bold font-serif text-white">
                  {division.children.length}
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setModalConfig({
                  open: true,
                  title: `${division.name_en} Practice`,
                  nodeId: division.id,
                  maxQuestions: division.validated_count,
                  mode: 'division'
                })
              }
              disabled={division.validated_count === 0}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm shadow-lg transition ${
                division.validated_count > 0
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer'
                  : 'bg-stone-700 text-stone-400 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-bolt text-stone-900"></i>
              Practice Full Sthana
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4 text-xs text-stone-300">
          <div className="w-full bg-stone-700/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${division.coverage_percent}%` }}
            ></div>
          </div>
          <div className="shrink-0 font-medium text-amber-300">
            {division.coverage_percent}% Ingested & Verified
          </div>
        </div>
      </div>

      {/* Chapters Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chapters by English title, Devanagari, or chapter number..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({division.children.length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ready' ? 'bg-white text-emerald-800 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ready ({division.children.filter(c => c.is_ready).length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'pending' ? 'bg-white text-amber-800 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pending ({division.children.filter(c => !c.is_ready).length})
            </button>
          </div>
        </div>
      </div>

      {/* Chapters Grid or Direct Leaf Section */}
      {division.children.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#E8F4F0] text-[#1A5344] rounded-full flex items-center justify-center mx-auto text-2xl">
            <i className="fa-solid fa-scroll"></i>
          </div>
          <h3 className="text-xl font-bold font-serif text-stone-900">Direct Question Practice Section</h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            This section contains <strong>{division.validated_count.toLocaleString()}</strong> verified classical questions configured for direct student practice without sub-chapter divisions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
            <button
              onClick={() =>
                setModalConfig({
                  open: true,
                  title: `${division.name_en} Practice`,
                  nodeId: division.id,
                  maxQuestions: division.validated_count,
                  mode: 'division'
                })
              }
              className="px-6 py-3 rounded-2xl bg-[#1A5344] hover:bg-[#133D32] text-white text-sm font-bold shadow-xs flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-play"></i>
              <span>Launch Practice Test</span>
            </button>
            <Link
              to={`/chapter/${division.id}`}
              className="px-6 py-3 rounded-2xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-list-ul"></i>
              <span>Browse Questions List</span>
            </Link>
          </div>
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
            <i className="fa-solid fa-folder-open text-xl"></i>
          </div>
          <h3 className="text-base font-semibold text-stone-800 mb-1">No Chapters Found</h3>
          <p className="text-xs text-stone-500 mb-4">No adhyayas matched your search query.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredChapters.map(chapter => (
            <div
              key={chapter.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
                    {chapter.chapter_number !== null ? `Adhyaya ${chapter.chapter_number}` : 'Section'}
                  </span>
                  
                  {chapter.is_ready ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <i className="fa-solid fa-circle-check text-[10px]"></i>
                      {chapter.validated_count} Qs Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <i className="fa-solid fa-clock text-[10px]"></i>
                      {chapter.expected_count} Qs Ingesting
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition mb-1 leading-snug">
                  {chapter.name_en}
                </h3>
                {chapter.name_hi && (
                  <p className="text-sm font-devanagari text-stone-600 mb-3 font-medium">
                    {chapter.name_hi}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100 mt-2">
                <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
                  <span>Questions Ingested</span>
                  <span className="font-semibold text-stone-800">
                    {chapter.validated_count} / {chapter.expected_count}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/chapter/${chapter.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition"
                  >
                    <i className="fa-solid fa-list-check text-stone-500"></i>
                    Inspect Qs
                  </Link>

                  <button
                    onClick={() =>
                      setModalConfig({
                        open: true,
                        title: chapter.name_en,
                        nodeId: chapter.id,
                        maxQuestions: chapter.validated_count,
                        mode: 'chapter'
                      })
                    }
                    disabled={!chapter.is_ready}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
                      chapter.is_ready
                        ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-xs cursor-pointer'
                        : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <i className="fa-solid fa-play text-[10px]"></i>
                    Practice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Practice Configuration Modal */}
      <PracticeConfigModal
        isOpen={modalConfig.open}
        onClose={() => setModalConfig(prev => ({ ...prev, open: false }))}
        nodeId={modalConfig.nodeId}
        nodeTitle={modalConfig.title}
        maxAvailable={modalConfig.maxQuestions}
        mode={modalConfig.mode}
      />
    </div>
  );
}
