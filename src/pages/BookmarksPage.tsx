import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBookmarks } from '../api';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks()
      .then(data => {
        setBookmarks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-500 text-sm">Loading your saved questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <i className="fa-solid fa-bookmark"></i>
            Revision Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
            Bookmarked Questions
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Review questions you saved during your test and practice sessions.
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-stone-100 text-stone-800 rounded-xl text-xs font-bold">
          {bookmarks.length} Saved
        </span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 text-2xl">
            <i className="fa-regular fa-bookmark"></i>
          </div>
          <h3 className="text-base font-bold text-stone-900 mb-1">No Bookmarks Saved</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
            When practicing questions in any Samhita or Adhyaya, click the Bookmark button to save difficult questions for targeted revision.
          </p>
          <Link
            to="/"
            className="inline-flex px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition"
          >
            Explore Samhitas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((b, idx) => (
            <div
              key={b.question_id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs hover:border-amber-300 transition"
            >
              <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
                <span className="font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md">
                  #{idx + 1}
                </span>
                <span className="font-mono text-[11px] text-stone-400">
                  ID: {b.source_question_id || b.question_id.slice(0, 8)}
                </span>
              </div>

              <div
                className="text-stone-900 font-serif text-base mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: b.stem_raw }}
              />

              {b.answer_explanation_raw && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-stone-800">
                  <span className="font-bold text-amber-900 block mb-1">Reference:</span>
                  <div dangerouslySetInnerHTML={{ __html: b.answer_explanation_raw }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

