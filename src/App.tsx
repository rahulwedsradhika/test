import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SamhitaDetailPage from './pages/SamhitaDetailPage';
import SthanaDetailPage from './pages/SthanaDetailPage';
import ChapterQuestionListPage from './pages/ChapterQuestionListPage';
import SubjectQuestionListPage from './pages/SubjectQuestionListPage';
import PracticeScreen from './pages/PracticeScreen';
import ResultsScreen from './pages/ResultsScreen';
import CoverageAuditPage from './pages/CoverageAuditPage';
import BookmarksPage from './pages/BookmarksPage';
import TestSeriesHomePage from './pages/TestSeriesHomePage';
import TestSeriesDetailPage from './pages/TestSeriesDetailPage';
import TestOverviewPage from './pages/TestOverviewPage';
import TestExamScreen from './pages/TestExamScreen';
import TestResultScreen from './pages/TestResultScreen';

export default function App() {
  const location = useLocation();
  const isExamMode = location.pathname.startsWith('/practice/') || location.pathname.startsWith('/test-series/exam/');

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900 selection:bg-amber-200">
      {/* Hide navbar on full test / exam screen for maximum focus */}
      {!isExamMode && <Navbar />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subjects" element={<HomePage />} />
          <Route path="/subjectwise" element={<HomePage />} />
          <Route path="/subject/:subjectId" element={<SubjectQuestionListPage />} />
          <Route path="/samhita/:samhitaId" element={<SamhitaDetailPage />} />
          <Route path="/division/:divisionId" element={<SthanaDetailPage />} />
          <Route path="/chapter/:chapterId" element={<ChapterQuestionListPage />} />
          <Route path="/practice/:sessionId" element={<PracticeScreen />} />
          <Route path="/results/:sessionId" element={<ResultsScreen />} />
          <Route path="/coverage" element={<CoverageAuditPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />

          {/* Phase 4 Test Series Routes */}
          <Route path="/test-series" element={<TestSeriesHomePage />} />
          <Route path="/test-series/:seriesId" element={<TestSeriesDetailPage />} />
          <Route path="/test-series/:seriesId/test/:testId" element={<TestOverviewPage />} />
          <Route path="/test-series/exam/:attemptId" element={<TestExamScreen />} />
          <Route path="/test-series/results/:attemptId" element={<TestResultScreen />} />
        </Routes>
      </main>

      {/* Footer */}
      {!isExamMode && (
        <footer className="bg-white border-t border-[#E8E5DD] py-8 px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-stone-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-serif text-stone-800 font-bold">
              <span className="w-6 h-6 rounded-lg bg-[#1A5344] text-white flex items-center justify-center text-xs">
                🌿
              </span>
              <span>AyurvedSiddhi Classical, Subjectwise & Test Series Portal</span>
            </div>
            <div className="flex items-center gap-6 text-stone-500">
              <span>Port: 5167</span>
              <span>•</span>
              <span>17 Samhitas • 38 Subjects • 7 Test Series (362 Tests)</span>
              <span>•</span>
              <span>151,830 Authenticated Live Questions</span>
            </div>
            <div className="text-stone-400">
              Charaka • Sushruta • Vagbhata • AIAPGET • UPSC • UPPSC • HPSC
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
