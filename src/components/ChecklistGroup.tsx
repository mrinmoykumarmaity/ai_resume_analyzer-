import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, ArrowRight, Info, Sparkles } from "lucide-react";
import { ImprovementCheckListItem } from "../types";

interface ChecklistGroupProps {
  items: ImprovementCheckListItem[];
  plainLanguageMode: boolean;
}

const CATEGORY_LABELS: Record<string, { title: string; desc: string; plainDesc: string }> = {
  ats_essentials: {
    title: "ATS Essentials",
    desc: "Key parameters that help screen readers and automated scanners extract your resume layout correctly.",
    plainDesc: "Basic rules to make sure the computer scanner doesn't accidentally mess up or throw away your file on the first try.",
  },
  resume_sections: {
    title: "Resume Sections",
    desc: "Verification of essential elements (Summary, Professional Work History, Skills, Education).",
    plainDesc: "Standard checklist of the main parts of your resume that employers normally expect to see first.",
  },
  content_quality: {
    title: "Content Quality",
    desc: "Elimination of vague statements, passive voice, or cliché corporate buzzwords.",
    plainDesc: "Tips to make your writing sound clean, strong, and highly confident instead of boring or vague.",
  },
  job_tailoring: {
    title: "Job Tailoring",
    desc: "Targeted keyword mapping and position specificity aligned with industry requirements.",
    plainDesc: "Steps to make sure your resume lists the exact job terms and keywords the hiring manager wants to find.",
  },
  recruiter_red_flags: {
    title: "Recruiter Red Flags",
    desc: "Prevention of photos, heavy non-reversing layouts, and overly dense paragraphs.",
    plainDesc: "Avoid simple design choices (such as including your photo) that might annoy human hiring managers.",
  },
  bias_discrimination: {
    title: "Bias & Discrimination Avoidance",
    desc: "Compliance checks to reduce potential unconscious bias under local and federal laws (removing age/address).",
    plainDesc: "Protect your privacy and bypass unfair assumptions by hiding extra details like full addresses or birthdates.",
  },
  seniority_impact: {
    title: "Seniority & Quantified Impact",
    desc: "Conversion of activities into measurable results, percentages, values, and scopes.",
    plainDesc: "The single best trick: upgrading your bullets from simple lists of tasks into actual, measurable achievements.",
  },
};

export function ChecklistGroup({ items, plainLanguageMode }: ChecklistGroupProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    ats_essentials: true, // Default open first one
    content_quality: true,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group items by category
  const groupedItems = items.reduce<Record<string, ImprovementCheckListItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const getStatusIcon = (status: "passed" | "warning" | "danger") => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case "danger":
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
    }
  };

  const getStatusBg = (status: "passed" | "warning" | "danger") => {
    switch (status) {
      case "passed":
         return "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50";
      case "warning":
         return "bg-amber-50/50 border-amber-100 hover:bg-amber-50";
      case "danger":
         return "bg-rose-50/50 border-rose-100 hover:bg-rose-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          ATS Compliance Review
        </h2>
        {plainLanguageMode && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full flex items-center gap-1">
            <Info className="w-3 h-3" /> Plain-Language Mode Active
          </span>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
          const catItems = groupedItems[catKey] || [];
          if (catItems.length === 0) return null;

          const isExpanded = expandedCategories[catKey] || false;
          
          // Calculate counts
          const totalCount = catItems.length;
          const passedCount = catItems.filter((i) => i.status === "passed").length;
          const warningCount = catItems.filter((i) => i.status === "warning").length;
          const dangerCount = catItems.filter((i) => i.status === "danger").length;

          return (
            <div
              key={catKey}
              id={`category-section-${catKey}`}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs transition-shadow hover:shadow-xs"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(catKey)}
                aria-expanded={isExpanded}
                className="w-full text-left p-5 flex items-start sm:items-center justify-between gap-4 bg-slate-50/55 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="font-bold text-slate-800 text-base">{catInfo.title}</h3>
                    {/* Tiny stats indicators */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {dangerCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full font-bold">
                          {dangerCount} critical
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-bold">
                          {warningCount} warn
                        </span>
                      )}
                      {passedCount === totalCount && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-semibold">
                          All passed
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                    {plainLanguageMode ? catInfo.plainDesc : catInfo.desc}
                  </p>
                </div>
                <div className="text-slate-400 p-1 bg-white rounded-full border border-slate-200">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Checks list */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100/80 space-y-4">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      id={`check-item-${item.id}`}
                      className={`p-4 rounded-xl border transition-all ${getStatusBg(item.status)}`}
                    >
                      <div className="flex gap-3">
                        {getStatusIcon(item.status)}
                        <div className="flex-1 space-y-1">
                          <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {item.description}
                          </p>

                          {/* Before & After Block */}
                          {item.beforeAfter && (
                            <div className="mt-4 border border-violet-100 bg-violet-50/30 rounded-xl p-4.5 space-y-3">
                              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-extrabold text-violet-700">
                                <Sparkles className="w-3.5 h-3.5" /> High Impact Upgrade Suggestion
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                                    Before
                                  </span>
                                  <div className="text-xs p-2.5 bg-rose-50 border border-rose-100/50 rounded-lg text-rose-900 leading-relaxed italic">
                                    "{item.beforeAfter.before}"
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                                    After <ArrowRight className="w-3 h-3 text-emerald-500" />
                                  </span>
                                  <div className="text-xs p-2.5 bg-emerald-50 border border-emerald-100/50 rounded-lg text-emerald-900 leading-relaxed font-medium">
                                    "{item.beforeAfter.after}"
                                  </div>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                <span className="font-bold text-slate-600">Why it works:</span> {item.beforeAfter.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
