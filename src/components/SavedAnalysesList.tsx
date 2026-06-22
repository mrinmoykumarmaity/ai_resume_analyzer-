import { Trash2, Calendar, FileText, ArrowRight, RefreshCw } from "lucide-react";
import { SavedAnalysis } from "../types";

interface SavedAnalysesListProps {
  history: SavedAnalysis[];
  onSelect: (analysis: SavedAnalysis) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  activeId?: string;
}

export function SavedAnalysesList({
  history,
  onSelect,
  onDelete,
  onClearAll,
  activeId,
}: SavedAnalysesListProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 text-center space-y-2">
        <div className="text-3xl">📭</div>
        <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">No saved analyses</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Upload and review your first resume to see your version feedback history here!
        </p>
      </div>
    );
  }

  // Calculate score improvement trend
  const sortedByTime = [...history].sort(
    (a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime()
  );
  const firstScore = sortedByTime[0]?.overallScore || 0;
  const latestScore = sortedByTime[sortedByTime.length - 1]?.overallScore || 0;
  const improvement = latestScore - firstScore;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Review Version History</h3>
          <p className="text-[11px] text-slate-400">Save and compare your resume improvements</p>
        </div>
        <button
          onClick={onClearAll}
          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
        >
          Purge Data
        </button>
      </div>

      {/* Score Improvement Visual Tracer */}
      {history.length > 1 && (
        <div className="p-3.5 bg-violet-50/50 border border-violet-100/60 rounded-xl flex items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-violet-500">
              Score Progress Trend
            </span>
            <span className="block text-xs font-bold text-slate-700">
              {improvement > 0
                ? `🚀 Score improved by +${improvement} pts!`
                : improvement < 0
                ? `📉 Score decreased by ${improvement} pts`
                : "保持稳定 - score consistent across versions! Keep optimization active."}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold bg-white px-2 py-1 rounded border border-slate-100 shadow-2xs shrink-0 select-none">
            <span className="text-rose-500">{firstScore}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="text-emerald-500">{latestScore}</span>
          </div>
        </div>
      )}

      {/* History Checklist List */}
      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
        {[...history]
          .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
          .map((item, index) => {
            const isActive = item.id === activeId;
            const dateStr = new Date(item.analyzedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            // Status color helper for past scores
            let scoreColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
            if (item.overallScore < 50) {
              scoreColor = "bg-rose-50 text-rose-700 border-rose-100";
            } else if (item.overallScore < 80) {
              scoreColor = "bg-amber-50 text-amber-700 border-amber-100";
            }

            return (
              <div
                key={item.id}
                id={`saved-item-${item.id}`}
                className={`group p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isActive
                    ? "border-violet-400 bg-violet-50/20 shadow-2xs"
                    : "border-slate-100 hover:border-slate-200 bg-white"
                }`}
              >
                {/* Info and load trigger button */}
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-700 truncate block">
                      {item.fileName || "Pasted Resume"}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">
                      v{history.length - index}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-normal">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {dateStr}
                    </span>
                    {item.jobTitle && (
                      <span className="truncate max-w-[110px] block border-l border-slate-200 pl-2">
                        🎯 {item.jobTitle}
                      </span>
                    )}
                  </div>
                </button>

                {/* Score badge & delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`px-2 py-0.5 rounded text-xs font-black border ${scoreColor}`}>
                    {item.overallScore}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    aria-label="Delete analysis"
                    className="p-1.5 hover:bg-slate-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
