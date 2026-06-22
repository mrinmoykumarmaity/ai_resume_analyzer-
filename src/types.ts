export interface ScoreBreakdown {
  score: number; // 0 - 100
  feedback: string;
  status: 'success' | 'warning' | 'danger';
}

export interface ImprovementCheckListItem {
  id: string;
  title: string;
  category: 'ats_essentials' | 'resume_sections' | 'content_quality' | 'job_tailoring' | 'recruiter_red_flags' | 'bias_discrimination' | 'seniority_impact';
  status: 'passed' | 'warning' | 'danger';
  description: string;
  beforeAfter?: {
    before: string;
    after: string;
    explanation: string;
  };
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
}

export interface ParsedResumeInfo {
  contact: ContactInfo;
  sectionsFound: string[];
  summaryFeedback: string;
}

export interface JobMatchResult {
  matchPercentage: number; // 0 - 100
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  tailoringTips: string[];
}

export interface ResumeAnalysisReport {
  overallScore: number; // 0 - 100
  overallFeedback: string;
  parsedInfo: ParsedResumeInfo;
  formatting: ScoreBreakdown;
  keywords: ScoreBreakdown;
  structure: ScoreBreakdown;
  readability: ScoreBreakdown;
  checklist: ImprovementCheckListItem[];
  jobMatch?: JobMatchResult;
  analyzedAt: string;
}

export interface BulletRewriteResult {
  original: string;
  suggestions: Array<{
    text: string;
    impactType: string; // e.g. "Action-oriented", "Quantified Metrics", "Concise Summary"
    explanation: string;
  }>;
}

export interface SavedAnalysis {
  id: string;
  fileName: string;
  fileSize: string;
  overallScore: number;
  jobTitle?: string;
  jobMatchPercentage?: number;
  analyzedAt: string;
  report: ResumeAnalysisReport;
}

export interface OptimizedResumeResult {
  optimizedText: string;
  explanationOfChanges: string[];
  improvedAtsScoreEstimate: number;
}

