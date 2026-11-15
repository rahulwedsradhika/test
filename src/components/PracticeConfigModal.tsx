import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startPractice } from '../api';

interface PracticeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeTitle: string;
  maxAvailable: number;
  mode?: 'chapter' | 'division' | 'samhita' | 'mixed';
}

export const PracticeConfigModal: React.FC<PracticeConfigModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodeTitle,
  maxAvailable,
  mode = 'chapter'
}) => {
  const navigate = useNavigate();
  const [count, setCount] = useState<number>(Math.min(20, Math.max(1, maxAvailable)));
  const [timed, setTimed] = useState<boolean>(false);
  const [durationMins, setDurationMins] = useState<number>(20);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (maxAvailable <= 0) {
      setError("No validated questions available in this category yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await startPractice({
        mode,
        scope_node_id: nodeId,
        count: Math.min(count, maxAvailable),
        shuffle,
        timed,
        duration_mins: timed ? durationMins : undefined
      });

      // Save to localStorage so PracticeScreen loads it immediately
      const sessionData = {
        session: res,
        answers: {},
        marked: {},
        bookmarks: {},
        currentIndex: 0,
        timeLeft: res.duration_seconds
      };
      localStorage.setItem(`ayur_session_${res.session_id}`, JSON.stringify(sessionData));

      onClose();
      navigate(`/practice/${res.session_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start practice test.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E8E5DD] overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#E8F4F0] border-b border-[#D5E8E2] flex justify-between items-center">
          <div>
            <h3 className="font-outfit font-bold text-lg text-[#1A5344] flex items-center gap-2">
              <i className="fa-solid fa-graduation-cap"></i> Configure Practice Test
            </h3>
            <p className="text-xs text-[#2A7B62] font-medium truncate max-w-xs">{nodeTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64746D] hover:bg-white/80 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Question Count Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#64746D]">
                Number of Questions
              </label>
              <span className="text-xs font-semibold text-[#1A5344]">
                {count} / {maxAvailable} available
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 20, 50, maxAvailable].map((c, i) => {
                const val = Math.min(c, maxAvailable);
                if (val <= 0) return null;
                const isSelected = count === val;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCount(val)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#1A5344] text-white border-[#1A5344] shadow-xs'
                        : 'bg-white text-[#23342E] border-[#E8E5DD] hover:border-[#1A5344]'
                    }`}
                  >
                    {c === maxAvailable ? `All (${maxAvailable})` : `${c} Qs`}
                  </button>
                );
              })}
            </div>
            <input
              type="range"
              min="1"
              max={Math.max(1, maxAvailable)}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-[#1A5344]"
            />
          </div>

          {/* Timed Mode Toggle */}
          <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E8E5DD] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-clock text-[#1A5344]"></i>
                <div>
                  <div className="text-sm font-semibold text-[#23342E]">Timed Examination</div>
                  <div className="text-xs text-[#64746D]">Simulate real AIAPGET entrance exam pacing</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
                className="w-5 h-5 accent-[#1A5344] rounded cursor-pointer"
              />
            </div>

            {timed && (
              <div className="pt-2 border-t border-[#E8E5DD] flex items-center justify-between text-xs">
                <span className="text-[#64746D]">Duration: <strong>{durationMins} minutes</strong></span>
                <div className="flex gap-1.5">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMins(mins)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold border ${
                        durationMins === mins
                          ? 'bg-[#1A5344] text-white border-[#1A5344]'
                          : 'bg-white text-[#64746D] border-[#E8E5DD]'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question Shuffle */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[#64746D] font-medium flex items-center gap-1.5">
              <i className="fa-solid fa-shuffle text-[#2A7B62]"></i> Shuffle questions
            </span>
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="w-4 h-4 accent-[#1A5344] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF9F5] border-t border-[#E8E5DD] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E8E5DD] text-xs font-semibold text-[#64746D] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || maxAvailable <= 0}
            onClick={handleStart}
            className="flex-1 py-2.5 rounded-xl bg-[#1A5344] hover:bg-[#133D32] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-play text-xs"></i>
            )}
            Start Practice
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeConfigModal;
