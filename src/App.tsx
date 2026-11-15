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
import { TagwiseHomePage } from './pages/TagwiseHomePage';
import { TagwiseQuestionListPage } from './pages/TagwiseQuestionListPage';
import { TagwiseExamScreen } from './pages/TagwiseExamScreen';
import { TagwiseResultScreen } from './pages/TagwiseResultScreen';
import { PreviousYearsHomePage } from './pages/PreviousYearsHomePage';
import { PreviousYearsTestListPage } from './pages/PreviousYearsTestListPage';
import { PreviousYearsExamScreen } from './pages/PreviousYearsExamScreen';
import { PreviousYearsResultScreen } from './pages/PreviousYearsResultScreen';

export default function App() {
  const location = useLocation();
  const isExamMode =
    location.pathname.startsWith('/practice/') ||
    location.pathname.startsWith('/test-series/exam/') ||
    location.pathname.startsWith('/tagwise/practice/') ||
    (location.pathname.startsWith('/previous-years/tests/') && location.pathname.endsWith('/exam'));

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

          {/* Phase 4: Test Series Routes */}
          <Route path="/test-series" element={<TestSeriesHomePage />} />
          <Route path="/test-series/:seriesId" element={<TestSeriesDetailPage />} />
          <Route path="/test-series/:seriesId/test/:testId" element={<TestOverviewPage />} />
          <Route path="/test-series/exam/:attemptId" element={<TestExamScreen />} />
          <Route path="/test-series/results/:attemptId" element={<TestResultScreen />} />

          {/* Phase 5: Tagwise Routes */}
          <Route path="/tagwise" element={<TagwiseHomePage />} />
          <Route path="/tagwise/:tagId" element={<TagwiseQuestionListPage />} />
          <Route path="/tagwise/practice/:attemptId" element={<TagwiseExamScreen />} />
          <Route path="/tagwise/results/:attemptId" element={<TagwiseResultScreen />} />

          {/* Phase 6: Previous Year Papers Routes */}
          <Route path="/previous-years" element={<PreviousYearsHomePage />} />
          <Route path="/previous-years/:groupId" element={<PreviousYearsTestListPage />} />
          <Route path="/previous-years/tests/:testId/exam" element={<PreviousYearsExamScreen />} />
          <Route path="/previous-years/attempts/:attemptId/results" element={<PreviousYearsResultScreen />} />
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
              <span>AyurvedSiddhi Classical, Subjectwise, Test Series, Tagwise & PYP Portal</span>
            </div>
            <div className="flex items-center gap-6 text-stone-500">
              <span>Port: 5167</span>
              <span>•</span>
              <span>17 Samhitas • 38 Subjects • 7 Test Series • 6 Tags • 127 PYP Papers</span>
              <span>•</span>
              <span>175,542+ Authenticated Live Questions</span>
            </div>
            <div className="text-stone-400">
              Charaka • Sushruta • Vagbhata • AIAPGET • UPSC • State PSCs • New Pattern Tags
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
