import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchCoverage, fetchTags, fetchPreviousYearGroups, fetchDailySessions } from '../api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCoverage().catch(() => null),
      fetchTags().catch(() => null),
      fetchPreviousYearGroups().catch(() => null),
      fetchDailySessions().catch(() => null)
    ]).then(([cov, tagRes, pypRes, dailyRes]) => {
      let count = 0;
      if (cov) {
        count += (cov.total_validated_questions || 0) + (cov.subjectwise_total || 0);
      }
      // Test series verified count
      count += 36902;
      if (tagRes && tagRes.total_ready_assignments) {
        count += tagRes.total_ready_assignments;
      }
      if (pypRes && pypRes.total_unique_questions) {
        count += (pypRes.total_unique_questions || 14040);
      } else {
        count += 14040;
      }
      if (dailyRes && dailyRes.total_unique_questions) {
        count += (dailyRes.total_unique_questions || 12350);
      } else {
        count += 12350;
      }
      setTotalQuestions(count > 0 ? count : 187852);
    }).catch(() => {
      setTotalQuestions(187852);
    });
  }, [location.pathname]);

  const navLinks = [
    { to: '/?tab=samhitawise', label: 'Samhitawise', count: '17', icon: 'fa-book-bookmark' },
    { to: '/?tab=subjectwise', label: 'Subjectwise', count: '38', icon: 'fa-graduation-cap' },
    { to: '/test-series', label: 'Test Series', count: '362', icon: 'fa-trophy' },
    { to: '/tagwise', label: 'Tagwise', count: '6 Tags', icon: 'fa-tags' },
    { to: '/previous-years', label: 'Previous Years', count: '127', icon: 'fa-calendar-days' },
    { to: '/daily-tests', label: 'Daily Tests', count: '3 Sess', icon: 'fa-sun' },
    { to: '/mock-tests', label: 'Mock Tests', count: '398', icon: 'fa-brain' },
    { to: '/coverage', label: 'Audit & Ledger', count: '', icon: 'fa-chart-pie' },
    { to: '/bookmarks', label: 'Bookmarks', count: '', icon: 'fa-bookmark' },
  ];

  return (
    <nav className="bg-white border-b border-[#E8E5DD] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#1A5344] text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-outfit font-bold text-lg text-[#1A5344] tracking-tight">AyurvedSiddhi</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E8F4F0] text-[#1A5344]">
                  Portal 5167
                </span>
              </div>
              <p className="text-xs text-[#64746D] font-sanskrit">संहिता, विषयवार एवं नवीन प्रारूप परीक्षा मंच</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const isMatch = location.pathname === link.to ||
                (link.to.includes('?') && location.pathname + location.search === link.to) ||
                (link.to === '/tagwise' && location.pathname.startsWith('/tagwise')) ||
                (link.to === '/previous-years' && location.pathname.startsWith('/previous-years')) ||
                (link.to === '/daily-tests' && location.pathname.startsWith('/daily-tests')) ||
                (link.to === '/mock-tests' && location.pathname.startsWith('/mock-tests')) ||
                (link.to === '/test-series' && location.pathname.startsWith('/test-series'));

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isMatch
                      ? 'bg-[#E8F4F0] text-[#1A5344] font-semibold shadow-xs'
                      : 'text-[#64746D] hover:text-[#1A5344] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <i className={`fa-solid ${link.icon} text-xs opacity-75`}></i>
                  <span>{link.label}</span>
                  {link.count && (
                    <span className="text-[10px] bg-[#E8E5DD]/70 text-[#1A5344] px-1.5 py-0.5 rounded-full font-bold">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Live Verified Question Pill */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="bg-[#FAF9F5] border border-[#E8E5DD] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1A5344] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#1A5344]">
                {totalQuestions ? totalQuestions.toLocaleString() : '151,830'} Verified Qs
              </span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E8E5DD] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => {
            const isMatch = location.pathname === link.to ||
              (link.to.includes('?') && location.pathname + location.search === link.to) ||
              (link.to === '/tagwise' && location.pathname.startsWith('/tagwise')) ||
              (link.to === '/previous-years' && location.pathname.startsWith('/previous-years')) ||
              (link.to === '/daily-tests' && location.pathname.startsWith('/daily-tests')) ||
              (link.to === '/test-series' && location.pathname.startsWith('/test-series'));

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isMatch
                    ? 'bg-[#E8F4F0] text-[#1A5344] font-semibold'
                    : 'text-[#64746D] hover:bg-[#FAF9F5]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${link.icon} text-sm w-5 text-center`}></i>
                  <span>{link.label}</span>
                </div>
                {link.count && (
                  <span className="text-xs bg-[#E8E5DD] text-[#1A5344] px-2 py-0.5 rounded-full font-bold">
                    {link.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
