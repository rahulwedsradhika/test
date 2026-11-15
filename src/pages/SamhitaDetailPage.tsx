import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSamhitas } from '../api';
import { SamhitaNode, DivisionNode } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PracticeConfigModal } from '../components/PracticeConfigModal';

export const SamhitaDetailPage: React.FC = () => {
  const { samhitaId } = useParams<{ samhitaId: string }>();
  const [samhita, setSamhita] = useState<SamhitaNode | null>(null);
  const [loading, setLoading] = useState(true);

  // Practice modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<{ id: string; title: string; count: number; mode: 'division' | 'samhita' }>({
    id: '',
    title: '',
    count: 0,
    mode: 'division'
  });

  useEffect(() => {
    fetchSamhitas()
      .then(list => {
        const found = list.find(s => s.id === samhitaId);
        setSamhita(found || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading samhita:", err);
        setLoading(false);
      });
  }, [samhitaId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#1A5344]"></i>
        <p className="text-xs text-[#64746D] mt-2">Loading Samhita details...</p>
      </div>
    );
  }

  if (!samhita) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-[#1A5344]">Category Not Found</h2>
        <Link to="/" className="text-xs text-[#2A7B62] underline mt-2 inline-block">Return to Home</Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { id: samhita.id, name_en: samhita.name_en, name_hi: samhita.name_hi, type: 'samhita' }
  ];

  const handleOpenPractice = (id: string, title: string, count: number, mode: 'division' | 'samhita') => {
    setModalTarget({ id, title, count, mode });
    setModalOpen(true);
  };

  const isKashyapa = samhita.id === 'SAM-10';
  const isDirect = samhita.is_direct;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Samhita Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DD] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E8E5DD] text-[#64746D]">
              {samhita.id}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F4F0] text-[#1A5344]">
              {samhita.category_group || 'Samhita'}
            </span>
            {isKashyapa && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Sthana-Based Direct Questions
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-[#1A5344]">
            {samhita.name_en}
          </h1>
          {samhita.name_hi && (
            <p className="text-base sm:text-lg font-sanskrit text-[#C45D48] font-semibold">
              {samhita.name_hi}
            </p>
          )}
          <p className="text-xs sm:text-sm text-[#64746D] max-w-xl">
            {isKashyapa
              ? 'Kashyapa Samhita practice questions are organized by Sthana divisions directly, without further sub-chapter subdivision.'
              : (isDirect
                  ? 'All questions in this category are directly available for full test series and review.'
                  : 'Practice classical adhyayas with zero cross-chapter leakage, authenticated shlokas, and traditional commentary.')}
          </p>
        </div>

        {/* Stats & Launch Action */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
          <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-[#E8E5DD] flex items-center justify-between gap-6">
            <div>
              <div className="text-[11px] text-[#64746D] font-medium">Validated Questions</div>
              <div className="text-xl font-bold font-outfit text-[#1A5344]">
                {samhita.validated_count.toLocaleString()}
                {samhita.expected_count ? (
                  <span className="text-xs font-normal text-[#64746D] ml-1">
                    / {samhita.expected_count.toLocaleString()}
                  </span>
                ) : ''}
              </div>
            </div>
            <div className="h-8 w-[1px] bg-[#E8E5DD]"></div>
            <div>
              <div className="text-[11px] text-[#64746D] font-medium">Structure</div>
              <div className="text-xl font-bold font-outfit text-[#1A5344]">
                {samhita.divisions.length > 0 ? `${samhita.divisions.length} Sthanas` : 'Direct Leaf'}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenPractice(samhita.id, samhita.name_en, samhita.validated_count, 'samhita')}
            disabled={samhita.validated_count <= 0}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-[#1A5344] hover:bg-[#133D32] text-white transition-all shadow-xs disabled:opacity-40"
          >
            <i className="fa-solid fa-bolt"></i>
            <span>Practice Full Category</span>
          </button>
        </div>
      </div>

      {/* Sthanas / Divisions Section */}
      {samhita.divisions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-outfit font-bold text-[#1A5344]">
                {isKashyapa ? 'Kashyapa Sthanas (Direct Practice)' : 'Sthanas & Divisions'}
              </h2>
              <p className="text-xs text-[#64746D]">
                {isKashyapa
                  ? 'Select any Sthana to launch practice test or view questions directly.'
                  : 'Select a Sthana to explore its constituent classical adhyayas.'}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#64746D]">
              {samhita.divisions.length} Divisions Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {samhita.divisions.map((div, idx) => {
              const cov = div.coverage_percent || 0;

              return (
                <div
                  key={div.id}
                  className="bg-white rounded-2xl p-5 border border-[#E8E5DD] hover-lift flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="w-7 h-7 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-center text-xs font-bold text-[#64746D]">
                        {idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        div.validated_count >= (div.expected_count || 0)
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : (div.validated_count > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500')
                      }`}>
                        {div.validated_count >= (div.expected_count || 0) ? '100% Ready' : `${div.validated_count} Qs`}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-outfit font-bold text-[#1A5344]">
                        {div.name_en}
                      </h3>
                      {div.name_hi && (
                        <p className="text-xs font-sanskrit text-[#64746D]">
                          {div.name_hi}
                        </p>
                      )}
                    </div>

                    {/* Progress & Chapter counts */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#64746D]">
                          {isKashyapa ? 'Direct Sthana Pool' : (div.chapter_count > 0 ? `${div.chapter_count} Chapters` : 'Direct Leaf')}
                        </span>
                        <span className="font-semibold text-[#1A5344]">
                          {div.validated_count.toLocaleString()}
                          {div.expected_count ? ` / ${div.expected_count.toLocaleString()}` : ''} Qs
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#FAF9F5] border border-[#E8E5DD] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2A7B62]"
                          style={{ width: `${Math.min(100, cov || 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-4 border-t border-[#E8E5DD] flex items-center gap-2">
                    {isKashyapa ? (
                      <>
                        <button
                          onClick={() => handleOpenPractice(div.id, `${samhita.name_en} - ${div.name_en}`, div.validated_count, 'division')}
                          disabled={div.validated_count <= 0}
                          className="flex-1 text-center py-2 rounded-xl bg-[#1A5344] hover:bg-[#133D32] text-white text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                        >
                          <i className="fa-solid fa-play text-[10px]"></i>
                          <span>Practice Sthana</span>
                        </button>
                        <Link
                          to={`/chapter/${div.id}`}
                          className="py-2 px-3 rounded-xl border border-[#E8E5DD] hover:bg-[#FAF9F5] text-[#1A5344] text-xs font-semibold transition-colors"
                          title="View Questions"
                        >
                          <i className="fa-solid fa-list-ul"></i>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/division/${div.id}`}
                          className="flex-1 text-center py-2 rounded-xl border border-[#1A5344] text-[#1A5344] hover:bg-[#E8F4F0] text-xs font-bold transition-colors"
                        >
                          <span>View Chapters</span>
                        </Link>
                        <button
                          onClick={() => handleOpenPractice(div.id, `${samhita.name_en} - ${div.name_en}`, div.validated_count, 'division')}
                          disabled={div.validated_count <= 0}
                          className="p-2 rounded-xl bg-[#1A5344] hover:bg-[#133D32] text-white text-xs font-bold transition-colors disabled:opacity-40"
                          title="Practice Full Sthana"
                        >
                          <i className="fa-solid fa-play"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Direct Category Direct Launch Deck */
        <div className="bg-white rounded-3xl p-8 border border-[#E8E5DD] shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E8F4F0] text-[#1A5344] flex items-center justify-center text-2xl mx-auto">
            <i className="fa-solid fa-feather-pointed"></i>
          </div>
          <h2 className="text-xl font-bold font-outfit text-[#1A5344]">Direct Practice Category</h2>
          <p className="text-sm text-[#64746D] max-w-lg mx-auto">
            This category operates directly as an authenticated question pool with {samhita.validated_count.toLocaleString()} validated questions.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => handleOpenPractice(samhita.id, samhita.name_en, samhita.validated_count, 'samhita')}
              className="px-6 py-3 rounded-2xl bg-[#1A5344] hover:bg-[#133D32] text-white text-sm font-bold shadow-xs flex items-center gap-2"
            >
              <i className="fa-solid fa-play"></i>
              <span>Start Practice Test</span>
            </button>
            <Link
              to={`/chapter/${samhita.id}`}
              className="px-6 py-3 rounded-2xl border border-[#1A5344] text-[#1A5344] hover:bg-[#E8F4F0] text-sm font-bold flex items-center gap-2"
            >
              <i className="fa-solid fa-list-ul"></i>
              <span>Browse All Questions</span>
            </Link>
          </div>
        </div>
      )}

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

export default SamhitaDetailPage;
