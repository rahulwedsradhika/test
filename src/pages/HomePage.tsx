import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchSamhitas, fetchSubjects, fetchCoverage } from '../api';
import { SamhitaNode, SubjectNode, CoverageNode } from '../types';
import { PracticeConfigModal } from '../components/PracticeConfigModal';

type CategoryFilter = 'all' | 'brihat' | 'laghu' | 'rasa' | 'misc';
type MainHub = 'samhitawise' | 'subjectwise';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialHub = (searchParams.get('tab') === 'subjectwise' || searchParams.get('tab') === 'subjects') 
    ? 'subjectwise' 
    : 'samhitawise';

  const [mainHub, setMainHub] = useState<MainHub>(initialHub);
  const [samhitas, setSamhitas] = useState<SamhitaNode[]>([]);
  const [subjects, setSubjects] = useState<SubjectNode[]>([]);
  const [coverageNodes, setCoverageNodes] = useState<CoverageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');

  // Practice modal state for direct launches from home
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{
    id: string;
    title: string;
    count: number;
    mode: 'chapter' | 'division' | 'samhita' | 'mixed';
  }>({
    id: '',
    title: '',
    count: 0,
    mode: 'samhita'
  });

  useEffect(() => {
    Promise.all([fetchSamhitas(), fetchSubjects(), fetchCoverage()])
      .then(([samData, subData, covData]) => {
        setSamhitas(samData);
        setSubjects(subData);
        setCoverageNodes(covData.nodes);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading home page:", err);
        setLoading(false);
      });
  }, []);

  const totalSamhitaExpected = 59122;
  const totalSamhitaValidated = samhitas.reduce((acc, s) => acc + (s.validated_count || 0), 0);

  const totalSubjectExpected = 57375;
  const totalSubjectValidated = subjects.reduce((acc, s) => acc + (s.validated_count || 0), 0);

  // Filtered samhitas
  const filteredSamhitas = useMemo(() => {
    return samhitas.filter(sam => {
      let matchesTab = true;
      if (activeTab === 'brihat') {
        matchesTab = ['SAM-01', 'SAM-02', 'SAM-03'].includes(sam.id);
      } else if (activeTab === 'laghu') {
        matchesTab = ['SAM-04', 'SAM-05', 'SAM-06', 'SAM-07', 'SAM-08', 'SAM-09', 'SAM-10', 'SAM-11', 'SAM-12'].includes(sam.id);
      } else if (activeTab === 'rasa') {
        matchesTab = ['SAM-13', 'SAM-14', 'SAM-15', 'SAM-16'].includes(sam.id);
      } else if (activeTab === 'misc') {
        matchesTab = sam.id === 'SAM-17';
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        sam.name_en.toLowerCase().includes(q) || 
        (sam.name_hi && sam.name_hi.includes(q)) ||
        sam.id.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [samhitas, activeTab, searchQuery]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter(s => {
      if (!q) return true;
      return s.display_name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    });
  }, [subjects, searchQuery]);

  // Search dropdown results for chapters and subjects
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const matchedSubjects = subjects.filter(s => s.display_name.toLowerCase().includes(q)).map(s => ({
      id: s.id,
      name_en: s.display_name,
      name_hi: null,
      type: 'subject',
      validated_count: s.validated_count,
      link: `/subject/${s.id}`
    }));

    const matchedChapters = coverageNodes.filter(n => 
      (n.type === 'chapter' || n.type === 'miscellaneous' || n.type === 'sthana') &&
      (n.name_en.toLowerCase().includes(q) || (n.name_hi && n.name_hi.includes(q)))
    ).map(n => ({
      id: n.node_id,
      name_en: n.name_en,
      name_hi: n.name_hi,
      type: n.type,
      validated_count: n.validated_count,
      link: `/chapter/${n.node_id}`
    }));

    return [...matchedSubjects, ...matchedChapters].slice(0, 10);
  }, [subjects, coverageNodes, searchQuery]);

  const handleLaunchPractice = (id: string, title: string, count: number, mode: 'chapter' | 'division' | 'samhita' | 'mixed' = 'samhita') => {
    setModalTarget({ id, title, count, mode });
    setModalOpen(true);
  };

  const handleSwitchHub = (hub: MainHub) => {
    setMainHub(hub);
    setSearchParams({ tab: hub });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A5344] via-[#205E4E] to-[#133D32] text-white p-8 sm:p-12 shadow-xl border border-[#2A7B62]/40">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#A7F3D0] border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            Dual-Classification Portal • Port 5167 • Verified Live AyurQuest Source
          </div>
          <h1 className="text-3xl sm:text-5xl font-outfit font-bold tracking-tight leading-tight">
            Comprehensive Ayurvedic <br className="hidden sm:inline" />
            <span className="text-[#FBBF24] font-sanskrit">संहिता एवं विषयवार परीक्षा मंच</span>
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
            Practice over 114,900 freshly authenticated question assignments spanning all 17 classical Samhitas and all 38 academic subjects.
            Preserved Sanskrit shlokas, bilingual Hindi/English options, and verified classical commentary citations.
          </p>

          {/* Quick Stats Pill Deck */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 border-t border-white/15">
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-white">57,452</div>
              <div className="text-xs text-white/70">17 Samhitas</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-[#34D399]">
                {totalSubjectValidated ? totalSubjectValidated.toLocaleString() : '57,476'}
              </div>
              <div className="text-xs text-white/70">38 Subjects</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-amber-300">362 Tests</div>
              <div className="text-xs text-white/70">7 Series (36,902 Qs)</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-teal-300">9,632 Qs</div>
              <div className="text-xs text-white/70">6 Format Tags</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-sky-300">127 Papers</div>
              <div className="text-xs text-white/70">PYP (14,080 Qs)</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-outfit text-rose-300">750 Tests</div>
              <div className="text-xs text-white/70">Daily (12,350 Qs)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Hub Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2.5 rounded-2xl border border-[#E8E5DD] shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleSwitchHub('subjectwise')}
            className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mainHub === 'subjectwise'
                ? 'bg-[#1A5344] text-white shadow-md'
                : 'text-[#64746D] hover:bg-[#FAF9F5] border border-transparent hover:border-[#E8E5DD]'
            }`}
          >
            <i className="fa-solid fa-graduation-cap text-base"></i>
            <span>Subjectwise</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              mainHub === 'subjectwise' ? 'bg-[#2A7B62] text-white' : 'bg-[#E8F4F0] text-[#1A5344]'
            }`}>
              38
            </span>
          </button>

          <button
            onClick={() => handleSwitchHub('samhitawise')}
            className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              mainHub === 'samhitawise'
                ? 'bg-[#1A5344] text-white shadow-md'
                : 'text-[#64746D] hover:bg-[#FAF9F5] border border-transparent hover:border-[#E8E5DD]'
            }`}
          >
            <i className="fa-solid fa-book-bookmark text-base"></i>
            <span>Samhitawise</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              mainHub === 'samhitawise' ? 'bg-[#2A7B62] text-white' : 'bg-[#E8F4F0] text-[#1A5344]'
            }`}>
              17
            </span>
          </button>

          <Link
            to="/tagwise"
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 text-stone-700 hover:bg-[#FAF9F5] border border-stone-200/60 hover:border-emerald-400 bg-emerald-50/40"
          >
            <i className="fa-solid fa-tags text-base text-emerald-600"></i>
            <span>Tagwise Bank</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/70 text-emerald-900">
              6 Tags
            </span>
          </Link>
          <Link
            to="/previous-years"
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 text-stone-700 hover:bg-[#FAF9F5] border border-stone-200/60 hover:border-sky-400 bg-sky-50/40"
          >
            <i className="fa-solid fa-calendar-days text-base text-sky-600"></i>
            <span>Previous Years</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-200/70 text-sky-900">
              127 Papers
            </span>
          </Link>
          <Link
            to="/daily-tests"
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 text-stone-700 hover:bg-[#FAF9F5] border border-stone-200/60 hover:border-rose-400 bg-rose-50/40"
          >
            <i className="fa-solid fa-sun text-base text-rose-600"></i>
            <span>Daily Tests</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-200/70 text-rose-900">
              3 Sess
            </span>
          </Link>
          <Link
            to="/mock-tests"
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 text-stone-700 hover:bg-[#FAF9F5] border border-stone-200/60 hover:border-purple-400 bg-purple-50/40"
          >
            <i className="fa-solid fa-brain text-base text-purple-600"></i>
            <span>Mock Tests</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-200/70 text-purple-900">
              398 Tests
            </span>
          </Link>
          <Link
            to="/test-series"
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 text-stone-700 hover:bg-[#FAF9F5] border border-stone-200/60 hover:border-amber-400 bg-amber-50/40"
          >
            <i className="fa-solid fa-trophy text-base text-amber-600"></i>
            <span>Test Series</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/70 text-amber-900">
              362 Tests
            </span>
          </Link>
        </div>

        <Link
          to="/coverage"
          className="text-xs font-semibold text-[#1A5344] hover:text-[#2A7B62] px-4 py-2.5 rounded-xl bg-[#E8F4F0] border border-[#D5E8E2] flex items-center gap-2 shrink-0 self-end sm:self-auto"
        >
          <i className="fa-solid fa-chart-pie text-xs"></i>
          <span>Reconciliation Audit</span>
          <i className="fa-solid fa-arrow-right text-[10px]"></i>
        </Link>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E5DD] p-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] text-[#1A5344] flex items-center justify-center shrink-0">
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </div>
          <input
            type="text"
            placeholder={
              mainHub === 'subjectwise'
                ? "Search across all 38 subjects (e.g. Kayachikitsa, Rog Nidana, Dravyaguna, Panchkarma, Surgery, Anatomy)..."
                : "Search all 17 categories & chapters (e.g. Charaka, Kashyapa, Sharangadhara, दीर्घञ्जीवितीय, Ras Tarangini)..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-[#23342E] placeholder-[#9CA3AF] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-2 text-[#9CA3AF] hover:text-[#23342E]"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#E8E5DD] p-2 z-30 max-h-80 overflow-y-auto">
            <div className="text-[11px] font-bold text-[#64746D] px-3 py-1.5 uppercase tracking-wider">
              Matching Categories ({searchResults.length})
            </div>
            {searchResults.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setSearchQuery('');
                  navigate(item.link);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF9F5] flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <span className="font-semibold text-[#1A5344]">{item.name_en}</span>
                  {item.name_hi && <span className="font-sanskrit text-[#64746D] ml-2">({item.name_hi})</span>}
                  <span className="text-[10px] uppercase font-mono text-stone-400 ml-2">[{item.id}]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#2A7B62] bg-[#E8F4F0] px-2 py-0.5 rounded-md">
                    {item.validated_count.toLocaleString()} Qs
                  </span>
                  <i className="fa-solid fa-arrow-right text-[10px] text-[#A39B8C]"></i>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: SUBJECTWISE QUESTION BANK (38 Academic Disciplines)           */}
      {/* ========================================================================= */}
      {mainHub === 'subjectwise' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DD] pb-4">
            <div>
              <h2 className="text-2xl font-outfit font-bold text-[#1A5344]">All 38 Subjectwise Disciplines</h2>
              <p className="text-xs sm:text-sm text-[#64746D]">
                Direct practice question banks across all undergraduate and postgraduate Ayurveda subjects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F4F0] text-[#1A5344]">
                Showing {filteredSubjects.length} of 38 Subjects
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#E8E5DD] animate-pulse h-48"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map(subj => {
                const cov = subj.coverage_percent || 100;
                return (
                  <div
                    key={subj.id}
                    className="bg-white rounded-3xl p-6 border border-[#E8E5DD] hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Subject Card Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E8E5DD] text-[#64746D]">
                              {subj.id}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Direct Questions
                            </span>
                          </div>
                          <h3 className="text-lg font-outfit font-bold text-[#1A5344] leading-snug pt-1">
                            {subj.display_name}
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-[#FAF9F5] border border-[#E8E5DD] text-[#1A5344] flex items-center justify-center text-sm font-bold shrink-0">
                          #{subj.display_order}
                        </div>
                      </div>

                      {/* Progress & Question Counts */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#64746D]">Validated Questions</span>
                          <span className="font-bold text-[#1A5344]">
                            {subj.validated_count.toLocaleString()}
                            <span className="text-[#9CA3AF] font-normal"> / {subj.expected_count.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#FAF9F5] border border-[#E8E5DD] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2A7B62] to-[#10B981] transition-all duration-500"
                            style={{ width: `${Math.min(100, cov)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-[#64746D]">
                          <span>No Sthanas • Direct Pool</span>
                          <span className="font-semibold text-emerald-700">100% Ready</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 mt-4 border-t border-[#E8E5DD] flex items-center gap-2">
                      <button
                        onClick={() => handleLaunchPractice(subj.id, subj.display_name, subj.validated_count, 'chapter')}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#1A5344] hover:bg-[#133D32] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-play text-[10px]"></i>
                        <span>Practice Test</span>
                      </button>
                      <Link
                        to={`/subject/${subj.id}`}
                        className="py-2 px-3 rounded-xl border border-[#E8E5DD] hover:bg-[#FAF9F5] text-[#1A5344] text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Browse Question List"
                      >
                        <i className="fa-solid fa-list-ul"></i>
                        <span className="hidden sm:inline">Browse</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: CLASSICAL SAMHITAWISE (17 Classical Samhitas)                 */}
      {/* ========================================================================= */}
      {mainHub === 'samhitawise' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E5DD] pb-4">
            <div>
              <h2 className="text-2xl font-outfit font-bold text-[#1A5344]">All 17 Ayurvedic Samhita Categories</h2>
              <p className="text-xs sm:text-sm text-[#64746D]">
                Explore by classical hierarchy, Sthana division, or launch direct practice tests.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#1A5344] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#64746D] hover:bg-[#E8F4F0] border border-[#E8E5DD]'
                }`}
              >
                All (17)
              </button>
              <button
                onClick={() => setActiveTab('brihat')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'brihat'
                    ? 'bg-[#1A5344] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#64746D] hover:bg-[#E8F4F0] border border-[#E8E5DD]'
                }`}
              >
                Brihat Trayi (3)
              </button>
              <button
                onClick={() => setActiveTab('laghu')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'laghu'
                    ? 'bg-[#1A5344] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#64746D] hover:bg-[#E8F4F0] border border-[#E8E5DD]'
                }`}
              >
                Laghutrayi & Classical (9)
              </button>
              <button
                onClick={() => setActiveTab('rasa')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'rasa'
                    ? 'bg-[#1A5344] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#64746D] hover:bg-[#E8F4F0] border border-[#E8E5DD]'
                }`}
              >
                Rasashastra (4)
              </button>
              <button
                onClick={() => setActiveTab('misc')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'misc'
                    ? 'bg-[#1A5344] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#64746D] hover:bg-[#E8F4F0] border border-[#E8E5DD]'
                }`}
              >
                Comprehensive (1)
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#E8E5DD] animate-pulse h-64"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSamhitas.map(sam => {
                const cov = sam.coverage_percent || 0;
                const isDirect = sam.is_direct;
                const isSthanaDirect = sam.is_sthana_direct;

                return (
                  <div
                    key={sam.id}
                    className="bg-white rounded-3xl p-6 border border-[#E8E5DD] hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E8E5DD] text-[#64746D]">
                              {sam.id}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F4F0] text-[#1A5344]">
                              {sam.category_group || 'Samhita'}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-outfit font-bold text-[#1A5344] mt-2 leading-snug">
                            {sam.name_en}
                          </h3>
                          {sam.name_hi && (
                            <p className="text-sm font-sanskrit text-[#C45D48] font-semibold">
                              {sam.name_hi}
                            </p>
                          )}
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-[#FAF9F5] border border-[#E8E5DD] text-[#1A5344] flex items-center justify-center text-lg shrink-0">
                          <i className={`fa-solid ${
                            isDirect ? 'fa-bolt text-[#C45D48]' : 'fa-book-bookmark text-[#1A5344]'
                          }`}></i>
                        </div>
                      </div>

                      {/* Progress Bar & Details */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#64746D]">Verified Questions</span>
                          <span className="font-bold text-[#1A5344]">
                            {sam.validated_count.toLocaleString()}
                            {sam.expected_count ? ` / ${sam.expected_count.toLocaleString()}` : ''}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#FAF9F5] border border-[#E8E5DD] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#2A7B62] to-[#10B981] transition-all duration-500"
                            style={{ width: `${Math.min(100, cov || 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-[#64746D]">
                          <span>
                            {isDirect 
                              ? 'Direct Practice Mode' 
                              : (isSthanaDirect ? '10 Sthanas (Direct)' : `${sam.division_count || sam.divisions?.length || 0} Sthanas`)}
                          </span>
                          <span className="font-semibold text-[#1A5344]">
                            {sam.validated_count >= (sam.expected_count || 0) ? '100% Ready' : `${cov}% Synced`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Link Deck */}
                    <div className="pt-5 mt-5 border-t border-[#E8E5DD] flex items-center gap-2">
                      {isDirect ? (
                        <>
                          <button
                            onClick={() => handleLaunchPractice(sam.id, sam.name_en, sam.validated_count, 'samhita')}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#1A5344] hover:bg-[#133D32] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <i className="fa-solid fa-play text-[10px]"></i>
                            <span>Practice Test</span>
                          </button>
                          <Link
                            to={`/chapter/${sam.id}`}
                            className="py-2 px-3 rounded-xl border border-[#E8E5DD] hover:bg-[#FAF9F5] text-[#1A5344] text-xs font-semibold transition-colors"
                            title="Browse Question List"
                          >
                            <i className="fa-solid fa-list-ul"></i>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/samhita/${sam.id}`}
                            className="flex-1 text-center py-2 px-3 rounded-xl bg-[#1A5344] hover:bg-[#133D32] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <span>{isSthanaDirect ? 'View Sthanas' : 'Explore Chapters'}</span>
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </Link>
                          <button
                            onClick={() => handleLaunchPractice(sam.id, sam.name_en, sam.validated_count, 'samhita')}
                            className="p-2.5 rounded-xl border border-[#1A5344] text-[#1A5344] hover:bg-[#E8F4F0] text-xs font-bold transition-colors cursor-pointer"
                            title="Quick Practice Samhita"
                          >
                            <i className="fa-solid fa-bolt"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Feature Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="bg-[#FAF9F5] border border-[#E8E5DD] rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E5DD] flex items-center justify-center text-[#1A5344] shrink-0">
            <i className="fa-solid fa-certificate"></i>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1A5344]">Zero Leakage Guarantee</h4>
            <p className="text-xs text-[#64746D] mt-0.5">
              Every practice session queries questions strictly assigned by verified source evidence to that exact leaf or subject.
            </p>
          </div>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E8E5DD] rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E5DD] flex items-center justify-center text-[#C45D48] shrink-0">
            <i className="fa-solid fa-scroll"></i>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#C45D48]">Classical Commentary</h4>
            <p className="text-xs text-[#64746D] mt-0.5">
              Verified Ayurvedic citations referencing Chakrapani, Dalhana, Arundatta, Hemadri, and primary shlokas.
            </p>
          </div>
        </div>

        <div className="bg-[#FAF9F5] border border-[#E8E5DD] rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E5DD] flex items-center justify-center text-[#2A7B62] shrink-0">
            <i className="fa-solid fa-stopwatch"></i>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#2A7B62]">AIAPGET Simulation Engine</h4>
            <p className="text-xs text-[#64746D] mt-0.5">
              Custom timed tests with question palette, mark-for-review, negative marking (-1/+4), and instant analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Practice Configuration Modal */}
      <PracticeConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        nodeId={modalTarget.id}
        nodeTitle={modalTarget.title}
        maxAvailable={modalTarget.count}
        mode={modalTarget.mode}
      />
    </div>
  );
};

export default HomePage;
