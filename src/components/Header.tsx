import { FileSearch, HelpCircle, Info } from "lucide-react";

interface HeaderProps {
  plainLanguageMode: boolean;
  setPlainLanguageMode: (value: boolean) => void;
}

export function Header({ plainLanguageMode, setPlainLanguageMode }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm shadow-violet-500/20">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">
              AI Resume Analyzer
            </h1>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
              ATS SCORE & TAILORING ENGINE
            </span>
          </div>
        </div>

        {/* Toggle plain language mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
              {plainLanguageMode ? "Plain-Language Explanations" : "Standard Professional Terms"}
            </span>
            <button
              type="button"
              id="plain-language-toggle"
              onClick={() => setPlainLanguageMode(!plainLanguageMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 ${
                plainLanguageMode ? "bg-violet-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  plainLanguageMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Quick FAQ/Tooltip helpful flag */}
          <div className="relative group shrink-0">
            <HelpCircle className="w-4.5 h-4.5 text-slate-400 hover:text-slate-600 cursor-help" />
            <div className="absolute right-0 top-6 w-60 bg-slate-800 text-white p-3.5 rounded-xl shadow-lg text-[11px] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none font-normal">
              <span className="font-bold flex items-center gap-1.5 text-violet-300 mb-1">
                <Info className="w-3.5 h-3.5 text-violet-300" /> What is Plain-Language Mode?
              </span>
              Activating this toggle replaces heavy recruiter/HR jargon with simple definitions. Perfect for non-technical users looking for clear guidance.
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
