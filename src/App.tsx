import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Printer,
  Sparkles,
  Lock,
  ArrowRight,
  Plus,
  RefreshCw,
  Eye,
  Sliders,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  XCircle,
  FileSearch
} from "lucide-react";
import { Header } from "./components/Header";
import { ATSGauge } from "./components/ATSGauge";
import { ChecklistGroup } from "./components/ChecklistGroup";
import { JDMatcher } from "./components/JDMatcher";
import { BulletRewriter } from "./components/BulletRewriter";
import { SavedAnalysesList } from "./components/SavedAnalysesList";
import { ResumeImprover } from "./components/ResumeImprover";
import CareerCoachChat from "./components/CareerCoachChat";
import { ResumeAnalysisReport, SavedAnalysis } from "./types";

const LOADING_STEPS = [
  "Structuring document layout hierarchy...",
  "Performing multimodal OCR scan and parsing...",
  "Running ATS parser heuristics matching...",
  "Validating keyword intersections...",
  "Synthesizing customized action-verb optimizations...",
  "Polishing final plain-language reports..."
];

export default function App() {
  // Global application mode configs
  const [plainLanguageMode, setPlainLanguageMode] = useState<boolean>(true);
  
  // History list
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  
  // State for raw file upload
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showTextPaste, setShowTextPaste] = useState<boolean>(false);
  
  // Directly typed resume/job description inputs
  const [resumeText, setResumeText] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>(""); // Label context
  
  // Live Analysis Result
  const [analysis, setAnalysis] = useState<ResumeAnalysisReport | null>(null);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | undefined>(undefined);
  
  // Loading orchestration states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_STEPS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Scrolling view pointer
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_resume_saved_reviews");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load historical reviews", e);
    }
  }, []);

  // Sync historical reports back to localStorage
  const saveHistory = (newHistory: SavedAnalysis[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("ai_resume_saved_reviews", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save reviews", e);
    }
  };

  // Rotating loader messages
  useEffect(() => {
    if (!isLoading) return;
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setLoadingMessage(LOADING_STEPS[step]);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle manual file browse or drag drop
  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file) return;

    // Check sizes
    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg("File is too large (maximum size is 12MB). Please upload a smaller copy.");
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");
    setFileType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        setFileBase64(base64String);
        // Clear pasted text if file is uploaded
        setResumeText("");
      } catch (err) {
        setErrorMsg("Failed to read the file correctly. Try copy-pasting your resume text instead.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Run structured evaluation via node server endpoint
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileBase64 && !resumeText.trim()) {
      setErrorMsg("Please upload a resume file or paste your resume text to begin.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: fileBase64,
          fileType: fileType,
          resumeText: resumeText,
          jobDescription: jobDescription.trim() ? jobDescription : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Evaluation failed. Try again.");
      }

      const report: ResumeAnalysisReport = await response.json();
      setAnalysis(report);

      // Create saved analysis version entry
      const newAnalysisId = `rev-${Date.now()}`;
      const savedObj: SavedAnalysis = {
        id: newAnalysisId,
        fileName: fileName || "Pasted Resume",
        fileSize: fileSize || "Direct Entry",
        overallScore: report.overallScore,
        jobTitle: jobDescription.trim() ? jobTitle || "Target Role" : undefined,
        jobMatchPercentage: report.jobMatch?.matchPercentage,
        analyzedAt: new Date().toISOString(),
        report: report,
      };

      const updatedHistory = [savedObj, ...history];
      saveHistory(updatedHistory);
      setActiveAnalysisId(savedObj.id);

      // Scroll smoothly to report section
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong during evaluation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Select historical report
  const handleSelectHistory = (saved: SavedAnalysis) => {
    setAnalysis(saved.report);
    setActiveAnalysisId(saved.id);
    
    // Set matching input context
    setFileName(saved.fileName);
    setFileSize(saved.fileSize);
    if (saved.jobTitle) {
      setJobTitle(saved.jobTitle);
    }

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Deletion logic (US-17 compliance)
  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((i) => i.id !== id);
    saveHistory(updated);
    if (activeAnalysisId === id) {
      setAnalysis(null);
      setActiveAnalysisId(undefined);
    }
  };

  const handleClearAllHistory = () => {
    if (confirm("Are you sure you want to delete all saved analyses and remove personal data? This cannot be undone.")) {
      saveHistory([]);
      setAnalysis(null);
      setActiveAnalysisId(undefined);
       // Clear inputs
       setFileBase64(null);
       setFileName("");
       setFileSize("");
       setResumeText("");
       setJobDescription("");
    }
  };

  const triggerReset = () => {
     setFileBase64(null);
     setFileName("");
     setFileSize("");
     setResumeText("");
     setJobDescription("");
     setJobTitle("");
     setAnalysis(null);
     setActiveAnalysisId(undefined);
     setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF9FD] flex flex-col font-sans">
      <Header
        plainLanguageMode={plainLanguageMode}
        setPlainLanguageMode={setPlainLanguageMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
        
        {/* UPPER CONSOLE: INPUT PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
          
          {/* Main Action - File Upload Component */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                Upload Resume & Prepare Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Supports PDFs, scanning image files (JPG/PNG), or plain text. High fidelity AI comprehension.
              </p>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-6">
              {!showTextPaste ? (
                /* Drag Drop Box */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    isDragOver
                      ? "border-violet-500 bg-violet-50/50"
                      : fileName
                      ? "border-emerald-300 bg-emerald-50/10"
                      : "border-slate-200 hover:border-violet-300 bg-slate-50/30"
                  }`}
                >
                  <input
                    type="file"
                    id="file-selector animate-pulse"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                  <label
                    htmlFor="file-selector animate-pulse"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                  >
                    <div className={`p-3 rounded-full ${fileName ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}>
                      <Upload className="w-6 h-6 animate-pulse" />
                    </div>
                    {fileName ? (
                      <div className="space-y-1">
                        <span className="block font-bold text-sm text-emerald-800">
                          {fileName}
                        </span>
                        <span className="block text-xs font-semibold text-slate-400">
                          File Ready • {fileSize}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="block font-bold text-sm text-slate-700">
                          Drag and drop your resume here, or choose a file
                        </span>
                        <span className="block text-xs text-slate-400 font-normal">
                          Max size 12MB. Accepts PDF or photo scans.
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                /* Direct Text Paste Input */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Paste Resume Content
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste the plain content of your resume here..."
                    rows={6}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 resize-y"
                    required={showTextPaste}
                  />
                </div>
              )}

              {/* Toggles & Optional Parameters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1 border-t border-b border-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowTextPaste(!showTextPaste);
                    setFileName("");
                    setFileBase64(null);
                    setResumeText("");
                  }}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline cursor-pointer"
                >
                  {showTextPaste ? "← Switch to File Uploader" : "or copy-paste raw text instead"}
                </button>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy Guaranteed • Instant Analysis</span>
                </div>
              </div>

              {/* Job description input field */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Target Job Description Match (Optional)
                  </span>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Position Title (e.g., Lead Recruiter)"
                    className="text-xs px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg max-w-[210px] focus:bg-white"
                  />
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description requirements here to score match resonance, detect missing key phrases, and compile customized tailoring directions..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-violet-500"
                />
              </div>

              {/* Submission CTA Trigger */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading || (!fileBase64 && !resumeText.trim())}
                  className="flex-1 py-3 px-6 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-sm focus:ring-4 focus:ring-violet-500/20"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Run Full evaluation <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                {analysis && (
                  <button
                    type="button"
                    onClick={triggerReset}
                    className="px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Error notifications */}
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 text-rose-800 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Right sidebar: Historial Trace */}
          <div className="space-y-6">
            <SavedAnalysesList
              history={history}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearAllHistory}
              activeId={activeAnalysisId}
            />
            {/* Real-time statistics block */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl p-6 shadow-sm shadow-violet-500/10 space-y-4">
              <div className="text-xl">🏆</div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm tracking-tight">Aiming for 80+ score</h4>
                <p className="text-[11px] text-violet-100/90 leading-relaxed font-normal">
                  Over 75% of resumes get filtered out because of simple errors like including photo graphs, missing core task descriptions, or pasting tasks without metrics! Optimize bullet points directly in the sandbox downstairs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING BOX */}
        {isLoading && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-6 animate-fade-in">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-violet-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-base">Analyzing Experience Assets...</h3>
              <p className="text-xs text-slate-500 font-mono transition-all duration-300">
                {loadingMessage}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              This normally takes 8-12 seconds depending on document parsing structure. Do not close this window.
            </p>
          </div>
        )}

        {/* RESULTS WRAPPER */}
        {analysis && (
          <div ref={resultsRef} className="space-y-8 animate-fade-in print:bg-white print:p-0">
            
            {/* Score Summary Box (Print and visual friendly) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">
              
              {/* Overall Circular Progress */}
              <div className="shrink-0">
                <ATSGauge score={analysis.overallScore} size={150} strokeWidth={14} showCategoryLabel={true} />
              </div>

              {/* Feedbacks summary */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-violet-600">
                      Evaluated Profile Summary
                    </span>
                    <span className="hidden sm:inline-block text-slate-300 font-normal">|</span>
                    <span className="text-xs text-slate-400 font-mono font-medium">
                      Analyzed at {new Date(analysis.analyzedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {analysis.parsedInfo.contact.name || "Candidate Profile"}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-slate-500 font-normal">
                    {analysis.parsedInfo.contact.email && <span>📧 {analysis.parsedInfo.contact.email}</span>}
                    {analysis.parsedInfo.contact.phone && <span>📞 {analysis.parsedInfo.contact.phone}</span>}
                    {analysis.parsedInfo.contact.location && <span>📍 {analysis.parsedInfo.contact.location}</span>}
                    {analysis.parsedInfo.contact.linkedin && (
                      <span className="text-violet-600 hover:underline">🔗 LinkedIn Profile</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100/80 rounded-2xl">
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    <span className="font-bold text-slate-800">Overall Opinion:</span> {analysis.overallFeedback}
                  </p>
                </div>

                {/* PDF export buttons */}
                <div className="flex items-center justify-center md:justify-start gap-3 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="py-2 px-4 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg shadow-2xs hover:shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Print Report / Export PDF</span>
                  </button>
                  {analysis.parsedInfo.sectionsFound && (
                    <div className="hidden sm:flex text-xs py-1.5 px-3 bg-violet-50 border border-violet-100 text-violet-700 rounded-lg gap-1.5 font-medium items-center">
                      🤖 parsed {analysis.parsedInfo.sectionsFound.length} standard sections
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUBSCORS CARD LAYOUTS (4 Pillars) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Formatting Score", indicator: "formatting", desc: "Font patterns, structure spacing" },
                { label: "Keyword Density", indicator: "keywords", desc: "Target buzzwords and jargon issues" },
                { label: "Structural Layout", indicator: "structure", desc: "Chronological formats, layout integrity" },
                { label: "Readability & Verbs", indicator: "readability", desc: "Measurable metrics & action words" }
              ].map((pill) => {
                const breakdown = (analysis as any)[pill.indicator];
                if (!breakdown) return null;

                let colorBorder = "border-emerald-100 bg-emerald-50/10";
                let textScoreColor = "text-emerald-700 bg-emerald-100/50";
                if (breakdown.score < 50) {
                  colorBorder = "border-rose-100 bg-rose-50/10";
                  textScoreColor = "text-rose-700 bg-rose-100/50";
                } else if (breakdown.score < 80) {
                  colorBorder = "border-amber-100 bg-amber-50/10";
                  textScoreColor = "text-amber-700 bg-amber-100/50";
                }

                return (
                  <div
                    key={pill.indicator}
                    className={`p-5 rounded-2xl border ${colorBorder} space-y-3 flex flex-col justify-between`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          {pill.label}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-extrabold rounded ${textScoreColor}`}>
                          {breakdown.score}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal">{pill.desc}</p>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {breakdown.feedback}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* JOB DESCRIPTION MATCH PANEL (IF PROVIDED) */}
            {analysis.jobMatch && (
              <div className="print:break-inside-avoid">
                <JDMatcher jobMatch={analysis.jobMatch} role={jobTitle || "the position specified"} />
              </div>
            )}

            {/* CHECKLIST ENGINE */}
            <div className="print:break-inside-avoid shadow-xs bg-white rounded-3xl p-6 sm:p-8 border border-slate-100/70">
              <ChecklistGroup items={analysis.checklist} plainLanguageMode={plainLanguageMode} />
            </div>

            {/* COMPACT SUGGESTED RESUME INLINE SUMMARY FEEDBACKS */}
            {analysis.parsedInfo.summaryFeedback && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-2 print:break-inside-avoid">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  AI Professional Summary Review
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{analysis.parsedInfo.summaryFeedback}"
                </p>
              </div>
            )}

            {/* INTEGRATED FULL HIGH-ATS RESUME AUTO-GENERATOR */}
            <div className="print:hidden">
              <ResumeImprover
                fileBase64={fileBase64}
                fileType={fileType}
                resumeText={resumeText}
                jobDescription={jobDescription}
                originalScore={analysis.overallScore}
                onApplyNewResumeText={(text) => {
                  setResumeText(text);
                  setShowTextPaste(true);
                  setFileName("");
                  setFileBase64(null);
                }}
              />
            </div>
          </div>
        )}

        {/* BULLET POINT REWRITER SANDBOX (PERMANENTLY SEEDED ACCESSIBLE SECTION) */}
        <div className="print:hidden">
          <BulletRewriter />
        </div>

        {/* VISUAL FAQs FOR DEEPER USER CONTEXT */}
        <div className="print:hidden bg-white rounded-2xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
              💡 Demystifying Applicant Tracking Systems (ATS)
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Get familiar with the technical criteria screeners use to rate resumes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800">What is an &ldquo;ATS parsing penalty&rdquo;?</h4>
              <p className="text-slate-500 font-normal leading-relaxed">
                Many modern ATS scanners struggle with text inside graphics or text boxes. By using multi-columns, images, or complicated charts, your content might get parsed as illegible gibberish, giving you a false automatic failure.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800">Why are numbers/metrics so important on a resume?</h4>
              <p className="text-slate-500 font-normal leading-relaxed">
                Computers and professional recruiters scan for scope: of what size? how much? how often? Translating tasks into quantified metrics (percentages, revenues saved, team scale, hours cut) immediately raises your credibility and score.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800">Does a higher ATS score guarantee an interview?</h4>
              <p className="text-slate-500 font-normal leading-relaxed">
                An ATS score ensures parseability and keyword alignment, but the human recruiter ultimately decides. A balanced, readable resume containing clear metrics and standard layout patterns ensures high success on both gates.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800">Can photocopied or scanned resumes be parsed?</h4>
              <p className="text-slate-500 font-normal leading-relaxed">
                Yes! Thanks to Gemini's highly advanced layout-aware vision comprehension models, photocopied or scanned image files undergo full layout processing, preserving alignment metrics and parsing text seamlessly.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-50 border-t border-slate-100 mt-20 py-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs text-slate-400 font-normal">
            AI Resume Analyzer • Crafted using modern React, Tailwind, and full-stack Google Gemini 3.5 Models.
          </p>
          <p className="text-[10px] text-slate-300">
            Secure processing • Data stored in browser memory only • Delete anytime
          </p>
        </div>
      </footer>

      {/* Floating Interactive AI Career Coach Counseling Chatbot */}
      <CareerCoachChat
        resumeText={resumeText}
        jobDescription={jobDescription}
        jobTitle={jobTitle}
        overallScore={analysis?.overallScore}
      />
    </div>
  );
}
