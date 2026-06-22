import React, { useState } from "react";
import { Sparkles, Copy, Check, Download, AlertCircle, RefreshCw, Star, Flame, Eye, ThumbsUp, ArrowRight, Printer, X, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { OptimizedResumeResult } from "../types";

interface ResumeImproverProps {
  fileBase64: string | null;
  fileType: string;
  resumeText: string;
  jobDescription: string;
  originalScore?: number;
  onApplyNewResumeText: (text: string) => void;
}

// Simple and highly accurate robust markdown-to-html list parser
function parseResumePreview(text: string, isCompact: boolean = false) {
  const lines = text.split("\n");
  let listItems: string[] = [];
  const elements: React.ReactNode[] = [];
  
  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className={`list-disc pl-5 font-sans text-slate-800 ${isCompact ? "mb-1.5 space-y-0.5" : "mb-3.5 space-y-1"}`}>
          {listItems.map((item, idx) => (
            <li key={idx} className={`leading-relaxed ${isCompact ? "text-[10px] md:text-xs" : "text-xs md:text-[13px]"}`}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      flushList(index);
      elements.push(
        <h1 key={index} className={`font-bold text-slate-900 border-b border-slate-400 pb-1 font-sans tracking-tight uppercase ${isCompact ? "text-sm md:text-base mt-2.5 mb-1.5" : "text-xl md:text-2xl mt-5 mb-3"}`}>
          {trimmed.substring(2)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList(index);
      elements.push(
        <h2 key={index} className={`font-bold text-slate-900 border-b border-slate-300 pb-0.5 font-sans tracking-tight ${isCompact ? "text-[11px] md:text-xs mt-2 mb-1" : "text-base md:text-lg mt-4 mb-2"}`}>
          {trimmed.substring(3)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList(index);
      elements.push(
        <h3 key={index} className={`font-bold text-slate-800 font-sans ${isCompact ? "text-[10px] md:text-[11px] mt-1.5 mb-0.5" : "text-[13px] mt-3.5 mb-1"}`}>
          {trimmed.substring(4)}
        </h3>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.substring(2);
      listItems.push(content);
    } else if (trimmed === "") {
      flushList(index);
    } else {
      flushList(index);
      elements.push(
        <p key={index} className={`text-slate-800 leading-relaxed font-sans ${isCompact ? "text-[10px] md:text-xs mb-1" : "text-xs md:text-[13px] mb-2"}`}>
          {trimmed}
        </p>
      );
    }
  });

  flushList(lines.length);
  return elements;
}

export function ResumeImprover({
  fileBase64,
  fileType,
  resumeText,
  jobDescription,
  originalScore = 65,
  onApplyNewResumeText,
}: ResumeImproverProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizedResumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [forceSinglePage, setForceSinglePage] = useState(true);

  const steps = [
    "Compiling original profile sections...",
    "Injecting robust STAR-based performance metrics...",
    "Structuring layout headers to avoid parsing blockers...",
    "Aligning with target job description keywords...",
    "Creating your peak-performance ATS draft..."
  ];

  const handleOptimize = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadStep(0);

    // Rotate messages
    const stepTimer = setInterval(() => {
      setLoadStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    try {
      const response = await fetch("/api/auto-optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: fileBase64,
          fileType: fileType,
          resumeText: resumeText,
          jobDescription: jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to upgrade resume at this time. Please check your inputs.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to compile your high-performance resume.");
    } finally {
      clearInterval(stepTimer);
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.optimizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.optimizedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Approved_ATS_Optimized_Resume.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter"
      });

      // Page dimensions
      // Use 0.5 in (36pt) margins if forcing single page, or 0.75 in (54pt) for standard layout.
      const margin = forceSinglePage ? 36 : 54; 
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxLineWidth = pageWidth - margin * 2;
      
      const rawLines = result.optimizedText.split("\n");

      // We fit dynamically if forcing single page
      let fSize = 10;
      let lineSpacing = 14;
      let paragraphSpacing = 5;
      let h1Size = 14;
      let h2Size = 11;
      let h3Size = 10;
      let dividerSpacingBefore = 9;
      let dividerSpacingAfter = 11;

      if (forceSinglePage) {
        // Let's run simulation to find optimal sizing
        for (let size = 10.5; size >= 6.5; size -= 0.2) {
          fSize = size;
          lineSpacing = size + 2.5;
          paragraphSpacing = Math.max(1, size - 7.5);
          h1Size = size + 3.0;
          h2Size = size + 1.2;
          h3Size = size + 0.5;
          dividerSpacingBefore = Math.max(3, size - 2.5);
          dividerSpacingAfter = Math.max(3, size - 1.5);

          let currentY = margin + 10;
          let tempDoc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

          rawLines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("# ")) {
              currentY += dividerSpacingBefore;
              currentY += h1Size + 4;
              currentY += dividerSpacingAfter;
            } else if (trimmed.startsWith("## ")) {
              currentY += dividerSpacingBefore - 1;
              currentY += h2Size + 4;
              currentY += dividerSpacingAfter - 1;
            } else if (trimmed.startsWith("### ")) {
              currentY += h3Size + 4;
            } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              const text = "• " + trimmed.substring(2);
              tempDoc.setFontSize(fSize);
              const splitLines = tempDoc.splitTextToSize(text, maxLineWidth - 10);
              currentY += splitLines.length * lineSpacing;
            } else if (trimmed === "") {
              currentY += paragraphSpacing;
            } else {
              tempDoc.setFontSize(fSize);
              const splitLines = tempDoc.splitTextToSize(trimmed, maxLineWidth);
              currentY += splitLines.length * lineSpacing;
            }
          });

          if (currentY <= pageHeight - margin) {
            break; // Sizing was found that perfectly fits inside 1 page!
          }
        }
      }

      // Draw PDF contents
      let cursorY = margin + 10;
      doc.setFont("Helvetica", "normal");
      
      rawLines.forEach((line) => {
        const trimmed = line.trim();
        
        // Handle markdown category divisions
        if (trimmed.startsWith("# ")) {
          const text = trimmed.substring(2);
          cursorY += dividerSpacingBefore;
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(h1Size);
          doc.setTextColor(15, 23, 42); // slate-900 leading
          
          if (!forceSinglePage && cursorY + h1Size > pageHeight - margin) {
            doc.addPage();
            cursorY = margin + 10;
          }
          
          doc.text(text, margin, cursorY);
          cursorY += 4;
          // Divider line representation
          doc.setDrawColor(100, 116, 139); // slate-500
          doc.setLineWidth(1);
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
          cursorY += dividerSpacingAfter;
          
        } else if (trimmed.startsWith("## ")) {
          const text = trimmed.substring(3);
          cursorY += dividerSpacingBefore - 1;
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(h2Size);
          doc.setTextColor(30, 41, 59); // slate-800
          
          if (!forceSinglePage && cursorY + h2Size > pageHeight - margin) {
            doc.addPage();
            cursorY = margin + 10;
          }
          
          doc.text(text, margin, cursorY);
          cursorY += 3;
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.75);
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
          cursorY += dividerSpacingAfter - 1;
          
        } else if (trimmed.startsWith("### ")) {
          const text = trimmed.substring(4);
          cursorY += 4;
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(h3Size);
          doc.setTextColor(51, 65, 85); // slate-750
          
          if (!forceSinglePage && cursorY + h3Size > pageHeight - margin) {
            doc.addPage();
            cursorY = margin + 10;
          }
          
          doc.text(text, margin, cursorY);
          cursorY += h3Size;
          
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const text = "• " + trimmed.substring(2);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(fSize);
          doc.setTextColor(71, 85, 105); // slate-600
          
          const bulletWidth = maxLineWidth - 10;
          const splitLines = doc.splitTextToSize(text, bulletWidth);
          
          splitLines.forEach((splitLine: string, idx: number) => {
            if (!forceSinglePage && cursorY + fSize > pageHeight - margin) {
              doc.addPage();
              cursorY = margin + 10;
            }
            const drawX = idx === 0 ? margin : margin + 10;
            doc.text(splitLine, drawX, cursorY);
            cursorY += lineSpacing;
          });
          
        } else if (trimmed === "") {
          cursorY += paragraphSpacing;
        } else {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(fSize);
          doc.setTextColor(51, 65, 85); // slate-700
          
          const splitLines = doc.splitTextToSize(trimmed, maxLineWidth);
          splitLines.forEach((splitLine: string) => {
            if (!forceSinglePage && cursorY + fSize > pageHeight - margin) {
              doc.addPage();
              cursorY = margin + 10;
            }
            doc.text(splitLine, margin, cursorY);
            cursorY += lineSpacing;
          });
        }
      });

      doc.save("Approved_ATS_Optimized_Resume.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-violet-100 text-violet-700 tracking-wider rounded-full inline-block">
            Elite AI Engine Included
          </span>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5.5 h-5.5 text-orange-500 fill-orange-100" />
            1-Click High-ATS Resume Auto-Generator
          </h2>
          <p className="text-xs text-slate-400">
            Automatically rewrites your entire resume text, adds STAR-method metrics, uses robust verbs, and injects missing keyword targets.
          </p>
        </div>

        {!result && !isLoading && (
          <button
            type="button"
            onClick={handleOptimize}
            className="py-3 px-6 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0 transition-transform hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>Auto-Optimize My Resume</span>
          </button>
        )}
      </div>

      {/* Loading Block with Progress message */}
      {isLoading && (
        <div className="p-8 border border-dashed border-violet-100 bg-violet-50/20 rounded-2xl text-center space-y-4 animate-fade-in">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-3 border-violet-100 rounded-full" />
            <div className="absolute inset-0 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Upgrading Experience Assets...</h4>
            <p className="text-xs text-slate-500 font-mono italic">
              ↳ {steps[loadStep]}
            </p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 text-rose-800 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Result presentation panel */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 border-t border-slate-100 pt-6 animate-fade-in">
          
          {/* Left panel: applied enhancements checklist & stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Surge metrics block */}
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-sm space-y-3.5">
              <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                Score Projected Impact
              </span>
              <div className="flex items-center gap-4">
                <div className="text-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="block text-xs uppercase tracking-wide text-slate-300">Original</span>
                  <span className="text-lg font-extrabold text-rose-300">{originalScore}</span>
                </div>
                <div className="text-slate-400 font-mono text-sm">→</div>
                <div className="text-center bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <span className="block text-xs uppercase tracking-wide text-emerald-300">New Score</span>
                  <span className="text-lg font-extrabold text-emerald-400">+{result.improvedAtsScoreEstimate}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
                By standardizing heading grids, translating passive tasks to quantitative outputs, and removing photo restrictions, this resume complies seamlessly with elite corporate filters.
              </p>
            </div>

            {/* List of optimizations summary */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-violet-500" /> Applied Enhancements ({result.explanationOfChanges.length})
              </h4>
              <ul className="space-y-2">
                {result.explanationOfChanges.map((change, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600 font-normal leading-relaxed">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive check back option */}
            <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl space-y-3">
              <h5 className="text-[11px] font-bold text-violet-800 uppercase tracking-widest flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-violet-700" /> Test Your Score Jump Now!
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                Ready to see your new ATS score live on the main dashboard metrics? This button copy-pastes the improved resume text directly back into the plain text uploader so you can run a fresh full analysis scan.
              </p>
              <button
                type="button"
                onClick={() => {
                  onApplyNewResumeText(result.optimizedText);
                  // Scroll smoothly to top
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
                className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Paste Back and Verify
              </button>
            </div>
          </div>

          {/* Right panel: raw markdown text-editor box */}
          <div className="lg:col-span-3 space-y-3 flex flex-col h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 shadow-3xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Approved ATS Resume Draft
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Page Force Toggle Option */}
                <label className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 hover:border-violet-300 rounded-lg px-2.5 transition-all text-[11px] font-bold text-slate-700 cursor-pointer shadow-3xs select-none">
                  <input
                    type="checkbox"
                    checked={forceSinglePage}
                    onChange={(e) => setForceSinglePage(e.target.checked)}
                    className="w-3.5 h-3.5 accent-violet-600 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <span>Force 1-Page Layout</span>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-extrabold uppercase tracking-wide">Auto-Fit</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowPrintPreview(true)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Preview & Export</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>TXT</span>
                </button>
              </div>
            </div>

            <div className="relative flex-1">
              <textarea
                value={result.optimizedText}
                readOnly
                rows={16}
                className="w-full p-4 font-mono text-[11px] leading-relaxed bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl resize-y focus:outline-hidden"
              />
              <div className="absolute right-3 bottom-4 pointer-events-none text-[10px] text-slate-500 font-mono uppercase bg-slate-800/80 px-2 py-0.5 rounded">
                Markdown Ready
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 italic">
              Tip: Click the <strong>Preview & Export PDF</strong> button above to download or print your customized resume in a beautiful document layout!
            </p>
          </div>

        </div>
      )}

      {/* PDF PRINT PREVIEW OVERLAY MODAL */}
      {showPrintPreview && result && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 animate-fade-in print:p-0 print:bg-white print:absolute print:inset-0">
          
          {/* Target print CSS rule sheet */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide every single element in the viewport */
              body * {
                visibility: hidden !important;
              }
              /* Reveal strictly and format only the paper canvas target */
              #resume-printable-pdf, #resume-printable-pdf * {
                visibility: visible !important;
              }
              #resume-printable-pdf {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          `}} />

          <div className="bg-slate-900/40 border border-slate-850 w-full max-w-4xl h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl print:w-full print:h-auto print:shadow-none print:rounded-none">
            
            {/* Header controls pane */}
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/20 text-violet-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">PDF Export Template</h3>
                  <p className="text-[10px] text-slate-400 leading-none">Designed to pass corporate ATS screens cleanly</p>
                </div>
              </div>

              {/* Force 1-Page inside modal */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-800 border border-slate-700/60 rounded-lg px-2.5 shadow-2xs select-none">
                <input
                  id="modal-toggle-force-single-page"
                  type="checkbox"
                  checked={forceSinglePage}
                  onChange={(e) => setForceSinglePage(e.target.checked)}
                  className="w-3.5 h-3.5 accent-violet-500 rounded text-violet-500 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="modal-toggle-force-single-page" className="text-[11px] font-bold text-slate-300 cursor-pointer flex items-center gap-1">
                  <span>Force 1-Page Layout (Auto-Fit)</span>
                  <span className="text-[7.5px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/10 px-1 rounded font-extrabold uppercase tracking-wide">Active</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-[1.01]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Direct PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-[1.01] print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Browser Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Resume Letter Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950/20 print:p-0 print:overflow-visible print:bg-white flex justify-center">
              
              <div 
                id="resume-printable-pdf"
                className={`w-full max-w-[210mm] bg-white text-slate-900 font-sans shadow-md rounded-lg border border-slate-100 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none ${forceSinglePage ? "p-6 md:p-8 min-h-[297mm] h-fit" : "p-8 md:p-12 min-h-[297mm] h-fit"}`}
              >
                {/* Dynamically parsed letter sections */}
                <div className={forceSinglePage ? "space-y-1.5 text-left" : "space-y-4 text-left"}>
                  {parseResumePreview(result.optimizedText, forceSinglePage)}
                </div>
              </div>

            </div>

            {/* Mobile Footer controller */}
            <div className="bg-slate-900 p-3.5 text-center border-t border-slate-800 text-[11px] text-slate-400 print:hidden flex justify-between px-6">
              <span>💡 Tip: Select <strong>"Save as PDF"</strong> as your Destination printer.</span>
              <button 
                type="button" 
                onClick={() => setShowPrintPreview(false)}
                className="font-bold text-violet-400 hover:text-violet-300 cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
