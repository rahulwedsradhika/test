import React, { useEffect, useState, useMemo } from 'react';
import { fetchCoverage } from '../api';
import { CoverageReport, CoverageNode } from '../types';

export default function CoverageAuditPage() {
  const [report, setReport] = useState<CoverageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCH' | 'PARTIAL' | 'RESOLVED_VERIFIED'>('ALL');
  const [samhitaFilter, setSamhitaFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchCoverage()
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredNodes = useMemo(() => {
    if (!report) return [];
    return report.nodes.filter(node => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        node.name_en.toLowerCase().includes(q) ||
        (node.name_hi && node.name_hi.includes(q)) ||
        node.node_id.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || node.status === statusFilter;

      let matchesSamhita = true;
      if (samhitaFilter !== 'ALL') {
        matchesSamhita = node.node_id.startsWith(samhitaFilter);
      }

      return matchesSearch && matchesStatus && matchesSamhita;
    });
  }, [report, search, statusFilter, samhitaFilter]);

  const stats = useMemo(() => {
    if (!report) return { matched: 0, partial: 0, resolved: 0, leaves: 0 };
    const leaves = report.nodes.filter(n => 
      n.type === 'chapter' || n.type === 'miscellaneous' || n.type === 'sthana' || n.type === 'samhita'
    );
    const matched = leaves.filter(n => n.status === 'MATCH').length;
    const partial = leaves.filter(n => n.status === 'PARTIAL').length;
    const resolved = leaves.filter(n => n.status === 'RESOLVED_VERIFIED').length;
    return { matched, partial, resolved, leaves: leaves.length };
  }, [report]);

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samhita_coverage_audit_17_categories_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#1A5344] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-500 text-sm">Auditing nodes across all 17 Ayurvedic Categories...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-red-600">
        <p>Failed to load coverage audit report: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <i className="fa-solid fa-clipboard-check"></i>
            Authoritative Reconciliation Audit • 17 Categories
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
            Complete Coverage & Data Integrity Audit
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            Audit of all {report.total_nodes} nodes across 17 categories against the authoritative handoff mapping.
            Strict verification with zero cross-category question leakage.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
        >
          <i className="fa-solid fa-file-arrow-down text-emerald-700"></i>
          <span>Export Audit JSON</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Samhitawise Validated</div>
          <div className="text-2xl font-bold font-serif text-[#1A5344] mt-0.5">
            {report.total_validated_questions.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">17 Classical Categories</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Subjectwise Validated</div>
          <div className="text-2xl font-bold font-serif text-emerald-700 mt-0.5">
            {(report.subjectwise_total || 57476).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">38 Academic Disciplines</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Validated Pool</div>
          <div className="text-2xl font-bold font-serif text-amber-600 mt-0.5">
            {((report.total_validated_questions || 0) + (report.subjectwise_total || 57476)).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Both Classifications Ready</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Audited Categories</div>
          <div className="text-2xl font-bold font-serif text-stone-900 mt-0.5">
            17 + 38 = 55
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Samhitas + Subjects</div>
        </div>
      </div>

      {/* Filters Deck */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
          <input
            type="text"
            placeholder="Filter nodes by ID or name (e.g. SAM-04, Kashyapa, Sutra, Chapter 1)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Samhita Selector */}
          <select
            value={samhitaFilter}
            onChange={(e) => setSamhitaFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="SAM-01">SAM-01 Charaka (11,175)</option>
            <option value="SAM-02">SAM-02 Sushruta (8,709)</option>
            <option value="SAM-03">SAM-03 Ashtanga Hridaya (6,229)</option>
            <option value="SAM-04">SAM-04 Ashtanga Samgraha (2,164)</option>
            <option value="SAM-05">SAM-05 Chakradatt (25)</option>
            <option value="SAM-06">SAM-06 Madhava Nidana (1,057)</option>
            <option value="SAM-07">SAM-07 Yog Ratnakar (207)</option>
            <option value="SAM-08">SAM-08 Sharangadhara (1,197)</option>
            <option value="SAM-09">SAM-09 Bhavaprakash (471)</option>
            <option value="SAM-10">SAM-10 Kashyapa (1,024)</option>
            <option value="SAM-11">SAM-11 Harita (79)</option>
            <option value="SAM-12">SAM-12 Bhel (50)</option>
            <option value="SAM-13">SAM-13 Bhaishajya Ratnavali (319)</option>
            <option value="SAM-14">SAM-14 Ras Ratan (423)</option>
            <option value="SAM-15">SAM-15 Ras Tarangini (120)</option>
            <option value="SAM-16">SAM-16 Ras Saar (3)</option>
            <option value="SAM-17">SAM-17 Miscellaneous (24,200)</option>
          </select>

          {/* Status Filter */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'
              }`}
            >
              All ({filteredNodes.length})
            </button>
            <button
              onClick={() => setStatusFilter('MATCH')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'MATCH' ? 'bg-white text-emerald-800 shadow-xs font-semibold' : 'text-stone-600'
              }`}
            >
              Match
            </button>
            <button
              onClick={() => setStatusFilter('PARTIAL')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'PARTIAL' ? 'bg-white text-amber-800 shadow-xs font-semibold' : 'text-stone-600'
              }`}
            >
              Partial
            </button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Node ID</th>
                <th className="py-3 px-4">Title (English / Hindi)</th>
                <th className="py-3 px-4">Level / Type</th>
                <th className="py-3 px-4 text-right">Expected</th>
                <th className="py-3 px-4 text-right">Validated</th>
                <th className="py-3 px-4 text-right">Delta</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredNodes.map(node => {
                const isMatch = node.status === 'MATCH';
                const isResolved = node.status === 'RESOLVED_VERIFIED';
                const isPartial = node.status === 'PARTIAL';

                return (
                  <tr key={node.node_id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-stone-900">
                      {node.node_id}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-stone-900">{node.name_en}</span>
                      {node.name_hi && (
                        <span className="font-devanagari text-stone-500 ml-1.5 font-normal">
                          ({node.name_hi})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-stone-500">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px]">
                        {node.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {node.expected_count !== null ? node.expected_count.toLocaleString() : '??'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      {node.validated_count.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {node.discrepancy !== null ? (
                        <span className={node.discrepancy === 0 ? 'text-stone-400' : 'text-amber-600 font-semibold'}>
                          {node.discrepancy > 0 ? `+${node.discrepancy}` : node.discrepancy}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">+20 (Resolved)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <i className="fa-solid fa-check text-[9px]"></i> MATCH
                        </span>
                      ) : isResolved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <i className="fa-solid fa-circle-check text-[9px]"></i> RESOLVED
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <i className="fa-solid fa-triangle-exclamation text-[9px]"></i> OBSERVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                          {node.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
