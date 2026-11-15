import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchTagById, fetchTagQuestions, startTagwisePractice } from '../api';
import { TagCategory, TagQuestion } from '../types';

export const TagwiseQuestionListPage: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState<TagCategory | null>(null);
  const [questions, setQuestions] = useState<TagQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchQuery, setSearchQuery] = useState('');

  // Practice Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(20);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [shuffle, setShuffle] = useState(true);
  const [isStartingPractice, setIsStartingPractice] = useState(false);

  useEffect(() => {
    if (searchParams.get('launch') === 'practice') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!tagId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchTagById(tagId),
      fetchTagQuestions(tagId, pageSize, (page - 1) * pageSize, searchQuery, true)
    ])
      .then(([tagRes, qRes]) => {
        setCategory(tagRes.category);
        setQuestions(qRes.questions || []);
        setTotalQuestions(qRes.total_questions || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tag questions:', err);
        setError('Failed to load category questions. Please check API server connection.');
        setLoading(false);
      });
  }, [tagId, page, searchQuery]);

  const handleStartPractice = async () => {
    if (!tagId) return;
    setIsStartingPractice(true);
    try {
      const session = await startTagwisePractice({
        tagId,
        questionCount: selectedCount,
        durationMinutes: selectedDuration,
        shuffle
      });
      navigate(`/tagwise/practice/${session.attempt_id}`);
    } catch (err: any) {
      console.error('Failed to start practice:', err);
      alert(err.message || 'Error launching practice session.');
      setIsStartingPractice(false);
    }
  };

  const totalPages = Math.ceil(totalQuestions / pageSize);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#64746D]">
        <Link to="/" className="hover:text-[#1A5344] transition-colors">Home</Link>
        <span>/</span>
        <Link to="/tagwise" className="hover:text-[#1A5344] transition-colors">Tagwise Question Bank</Link>
        <span>/</span>
        <span className="text-[#1A5344] font-semibold">{category?.label_source_exact || tagId}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF9F5] text-[#1A5344] border border-[#E8E5DD]">
              {category?.local_tag_id}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F4F0] text-[#1A5344]">
              {category?.ready_count.toLocaleString()} Ready Questions
            </span>
          </div>
          <h1 className="font-outfit font-bold text-2xl sm:text-3xl text-[#1A5344]">
            {category?.label_source_exact}
          </h1>
          <p className="text-xs sm:text-sm text-[#64746D]">
            Authentic examination questions extracted from verified source endpoints. Practice in realistic timed examination mode or browse questions below.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-[#1A5344] text-white font-bold text-sm hover:bg-[#2A7B62] transition-all shadow-md flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
        >
          <i className="fa-solid fa-play"></i>
          <span>Start Practice Exam</span>
        </button>
      </div>

      {/* Search & Browser Control */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E5DD] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64746D] text-xs"></i>
          <input
            type="text"
            placeholder="Search questions in this category..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8E5DD] text-xs focus:outline-none focus:ring-2 focus:ring-[#1A5344] bg-[#FAF9F5]/40"
          />
        </div>

        <div className="text-xs text-[#64746D] font-medium">
          Showing {questions.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalQuestions)} of {totalQuestions} questions
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="text-center py-16 space-y-3">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-[#1A5344]"></i>
          <p className="text-sm font-medium text-[#64746D]">Loading questions...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Question Cards List */}
      {!loading && !error && (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const questionNumber = (page - 1) * pageSize + idx + 1;
            return (
              <div
                key={q.question_uid}
                className="bg-white rounded-2xl border border-[#E8E5DD] p-6 shadow-xs space-y-4 hover:border-[#1A5344]/30 transition-all"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between text-xs border-b border-[#E8E5DD]/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1A5344] text-white flex items-center justify-center font-bold text-xs">
                      {questionNumber}
                    </span>
                    <span className="font-mono text-[#64746D]">{q.question_uid}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF9F5] text-[#1A5344] font-medium text-[11px] border border-[#E8E5DD]">
                    Source ID: {q.source_question_id}
                  </span>
                </div>

                {/* Question Stem (Safe HTML) */}
                <div
                  className="text-sm sm:text-base text-gray-800 leading-relaxed font-sanskrit prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: q.stem }}
                />

                {/* Question Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {q.options.map(opt => {
                    const isCorrect = opt.is_correct_verified === 1;
                    return (
                      <div
                        key={opt.option_position}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                            : 'bg-[#FAF9F5]/60 border-[#E8E5DD] text-gray-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#E8E5DD] text-[#1A5344]'
                          }`}
                        >
                          {String.fromCharCode(64 + opt.option_position)}
                        </span>
                        <div
                          className="leading-snug"
                          dangerouslySetInnerHTML={{ __html: opt.option_source_raw }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Classical Reference / Explanation */}
                {q.explanation && (
                  <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2.5">
                    <i className="fa-solid fa-book-open text-emerald-700 mt-0.5"></i>
                    <div>
                      <span className="font-bold text-emerald-900">Classical Reference: </span>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-[#E8E5DD] text-xs font-semibold bg-white disabled:opacity-40 hover:bg-[#FAF9F5]"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-[#64746D] px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-[#E8E5DD] text-xs font-semibold bg-white disabled:opacity-40 hover:bg-[#FAF9F5]"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Practice Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E5DD] animate-scale-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1A5344] uppercase tracking-wider">Practice Exam Setup</span>
                <h3 className="font-outfit font-bold text-xl text-[#1A5344] mt-0.5">
                  {category?.label_source_exact}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF9F5] text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Question Count Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A5344] block">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setSelectedCount(cnt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedCount === cnt
                        ? 'bg-[#1A5344] text-white border-[#1A5344] shadow-xs'
                        : 'bg-[#FAF9F5] text-gray-700 border-[#E8E5DD] hover:border-[#1A5344]'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A5344] block">Time Limit</label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setSelectedDuration(mins)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedDuration === mins
                        ? 'bg-[#1A5344] text-white border-[#1A5344] shadow-xs'
                        : 'bg-[#FAF9F5] text-gray-700 border-[#E8E5DD] hover:border-[#1A5344]'
                    }`}
                  >
                    {mins} Mins
                  </button>
                ))}
              </div>
            </div>

            {/* Shuffle Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD]">
              <div className="text-xs font-medium text-gray-700">Randomize Question Order</div>
              <input
                type="checkbox"
                checked={shuffle}
                onChange={e => setShuffle(e.target.checked)}
                className="w-4 h-4 text-[#1A5344] rounded-sm focus:ring-[#1A5344]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-1/2 py-3 rounded-xl border border-[#E8E5DD] text-xs font-bold text-gray-700 hover:bg-[#FAF9F5]"
              >
                Cancel
              </button>
              <button
                onClick={handleStartPractice}
                disabled={isStartingPractice}
                className="w-1/2 py-3 rounded-xl bg-[#1A5344] text-white text-xs font-bold hover:bg-[#2A7B62] shadow-md flex items-center justify-center gap-2"
              >
                {isStartingPractice ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play text-[10px]"></i>
                    <span>Launch Exam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
