import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Use the provided API key or fallback to environment variable
  const API_KEY = "AIzaSyAhvd55l4jCZhLM1cJjxlH3KawRYHi8lgI";

  // Lazy initialize Gemini client
  const getGeminiAI = () => {
    if (API_KEY || process.env.GEMINI_API_KEY) {
      return new GoogleGenAI({
        apiKey: API_KEY || process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return null;
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/math-puzzle", async (req, res) => {
    const { difficulty, towerType, towerLevel } = req.body;
    const ai = getGeminiAI();

    if (!ai) {
      return res.status(503).json({ error: "Gemini API key not configured, using local fallback" });
    }

    try {
      const prompt = `Generate a single multiple-choice math puzzle for an educational tower defense game in Thai and English.
Difficulty: ${difficulty || 'intermediate'} (elementary = Grade 1-3 simple +/- arithmetic, intermediate = Grade 4-6 ×/÷ and mixed operations, advanced = Algebra 1 variable equations e.g. 3x + 5 = 26).
Current Tower Operator: "${towerType || '+'}". Tower Level: ${towerLevel || 1}.
Return a valid JSON object matching the schema with 1 question text, 4 unique number options (including the answer), and a brief Thai explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The math problem statement e.g. 'หาค่า x จาก 2x + 6 = 18' or '12 × 7 = ?'" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Array of exactly 4 distinct numerical choices"
              },
              answer: { type: Type.NUMBER, description: "The correct numerical answer from the options array" },
              explanationTh: { type: Type.STRING, description: "Brief 1-sentence step-by-step explanation in Thai" }
            },
            required: ["question", "options", "answer", "explanationTh"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const json = JSON.parse(text.trim());
        return res.json(json);
      }
      return res.status(500).json({ error: "Empty response from AI" });
    } catch (error: any) {
      console.error("Gemini math generation error:", error?.message || error);
      return res.status(500).json({ error: "Failed to generate AI puzzle" });
    }
  });

  // Vite middleware for development vs static production build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();