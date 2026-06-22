import { useEffect, useState } from "react";

interface ATSGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showCategoryLabel?: boolean;
}

export function ATSGauge({
  score,
  size = 140,
  strokeWidth = 12,
  label,
  showCategoryLabel = true,
}: ATSGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the score from 0 to target using requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 800; // ms for a beautiful, smooth sweep effect

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      
      const currentScore = Math.round(easeProgress * (score || 0));
      setAnimatedScore(currentScore);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Tier Color Helpers
  let strokeColor = "#10b981"; // default emerald-500
  let colorClass = "stroke-emerald-500 text-emerald-600";
  let bgFillClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let categoryText = "Strong";

  if (score < 50) {
    strokeColor = "#f43f5e"; // rose-500
    colorClass = "stroke-rose-500 text-rose-600";
    bgFillClass = "bg-rose-50 text-rose-800 border-rose-200";
    categoryText = "At Risk";
  } else if (score < 80) {
    strokeColor = "#f59e0b"; // amber-500
    colorClass = "stroke-amber-500 text-amber-600";
    bgFillClass = "bg-amber-50 text-amber-800 border-amber-200";
    categoryText = "Needs Work";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Track Circle */}
        <svg 
          className="w-full h-full transform -rotate-90 overflow-visible" 
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9" // Solid slate-100 placeholder track
            strokeWidth={strokeWidth}
          />
          {/* Animated Overlay Color Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-75 ease-out"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight text-slate-800">
            {animatedScore}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            ATS Score
          </span>
        </div>
      </div>

      {label && (
        <span className="mt-3 text-sm font-semibold text-slate-700 text-center">
          {label}
        </span>
      )}

      {showCategoryLabel && (
        <div className={`mt-2 px-3 py-1 text-xs font-bold rounded-full border ${bgFillClass}`}>
          {categoryText}
        </div>
      )}
    </div>
  );
}
