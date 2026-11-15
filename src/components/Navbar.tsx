import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchCoverage } from '../api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [validatedCount, setValidatedCount] = useState<number | null>(null);

  useEffect(() => {
    fetchCoverage()
      .then(rep => {
        const total = (rep.total_validated_questions || 0) + (rep.subjectwise_total || 0);
        setValidatedCount(total);
      })
      .catch(() => {});
  }, [location.pathname]);

  const navLinks = [
    { to: '/test-series', label: 'Test Series (362)', icon: 'fa-trophy' },
    { to: '/?tab=subjectwise', label: 'Subjectwise (38)', icon: 'fa-graduation-cap' },
    { to: '/?tab=samhitawise', label: 'Samhitawise (17)', icon: 'fa-book-bookmark' },
    { to: '/coverage', label: 'Audit & Reconciliation', icon: 'fa-chart-pie' },
    { to: '/bookmarks', label: 'My Bookmarks', icon: 'fa-bookmark' },
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
              <p className="text-xs text-[#64746D] font-sanskrit">संहिता एवं विषयवार परीक्षा मंच (Classical & Subjectwise Portal)</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const active = location.pathname + location.search === link.to || (link.to === '/?tab=subjectwise' && location.pathname === '/' && !location.search);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    active
                      ? 'bg-[#E8F4F0] text-[#1A5344] font-semibold'
                      : 'text-[#64746D] hover:text-[#1A5344] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <i className={`fa-solid ${link.icon} text-xs opacity-75`}></i>
                  {link.label}
                </Link>
              );
            })}

            {/* Live Sync Status Pill */}
            <div className="ml-4 pl-4 border-l border-[#E8E5DD] flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2A7B62] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2A7B62]"></span>
              </span>
              <span className="text-xs font-semibold text-[#1A5344]">
                {validatedCount !== null ? `${validatedCount.toLocaleString()} Verified Qs` : '114,928 Qs Live'}
              </span>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#64746D] hover:bg-[#FAF9F5] focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E5DD] bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => {
            const active = location.pathname + location.search === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active ? 'bg-[#E8F4F0] text-[#1A5344] font-semibold' : 'text-[#64746D]'
                }`}
              >
                <i className={`fa-solid ${link.icon} text-xs opacity-75 mr-2`}></i>
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
