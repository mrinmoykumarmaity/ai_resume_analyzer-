import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing of base64 payloads (files are uploaded as base64 strings)
app.use(express.json({ limit: "25mb" }));

// Initialize the Google GenAI SDK (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for calling Gemini with retry and exponential backoff on transient errors (503/429/UNAVAILABLE)
async function callGeminiWithRetry(apiFn: () => Promise<any>, maxRetries = 3) {
  let attempt = 0;
  while (true) {
    try {
      return await apiFn();
    } catch (error: any) {
      attempt++;
      const errorMsgText = String(error?.message || "");
      const errorStatus = String(error?.status || "");
      
      const isTransient = 
        errorStatus.includes("UNAVAILABLE") ||
        errorStatus.includes("503") ||
        errorStatus.includes("429") ||
        errorMsgText.includes("503") ||
        errorMsgText.includes("429") ||
        errorMsgText.includes("busy") ||
        errorMsgText.includes("demand") ||
        errorMsgText.includes("temporary");

      if (isTransient && attempt <= maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`Gemini API busy/unavailable. Retry attempt ${attempt}/${maxRetries} in ${delay.toFixed(0)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// JSON Schema helper for checklists
const checklistItemSchema = {
  type: Type.OBJECT,
  description: "A check result representing details about a particular resume guideline.",
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    category: {
      type: Type.STRING,
      description: "Must be one of: ats_essentials, resume_sections, content_quality, job_tailoring, recruiter_red_flags, bias_discrimination, seniority_impact",
    },
    status: {
      type: Type.STRING,
      description: "Must be one of: passed, warning, danger",
    },
    description: { type: Type.STRING },
    beforeAfter: {
      type: Type.OBJECT,
      description: "A critical before-and-after example with realistic changes applying the specific check. Provide at least one for warnings/danger checks.",
      properties: {
        before: { type: Type.STRING },
        after: { type: Type.STRING },
        explanation: { type: Type.STRING },
      },
      required: ["before", "after", "explanation"],
    },
  },
  required: ["id", "title", "category", "status", "description"],
};

// JSON Schema for full analysis report
const resumeReportSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER },
    overallFeedback: { type: Type.STRING, description: "Plain language overall opinion of the resume." },
    parsedInfo: {
      type: Type.OBJECT,
      properties: {
        contact: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            location: { type: Type.STRING },
          }
        },
        sectionsFound: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        summaryFeedback: { type: Type.STRING }
      },
      required: ["contact", "sectionsFound", "summaryFeedback"]
    },
    formatting: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        feedback: { type: Type.STRING },
        status: { type: Type.STRING }
      },
      required: ["score", "feedback", "status"]
    },
    keywords: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        feedback: { type: Type.STRING },
        status: { type: Type.STRING }
      },
      required: ["score", "feedback", "status"]
    },
    structure: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        feedback: { type: Type.STRING },
        status: { type: Type.STRING }
      },
      required: ["score", "feedback", "status"]
    },
    readability: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        feedback: { type: Type.STRING },
        status: { type: Type.STRING }
      },
      required: ["score", "feedback", "status"]
    },
    checklist: {
      type: Type.ARRAY,
      items: checklistItemSchema
    },
    jobMatch: {
      type: Type.OBJECT,
      description: "Only filled if a job description was provided.",
      properties: {
        matchPercentage: { type: Type.INTEGER },
        matchedSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        missingSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        explanation: { type: Type.STRING },
        tailoringTips: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["matchPercentage", "matchedSkills", "missingSkills", "explanation", "tailoringTips"]
    }
  },
  required: [
    "overallScore",
    "overallFeedback",
    "parsedInfo",
    "formatting",
    "keywords",
    "structure",
    "readability",
    "checklist"
  ]
};

// API Endpoint for Analyzing Resume
app.post("/api/analyze", async (req, res) => {
  try {
    const { fileData, fileType, resumeText, jobDescription } = req.body;

    if (!fileData && !resumeText) {
       res.status(400).json({ error: "Missing resume details. Provide file upload or plain text." });
       return;
    }

    let contentsParts: any[] = [];

    // System prompt instruction instructing the model to act as a gold-standard ATS compiler and professional recruiter
    const systemInstruction = `You are a professional technical and non-technical layout-aware resume reviewer and recruiter.
Your goal is to parse the resume carefully (from PDF, image, or text), score it like an ATS system (0-100), and build a highly structured, objective analysis.

Focus on:
1. Contact Details & Sections
2. Detailed Subscores: Formatting (font consistency, spacing), Keywords (buzzword-stuffing vs relevant skills), Structure (Standard reverse chronological layout, clean lists), Readability (Clear metrics, strong action verbs, no generic blocks).
3. Plain-language, actionable checklist items under the following categories:
   - ats_essentials (standard headers, parseability)
   - resume_sections (Summary, Experience, Education, Skills, Projects)
   - content_quality (Weak action verbs, cliché lines, grammar, over-generalizations)
   - job_tailoring (Alignment, bullet mapping, match results)
   - recruiter_red_flags (Extreme formatting, photos, long blocks of text, unclear roles)
   - bias_discrimination (Personal data like age, photo, marital status, full address)
   - seniority_impact (Lack of quantitative results, metrics, growth paths shown)
   
For each item, specify a status: 'passed' (green/checked), 'warning' (amber), or 'danger' (red).
Provide at least one very robust 'beforeAfter' example for failures (warning/danger checks), displaying how to rewrite a bullet point to satisfy the recommendation (add metrics, action verbs, scope).

If a job description is provided, compare the resume text/file contents to the job description exhaustively. Outline direct matched skills, missing skills, and detailed bullet-by-bullet tailoring tips in 'jobMatch'.

Do NOT refer to technical json codes in feedback. Keep the text human, encouraging, but highly rigorous. Ensure all scores correspond perfectly.`;

    if (fileData && fileType) {
      contentsParts.push({
        inlineData: {
          data: fileData,
          mimeType: fileType,
        },
      });
    }

    if (resumeText) {
      contentsParts.push({
        text: `Plain text backup/resume content:\n${resumeText}`,
      });
    }

    if (jobDescription) {
      contentsParts.push({
        text: `Target Job Description to match against:\n${jobDescription}`,
      });
    }

    contentsParts.push({
      text: "Analyze the uploaded resume, fill in all contact details, compute subscores and the overall ATS score, and curate the prioritized checklist. If a job description is provided, generate the match results inside the jobMatch field.",
    });

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsParts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: resumeReportSchema,
          temperature: 0.2, // Keep it relatively consistent
        },
      })
    );

    const reportText = response.text;
    if (!reportText) {
      throw new Error("No response text returned by Gemini GenAI");
    }

    const reportJson = JSON.parse(reportText.trim());
    reportJson.analyzedAt = new Date().toISOString();

    res.json(reportJson);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    let friendlyMessage = error?.message || "Failed to analyze resume";
    if (friendlyMessage.includes("demand") || friendlyMessage.includes("503") || friendlyMessage.includes("UNAVAILABLE")) {
      friendlyMessage = "The AI score engine is currently experiencing a peak demand spike. Spikes are temporary—please try clicking 'Run Full evaluation' again in a few seconds.";
    }
    res.status(500).json({ error: friendlyMessage });
  }
});

// API Endpoint for Bullet Point Rewriter
app.post("/api/rewrite-bullet", async (req, res) => {
  try {
    const { bullet, role, industry } = req.body;

    if (!bullet) {
       res.status(400).json({ error: "Missing bullet point text to rewrite." });
       return;
    }

    const systemInstruction = `You are an expert resume writer and career coach.
You take a weak or average resume bullet point and turn it into three rich, high-impact bullet points using the STAR method (Situation, Task, Action, Result) with strong action verbs and quantified impact metrics.

Generate exactly 3 alternate suggestions. Label their impact types (e.g., 'Action-oriented', 'Result & Metrics', 'Scale & Complexity') and write high-level explanations.`;

    const prompt = `Bullet to rewrite: "${bullet}"\nTarget Role: "${role || "General"}"\nTarget Industry: "${industry || "General"}"`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    impactType: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["text", "impactType", "explanation"],
                },
              },
            },
            required: ["original", "suggestions"],
          },
          temperature: 0.7,
        },
      })
    );

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from bullet point rewriter");
    }

    const resultJson = JSON.parse(resultText.trim());
    res.json(resultJson);
  } catch (error: any) {
    console.error("Rewrite Error:", error);
    let friendlyMessage = error?.message || "Failed to rewrite bullet point";
    if (friendlyMessage.includes("demand") || friendlyMessage.includes("503") || friendlyMessage.includes("UNAVAILABLE")) {
      friendlyMessage = "The AI rewriter is currently experiencing temporary high demand. Please try clicking 'Optimize Bullet' again in a moment.";
    }
    res.status(500).json({ error: friendlyMessage });
  }
});

// API Endpoint for full High-ATS Resume Rewrite / Improvement
app.post("/api/auto-optimize-resume", async (req, res) => {
  try {
    const { fileData, fileType, resumeText, jobDescription } = req.body;

    if (!fileData && !resumeText) {
      res.status(400).json({ error: "Missing resume content. Provide file upload or plain text to optimize." });
      return;
    }

    const systemInstruction = `You are an elite master resume builder and executive career agent.
Your objective is to rewrite the candidate's resume to bypass ATS score gates flawlessly (achieving a simulated 88-99 ATS score target) and impress human recruiters.

Guidelines for optimization:
1. Re-format into a professional, clear, layout-friendly structural grid in clean Markdown (No html, no complex charts). Use standard headings: Professional Summary, Work Experience, Education, Technical Skills, Projects.
2. Upgrade every single bullet point using the STAR methodology (Situation, Task, Action, Result). Inject robust, realistic quantified metrics (e.g., 'boosted API response by 24%', 'managed a $45K project scope', 'grew student engagement by 18%').
3. Standardize and pair action verbs safely ('orchestrated', 'pioneered', 'implemented', 'resolved') rather than general passive roles ('was in charge of', 'assisted with').
4. If a target Job Description is provided, seamlessly map and embed missing key phrases and skills natively into the Experience and Skills list without keyword-stuffing. Make it look organic.
5. Provide a list of explanation summaries outlining exactly what improvements you executed.
6. Strive for density and conciseness, formatting the contents so that they fit cleanly within a single-page document limit when rendered as a standard letter-size document (avoid excessive wordiness, keep experiences highly focused and selective).`;

    const contentsParts: any[] = [];

    if (fileData && fileType) {
      contentsParts.push({
        inlineData: {
          data: fileData,
          mimeType: fileType,
        },
      });
    }

    if (resumeText) {
      contentsParts.push({
        text: `Raw Resume Text to optimize:\n\n${resumeText}`,
      });
    }

    if (jobDescription) {
      contentsParts.push({ text: `Target Job Description requirements:\n\n${jobDescription}` });
    }

    contentsParts.push({
      text: "Please fully optimize and rewrite this resume according to the guidelines, generating the structured output containing the full optimizedText, the change explanation array, and the estimated improved score."
    });

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsParts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optimizedText: { type: Type.STRING },
              explanationOfChanges: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              improvedAtsScoreEstimate: { type: Type.INTEGER }
            },
            required: ["optimizedText", "explanationOfChanges", "improvedAtsScoreEstimate"]
          },
          temperature: 0.5,
        },
      })
    );

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response returned from optimizer");
    }

    const result = JSON.parse(textOutput.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Auto-Optimizer Error:", error);
    let friendlyMessage = error?.message || "Failed to auto-optimize resume";
    if (friendlyMessage.includes("demand") || friendlyMessage.includes("503") || friendlyMessage.includes("UNAVAILABLE")) {
      friendlyMessage = "The AI auto-optimizer is currently facing high traffic demand. Please try again in a few seconds.";
    }
    res.status(500).json({ error: friendlyMessage });
  }
});

// API Endpoint for the Resume & Interview Career Chat Counselor
app.post("/api/chat-counselor", async (req, res) => {
  try {
    const { messages, jobDescription, resumeContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages history is required for the multi-turn conversation." });
      return;
    }

    const systemInstruction = `You are "ATS Career Pro", an elite, personalized career counselor and executive recruiter.
Your goal is to guide the user in crafting a perfect, industry-disrupting resume that maximizes their ATS score and interviews.
Context available:
${resumeContext ? `User's current resume text:\n--- ${resumeContext}\n---` : "No resume uploaded yet."}
${jobDescription ? `User's target job description:\n--- ${jobDescription}\n---` : "No specific job description targeted yet."}

Your conversation design guidelines:
1. Provide highly specific, actionable, bulleted advice (no vague generalizations).
2. Help users write high-impact bullet points, extract key words from their target job description, or practice target interview questions.
3. Be professional, deeply encouraging, and concise. Prevent over-long responses. Use markdown bolding and clear spacing for visual layouts.`;

    // Map the conversation history format to the GenAI SDK structure
    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      })
    );

    const generatedText = response.text || "I apologize, I was unable to compile an answer at this moment.";
    res.json({ text: generatedText });
  } catch (error: any) {
    console.error("Chat Counselor Error:", error);
    let friendlyMessage = error?.message || "Failed to generate response";
    if (friendlyMessage.includes("demand") || friendlyMessage.includes("503") || friendlyMessage.includes("UNAVAILABLE")) {
      friendlyMessage = "The career chat is facing temporary high traffic. Please try sending your message again.";
    }
    res.status(500).json({ error: friendlyMessage });
  }
});


// Setup Vite Dev server or Serve Static production build
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Resume Analyzer Server running on http://localhost:${PORT}`);
  });
}

setupServer();
