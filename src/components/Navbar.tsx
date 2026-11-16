import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchCoverage, fetchTags, fetchPreviousYearGroups } from '../api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCoverage().catch(() => null),
      fetchTags().catch(() => null),
      fetchPreviousYearGroups().catch(() => null)
    ]).then(([cov, tagRes, pypRes]) => {
      let count = 0;
      if (cov) {
        count += (cov.total_validated_questions || 0) + (cov.subjectwise_total || 0);
      } else {
        count += 57473 + 57375;
      }
      // Test series verified count
      count += 36902;
      if (tagRes && tagRes.total_ready_assignments) {
        count += tagRes.total_ready_assignments;
      } else {
        count += 9632;
      }
      if (pypRes && pypRes.total_unique_questions) {
        count += (pypRes.total_unique_questions || 14040);
      } else {
        count += 14080;
      }
      setTotalQuestions(count > 0 ? count : 175462);
    }).catch(() => {
      setTotalQuestions(175462);
    });
  }, [location.pathname]);

  const navLinks = [
    { to: '/?tab=samhitawise', label: 'Samhitawise', count: '17', icon: 'fa-book-bookmark' },
    { to: '/?tab=subjectwise', label: 'Subjectwise', count: '38', icon: 'fa-graduation-cap' },
    { to: '/test-series', label: 'Test Series', count: '362', icon: 'fa-trophy' },
    { to: '/previous-years', label: 'Previous Years', count: '127', icon: 'fa-calendar-days' },
    { to: '/tagwise', label: 'Tagwise', count: '6 Tags', icon: 'fa-tags' },
  ];

  const isLinkActive = (to: string) => {
    if (to.includes('?')) {
      return location.pathname + location.search === to;
    }
    if (to === '/') {
      return location.pathname === '/' && (!location.search || location.search === '');
    }
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="bg-white border-b border-[#E8E5DD] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* 1. Left: Brand & Portal Badge */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-[#1A5344] text-white flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
              🌿
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-outfit font-bold text-lg text-[#1A5344] tracking-tight">AyurvedSiddhi</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E8F4F0] text-[#1A5344]">
                  Portal 5167
                </span>
              </div>
              <p className="hidden xl:block text-[11px] text-[#64746D] font-sanskrit leading-none mt-0.5">
                संहिता, विषयवार, टेस्ट सीरीज एवं पूर्व परीक्षा मंच
              </p>
            </div>
          </Link>

          {/* 2. Center: Spacious Desktop Navigation Links (5 Core Modules) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map(link => {
              const active = isLinkActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                    active
                      ? 'bg-[#1A5344] text-white shadow-xs'
                      : 'text-[#4A5D55] hover:text-[#1A5344] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <i className={`fa-solid ${link.icon} text-xs ${active ? 'text-amber-300' : 'opacity-70'}`}></i>
                  <span>{link.label}</span>
                  {link.count && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E8E5DD]/70 text-[#1A5344]'
                    }`}>
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* 3. Right: Utility Controls & Live Questions Counter */}
          <div className="hidden md:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Bookmarks */}
            <Link
              to="/bookmarks"
              className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/bookmarks'
                  ? 'bg-[#E8F4F0] text-[#1A5344]'
                  : 'text-[#64746D] hover:text-[#1A5344] hover:bg-[#FAF9F5]'
              }`}
              title="Saved Bookmarks"
            >
              <i className="fa-solid fa-bookmark text-sm"></i>
              <span className="hidden xl:inline">Bookmarks</span>
            </Link>

            {/* Audit & Ledger */}
            <Link
              to="/coverage"
              className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/coverage'
                  ? 'bg-[#E8F4F0] text-[#1A5344]'
                  : 'text-[#64746D] hover:text-[#1A5344] hover:bg-[#FAF9F5]'
              }`}
              title="Audit Ledger"
            >
              <i className="fa-solid fa-chart-pie text-sm"></i>
              <span className="hidden xl:inline">Audit</span>
            </Link>

            {/* Live Question Pill */}
            <div className="bg-[#FAF9F5] border border-[#E8E5DD] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1A5344] animate-pulse"></span>
              <span className="text-xs font-bold text-[#1A5344]">
                {totalQuestions ? totalQuestions.toLocaleString() : '175,462'} Qs
              </span>
            </div>
          </div>

          {/* 4. Mobile / Tablet Menu Button (visible on < lg) */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/bookmarks"
              className="p-2 rounded-lg text-[#64746D] hover:text-[#1A5344] hover:bg-[#FAF9F5]"
              title="Bookmarks"
            >
              <i className="fa-solid fa-bookmark text-base"></i>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#64746D] hover:text-[#1A5344] hover:bg-[#FAF9F5]"
              aria-label="Toggle Navigation"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E8E5DD] px-4 pt-3 pb-5 space-y-1 shadow-lg">
          <div className="pb-2 mb-2 border-b border-stone-100 flex items-center justify-between text-xs text-stone-500 font-semibold px-1">
            <span>EXPLORE CURRICULUM</span>
            <span className="text-[#1A5344] font-bold">
              {totalQuestions ? totalQuestions.toLocaleString() : '175,462'} Verified Questions
            </span>
          </div>

          {navLinks.map(link => {
            const active = isLinkActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#1A5344] text-white shadow-xs'
                    : 'text-[#4A5D55] hover:bg-[#FAF9F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${link.icon} text-base w-5 text-center ${active ? 'text-amber-300' : 'text-[#1A5344]'}`}></i>
                  <span>{link.label}</span>
                </div>
                {link.count && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-[#E8E5DD] text-[#1A5344]'
                  }`}>
                    {link.count}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between gap-2 px-1">
            <Link
              to="/bookmarks"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              <i className="fa-solid fa-bookmark mr-1.5 text-amber-600"></i>
              Bookmarks
            </Link>
            <Link
              to="/coverage"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              <i className="fa-solid fa-chart-pie mr-1.5 text-emerald-600"></i>
              Audit Ledger
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
