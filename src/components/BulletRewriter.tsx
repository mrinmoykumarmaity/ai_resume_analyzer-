import React, { useState } from "react";
import { Sparkles, ArrowRight, Copy, Check, Info } from "lucide-react";
import { BulletRewriteResult } from "../types";

export function BulletRewriter() {
  const [bullet, setBullet] = useState("");
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BulletRewriteResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bullet.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/rewrite-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet, role, industry }),
      });

      if (!response.ok) {
        throw new Error("Failed to optimize bullet point. Please try again.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const loadExample = () => {
    setBullet("I was in charge of checking client calls and managing standard bugs in the software.");
    setRole("Software Engineer");
    setIndustry("Technology");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
          Bullet Point Rewriter Sandbox
        </h2>
        <p className="text-xs text-slate-400">
          Transform boring duties into high-impact, quantified achievement bullets.
        </p>
      </div>

      <form onSubmit={handleRewrite} className="space-y-4">
        {/* Bullet Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Current Bullet Point (Weak/Average)
            </label>
            <button
              type="button"
              onClick={loadExample}
              className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 hover:underline"
            >
              Load weak example
            </button>
          </div>
          <textarea
            value={bullet}
            onChange={(e) => setBullet(e.target.value)}
            placeholder="e.g., Handled customer calls and was in charge of checking metrics."
            rows={2}
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 resize-y"
            required
          />
        </div>

        {/* Supplementary inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Target Role (Optional)
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Full-Stack Engineer"
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-violet-500 lg:p-3"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Industry (Optional)
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Tech, Finance, Healthcare"
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-violet-500"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !bullet.trim()}
          className="w-full py-3 px-5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-violet-500/30"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Optimize Bullet <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Error block */}
      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg font-medium">
          {error}
        </p>
      )}

      {/* Suggestions Display */}
      {result && (
        <div className="space-y-5 border-t border-slate-100 pt-5 animate-fade-in">
          <div className="flex gap-2 items-center text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Below are 3 alternate rewrites centered around action verbs, quantified scope, and results:</span>
          </div>

          <div className="space-y-4">
            {result.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-violet-100 transition-all flex flex-col sm:flex-row justify-between items-start gap-4"
              >
                <div className="flex-1 space-y-2">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-violet-100 text-violet-700">
                    {suggestion.impactType}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed italic">
                    "{suggestion.text}"
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-600">Why it scores higher:</span> {suggestion.explanation}
                  </p>
                </div>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopy(suggestion.text, idx)}
                  className="px-3 py-1.5 shrink-0 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg hover:text-slate-800 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
