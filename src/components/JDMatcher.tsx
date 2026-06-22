import { Sparkles, CheckCircle, AlertCircle, FileText, ListChecks } from "lucide-react";
import { JobMatchResult } from "../types";

interface JDMatcherProps {
  jobMatch: JobMatchResult;
  role: string | null;
}

export function JDMatcher({ jobMatch, role }: JDMatcherProps) {
  const { matchPercentage, matchedSkills, missingSkills, explanation, tailoringTips } = jobMatch;

  let levelText = "Excellent Alignment";
  let colorClass = "from-emerald-500 to-teal-400";
  let textClass = "text-emerald-700";
  let bgClass = "bg-emerald-50";

  if (matchPercentage < 50) {
    levelText = "Weak Alignment";
    colorClass = "from-rose-500 to-amber-500";
    textClass = "text-rose-700";
    bgClass = "bg-rose-50";
  } else if (matchPercentage < 80) {
    levelText = "Moderate Alignment";
    colorClass = "from-amber-400 to-orange-400";
    textClass = "text-amber-700";
    bgClass = "bg-amber-50";
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            Job Description Match Report
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing resonance with your target position {role ? `"${role}"` : ""}
          </p>
        </div>

        {/* Match score bubble */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="block text-2xl font-black text-slate-800 leading-tight">
              {matchPercentage}%
            </span>
            <span className={`block text-xs font-bold ${textClass}`}>
              {levelText}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-violet-50 border border-violet-100 text-violet-600 font-extrabold text-lg">
            🎯
          </div>
        </div>
      </div>

      {/* Match Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
            style={{ width: `${matchPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
          <span>0% match</span>
          <span>50% average</span>
          <span>100% direct hit</span>
        </div>
      </div>

      {/* Structured Text Explanation */}
      <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Analysis Summary</h3>
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          {explanation}
        </p>
      </div>

      {/* Keywords Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Keywords */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800">
              Matched Keywords & Skills ({matchedSkills.length})
            </h3>
          </div>
          {matchedSkills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No direct matching keywords identified yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Keywords */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-800">
              Missing Keywords & Skills ({missingSkills.length})
            </h3>
          </div>
          {missingSkills.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold italic">Excellent! You have all keys covered!</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-100 rounded-full hover:bg-rose-100 transition-colors cursor-help"
                  title="Include this skill on your resume to boost ATS parsing rate!"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tailoring Recommendations */}
      {tailoringTips && tailoringTips.length > 0 && (
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ListChecks className="w-4.5 h-4.5 text-violet-500" />
            Step-by-Step Optimization Guidance
          </h3>
          <ul className="space-y-2.5">
            {tailoringTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                <span className="w-5 h-5 flex items-center justify-center bg-violet-100 text-violet-700 rounded-full shrink-0 font-extrabold text-[10px]">
                  {index + 1}
                </span>
                <span className="flex-1 mt-0.5">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
