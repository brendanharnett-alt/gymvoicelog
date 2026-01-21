import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());

app.get("/", (_req, res) => {
  res.send("STT server running");
});

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  console.log("---- /transcribe called ----");

  if (!req.file) {
    console.error("No file received");
    return res.status(400).json({ error: "No audio file provided" });
  }

  // 🔑 Rename temp file to include extension
  const originalExt = path.extname(req.file.originalname) || ".m4a";
  const fixedPath = `${req.file.path}${originalExt}`;

  try {
    fs.renameSync(req.file.path, fixedPath);

    console.log("Renamed file to:", fixedPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(fixedPath),
      model: "whisper-1",
    });

    console.log("Transcription success:", transcription.text);

    const transcript = transcription.text;

    // Generate workout summary with GPT-4o-mini
    let summary = null;
    let extractedLifts = null;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a conservative workout logging assistant. Your job is to generate lifter-native, trustworthy workout summaries from transcripts.

SUMMARY RULES:
- Preserve the exercise name once per group.
- If multiple sets are described for the same exercise, output one line per set.
- Use lifter-native notation: <weight> x <reps>
- Maintain the order spoken by the user.
- NEVER invent weights, reps, sets, or exercises.
- NEVER reorder values unnaturally (weight must come before reps).
- Prefer omission over guessing.
- Be conservative and boring, not clever.

SUMMARY FORMAT:
- Exercise name on its own line
- Each set on a separate line below the exercise: <weight> x <reps>
- If multiple exercises, separate with a blank line between exercise groups

EXAMPLES:

Transcript:
"Seated bicep curls, one set of 40 pounds for 6 reps, another set of 35 pounds for 8 reps, and a third set of 25 pounds for 10 reps."

Summary:
Seated bicep curls
40 x 6
35 x 8
25 x 10

Transcript:
"Dumbbell overhead press 80s for 10, then lateral raises 25s for 12."

Summary:
Dumbbell overhead press
80 x 10

Lateral raises
25 x 12

DO NOT:
- Use symbols like "@" or "—"
- Use shorthand like "10x315"
- Drop the exercise name
- Compress into unreadable notation
- Guess sets or combine unrelated exercises

STRUCTURED OUTPUT:
Return a JSON object with:
- "summary" (string, required): A readable workout summary using the format above
- "structured" (array of objects, optional): 
  Each object represents an exercise group:
  - exercise (string, required)
  - sets (array of objects, required): Each set object contains:
    - weight (number or null)
    - unit (string: "lb" or "kg" or null)
    - reps (number or null)
  
Example structured output for "Seated bicep curls 40 x 6, 35 x 8, 25 x 10":
[
  {
    "exercise": "Seated bicep curls",
    "sets": [
      {"weight": 40, "unit": "lb", "reps": 6},
      {"weight": 35, "unit": "lb", "reps": 8},
      {"weight": 25, "unit": "lb", "reps": 10}
    ]
  }
]

If extraction is ambiguous:
- Still return a readable summary
- Leave structured fields as empty array or omit
- Always preserve the raw transcript separately`,
          },
          {
            role: "user",
            content: `Transcript: ${transcript}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const llmResponse = completion.choices[0]?.message?.content;
      if (llmResponse) {
        const parsed = JSON.parse(llmResponse);
        summary = parsed.summary || null;
        extractedLifts = parsed.structured || null;
        console.log("LLM summary SUCCESS:", {
          hasSummary: !!summary,
          hasStructured: !!extractedLifts,
          summaryPreview: summary ? summary.substring(0, 100) : null,
        });
      } else {
        console.log("LLM summary FAILED: No response content");
      }
    } catch (llmErr) {
      console.error("LLM summary FAILED:", llmErr.message || llmErr);
      // Continue with transcript only
    }

    fs.unlink(fixedPath, () => {});
    res.json({
      transcript,
      summary,
      extractedLifts,
    });
  } catch (err) {
    console.error("TRANSCRIPTION ERROR:", err);

    // Cleanup on failure
    if (fs.existsSync(fixedPath)) {
      fs.unlink(fixedPath, () => {});
    }

    res.status(500).json({
      error: "Transcription failed",
      details: err?.message ?? String(err),
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`STT server running on port ${PORT}`);
});
