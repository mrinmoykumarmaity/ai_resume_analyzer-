import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, RefreshCw, Briefcase, Award, GraduationCap, CornerDownLeft, HelpCircle, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface CareerCoachChatProps {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  overallScore?: number;
}

export default function CareerCoachChat({
  resumeText,
  jobDescription,
  jobTitle,
  overallScore,
}: CareerCoachChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hi there! I am **ATS Career Pro**, your personal AI career advisor. 🚀\n\nI can analyze your resume gaps, suggest high-impact metrics to replace generic bullet points, recommend hidden industry keywords, or help you practice target interview questions!\n\n**How can I help you today?**",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend) return;

    if (!customText) {
      setInputValue("");
    }
    setErrorMsg("");

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Re-map messages history as expected by server POST
      const historyPayload = [...messages, userMessage].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat-counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          resumeContext: resumeText,
          jobDescription: jobDescription,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to compile counselor response. The model may be busy.");
      }

      const data = await res.json();
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        text: data.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong. Let's try again in a moment!");
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      setMessages([
        {
          id: "welcome-reset",
          role: "model",
          text: "Let's start fresh! Ask me any resume-writing, key-phrase, or interview questions, and we'll refine your profile in real-time.",
          timestamp: new Date(),
        },
      ]);
      setErrorMsg("");
    }
  };

  const starterPills = [
    { label: "Check Keyword Gaps 📈", prompt: "Can you analyze my resume against the target job description and list the top 5 missing technical keywords or tools?" },
    { label: "Give Pitch Suggestions 🚀", prompt: "How can I rewrite my professional summary into a high-impact 3-line pitch for this specific role?" },
    { label: "Simulate Mock Interview 🧠", prompt: "I want to practice! Generate 3 standard behavioral interview questions for this job and explain how I should link my resume accomplishments to answer them." },
    { label: "Highlight Action Verbs 💡", prompt: "My resume lists too many passive tasks. Can you suggest 10 strong, quantified action verbs for my field?" }
  ];

  // Quick helper to render custom simple markdown formatting (bold, lists) cleanly without external imports
  const formatText = (txt: string) => {
    const lines = txt.split("\n");
    return lines.map((line, key) => {
      let content = line;
      
      // Inline bold: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIdx = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIdx) {
          parts.push(content.substring(lastIdx, match.index));
        }
        parts.push(<strong key={`b-${match.index}`} className="font-extrabold text-slate-950 dark:text-white">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < content.length) {
        parts.push(content.substring(lastIdx));
      }

      const finalInline = parts.length > 0 ? parts : content;

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={key} className="ml-4 list-disc pl-1 text-[11px] sm:text-xs text-slate-700 leading-relaxed mb-1">
            {finalInline}
          </li>
        );
      }
      
      if (line.trim() === "") {
        return <div key={key} className="h-2" />;
      }

      return (
        <p key={key} className="text-[11px] sm:text-xs text-slate-700 leading-relaxed mb-1.5 font-normal">
          {finalInline}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Trigger Badge */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <motion.button
          id="btn-trigger-chat-counselor"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all ${
            isOpen 
              ? "bg-slate-800 text-white hover:bg-slate-900" 
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </>
          )}
        </motion.button>
      </div>

      {/* Floating Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-counselor-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[78vh] sm:h-[580px] bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 overflow-hidden flex flex-col font-sans print:hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white shrink-0 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider">ATS Career Pro</h3>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-[10px] text-violet-100/90 font-medium font-mono">Expert Coach Match Ready</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Clear history"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-violet-150 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-violet-150 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resume / JD Context status strip */}
            <div className="bg-slate-50 border-b border-slate-150/40 px-4 py-2 flex items-center justify-between text-[10px] text-slate-500 shrink-0 select-none">
              <div className="flex items-center gap-1">
                <Briefcase className={`w-3 h-3 ${jobDescription ? "text-indigo-500" : "text-slate-300"}`} />
                <span>Job Requirements: <strong className={jobDescription ? "text-slate-700 font-bold" : "font-normal text-slate-400"}>{jobDescription ? (jobTitle || "Present") : "None"}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Award className={`w-3 h-3 ${resumeText ? "text-emerald-500" : "text-slate-300"}`} />
                <span>Context: <strong className={resumeText ? "text-slate-700 font-bold" : "font-normal text-slate-400"}>{resumeText ? (overallScore ? `Analyzed (${overallScore} pts)` : "Resume Loaded") : "Paste Required"}</strong></span>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none"
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {/* Render Formatted Simple Markdown lines */}
                    {m.role === "user" ? (
                      <p className="font-normal font-sans">{m.text}</p>
                    ) : (
                      <div className="space-y-0.5 font-sans">
                        {formatText(m.text)}
                      </div>
                    )}
                    <span
                      className={`text-[8px] mt-1 block text-right font-normal ${
                        m.role === "user" ? "text-violet-200/90" : "text-slate-400"
                      }`}
                    >
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Loader Typing Bubble */}
              {isTyping && (
                <div className="flex justify-start items-center gap-2">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 shadow-xs">
                    <span className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 bg-violet-600 rounded-full animate-bounce" />
                    <span className="ml-1 text-[9px] text-slate-400 font-mono font-medium">ATS Career Pro compiling advice...</span>
                  </div>
                </div>
              )}

              {/* Error messages */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] rounded-xl flex gap-1.5 font-medium">
                  <span>⚠️ {errorMsg}</span>
                </div>
              )}

              {/* Suggestions Quick Buttons */}
              {messages.length === 1 && !isTyping && (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-2">Suggested Starting Questions:</span>
                  <div className="flex flex-col gap-1.5">
                    {starterPills.map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(pill.prompt)}
                        className="w-full text-left p-2.5 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl text-[11px] text-slate-700 hover:text-slate-900 transition-colors font-medium flex items-center justify-between group cursor-pointer shadow-2xs"
                      >
                        <span>{pill.label}</span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Quick Context Alerts if empty */}
            {!resumeText && messages.length > 2 && (
              <div className="bg-amber-50/50 border-t border-amber-100 px-4 py-1.5 flex items-center justify-between text-[10px] text-amber-700 font-medium">
                <span>💡 Paste or upload a resume to unlock hyper-specific advice!</span>
              </div>
            )}

            {/* Input Footer Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-100 shrink-0"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask advisor (e.g. 'How can I rewrite x?')..."
                  className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 rounded-full px-4 py-2.5 text-xs outline-hidden font-normal"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={isTyping || !inputValue.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between px-1.5 mt-2 text-[9px] text-slate-400 select-none">
                <span className="flex items-center gap-1"><HelpCircle className="w-2.5 h-2.5" /> Answers powered by Gemini 3.5</span>
                <span>Press Enter to send</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
