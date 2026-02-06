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

/**
 * Normalize numeric tokens in workout parsing
 * Strips "$" prefix from numeric values (e.g., "$225" -> "225")
 * Does not treat numbers as currency in workout contexts
 */
function normalizeNumericToken(value) {
  if (typeof value === 'string') {
    // Strip "$" prefix if present
    return value.startsWith('$') ? value.substring(1) : value;
  }
  return value;
}

/**
 * Normalize numeric values in extractedLifts structure
 */
function normalizeExtractedLifts(extractedLifts) {
  if (!extractedLifts || !Array.isArray(extractedLifts)) {
    return extractedLifts;
  }

  return extractedLifts.map((exercise) => {
    if (!exercise.sets || !Array.isArray(exercise.sets)) {
      return exercise;
    }

    return {
      ...exercise,
      sets: exercise.sets.map((set) => {
        const normalized = { ...set };

        // Normalize weight if it's a string with "$" prefix
        if (typeof normalized.weight === 'string') {
          const normalizedWeight = normalizeNumericToken(normalized.weight);
          normalized.weight = normalizedWeight ? parseFloat(normalizedWeight) : null;
        }

        // Normalize reps if it's a string with "$" prefix
        if (typeof normalized.reps === 'string') {
          const normalizedReps = normalizeNumericToken(normalized.reps);
          normalized.reps = normalizedReps ? parseInt(normalizedReps, 10) : null;
        }

        return normalized;
      }),
    };
  });
}

/**
 * Normalize numeric tokens in transcript text
 * Replaces "$" prefix before numbers with just the number
 */
function normalizeTranscript(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return transcript;
  }

  // Replace "$" followed by digits with just the digits
  // Matches patterns like "$225", "$ 225", "$225lbs", etc.
  return transcript.replace(/\$(\s*)(\d+)/g, '$1$2');
}

app.use(cors());
app.use(express.json());

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

    // Normalize transcript to remove "$" prefixes from numbers
    const transcript = normalizeTranscript(transcription.text);

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

IMPLICIT REPETITION:
- Support implicit repetition phrases: "two sets", "another set", "after that", "then", "next set", etc.
- When these phrases follow a weight/reps specification, duplicate that weight/reps entry accordingly.
- DO NOT assume one weight maps to only one set.
- If user says "225 for 5, two sets" or "225 for 5, another set", create multiple entries with the same weight/reps.
- Each set should be a separate line in the summary and a separate object in structured output.

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

Transcript:
"Bench press 225 for 5 reps, two sets."

Summary:
Bench press
225 x 5
225 x 5

Transcript:
"Squats 315 for 8, another set, then 275 for 10."

Summary:
Squats
315 x 8
315 x 8
275 x 10

Transcript:
"Deadlift 405 for 3, after that two more sets."

Summary:
Deadlift
405 x 3
405 x 3
405 x 3

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

Example structured output for "Bench press 225 for 5, two sets":
[
  {
    "exercise": "Bench press",
    "sets": [
      {"weight": 225, "unit": "lb", "reps": 5},
      {"weight": 225, "unit": "lb", "reps": 5}
    ]
  }
]

Example structured output for "Squats 315 for 8, another set, then 275 for 10":
[
  {
    "exercise": "Squats",
    "sets": [
      {"weight": 315, "unit": "lb", "reps": 8},
      {"weight": 315, "unit": "lb", "reps": 8},
      {"weight": 275, "unit": "lb", "reps": 10}
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
        
        // Normalize numeric tokens in extractedLifts (strip "$" prefixes)
        if (extractedLifts) {
          extractedLifts = normalizeExtractedLifts(extractedLifts);
        }
        
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

// ============================================================================
// COMBINE CARDS ENDPOINT - Separate from /transcribe
// This endpoint formats multiple workout text entries into a single combined entry
// It does NOT interpret or parse - it only formats existing text
// ============================================================================
app.post("/combine", async (req, res) => {
  console.log("---- /combine called ----");
  // #region agent log
  const logPath = 'c:\\gymvoicelog\\.cursor\\debug.log';
  try {
    const logEntry = JSON.stringify({
      location: 'index.js:319',
      message: '/combine endpoint called',
      data: {
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        contentType: req.headers['content-type'],
        textsType: typeof req.body?.texts,
        textsIsArray: Array.isArray(req.body?.texts),
        textsLength: Array.isArray(req.body?.texts) ? req.body.texts.length : null,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A,B,C,D,E,F'
    }) + '\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (logErr) {}
  // #endregion

  const { texts } = req.body;
  // #region agent log
  try {
    const logEntry = JSON.stringify({
      location: 'index.js:340',
      message: 'Extracted texts from body',
      data: {
        textsType: typeof texts,
        textsIsArray: Array.isArray(texts),
        textsLength: Array.isArray(texts) ? texts.length : null,
        textsPreview: Array.isArray(texts) ? texts.slice(0, 3).map(t => typeof t === 'string' ? t.substring(0, 50) : String(t)) : null,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A,B,C,D,E,F'
    }) + '\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (logErr) {}
  // #endregion

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:353',
        message: 'Validation failed - texts missing or invalid',
        data: {
          hasTexts: !!texts,
          textsIsArray: Array.isArray(texts),
          textsLength: Array.isArray(texts) ? texts.length : null,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion
    return res.status(400).json({ error: "texts array is required" });
  }

  if (texts.length < 2) {
    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:370',
        message: 'Validation failed - not enough texts',
        data: {
          textsLength: texts.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion
    return res.status(400).json({ error: "At least 2 texts required to combine" });
  }

  try {
    // Filter out empty texts
    const nonEmptyTexts = texts.filter(text => text && typeof text === 'string' && text.trim().length > 0);
    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:334',
        message: 'Filtered non-empty texts',
        data: {
          originalCount: texts.length,
          nonEmptyCount: nonEmptyTexts.length,
          nonEmptyTextsPreview: nonEmptyTexts.slice(0, 3).map(t => t.substring(0, 50)),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion
    
    if (nonEmptyTexts.length < 2) {
      // #region agent log
      try {
        const logEntry = JSON.stringify({
          location: 'index.js:345',
          message: 'Validation failed - not enough non-empty texts',
          data: {
            nonEmptyCount: nonEmptyTexts.length,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        }) + '\n';
        fs.appendFileSync(logPath, logEntry);
      } catch (logErr) {}
      // #endregion
      return res.status(400).json({ error: "At least 2 non-empty texts required" });
    }

    // Combine prompt - FORMATTER ONLY, not interpreter
    const combineSystemPrompt = `You are a workout text formatter. Your job is to combine multiple workout text entries into a single, well-formatted workout summary.

RULES:
- You are a FORMATTER, not an interpreter
- Do NOT invent exercises, sets, reps, or weights
- Do NOT remove or reorder information
- Preserve the original order of exercises and sets as they appear in the input texts
- If an exercise name is present, place it on the first line
- Normalize set phrasing into "WEIGHT x REPS" format when clearly expressed (e.g., "100 pounds for 10 reps" → "100 x 10", "10 reps of 100" → "100 x 10")
- If text cannot be confidently normalized into a set, include it verbatim as its own line
- Output plain text only, no explanations or commentary

FORMATTING RULES:
- Exercise name on its own line
- Each set on a separate line: <weight> x <reps>
- Multiple exercises separated by blank line
- Preserve original order from input texts

EXAMPLES:

Input texts:
["Bench press 225 for 5", "Squats 315 for 8"]

Output:
Bench press
225 x 5

Squats
315 x 8

Input texts:
["100 pounds for 10 reps", "another set of 100 for 10"]

Output:
100 x 10
100 x 10

Input texts:
["Bench press", "225 x 5", "225 x 5"]

Output:
Bench press
225 x 5
225 x 5

Input texts:
["Some freeform text about my workout", "Bench press 225 x 5"]

Output:
Some freeform text about my workout

Bench press
225 x 5

DO NOT:
- Invent exercises, sets, reps, or weights
- Remove information that exists in source texts
- Reorder information beyond normalization
- Interpret ambiguous data
- Make assumptions about missing information
- Add explanations or commentary

Input texts will be provided in order. Format them into a single workout summary following the rules above.`;

    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:405',
        message: 'Before OpenAI API call',
        data: {
          nonEmptyTextsCount: nonEmptyTexts.length,
          promptLength: combineSystemPrompt.length,
          userContentLength: `Combine these workout texts in order:\n\n${nonEmptyTexts.map((text, idx) => `Text ${idx + 1}:\n${text}`).join('\n\n')}`.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B,C,D,E,F'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: combineSystemPrompt,
        },
        {
          role: "user",
          content: `Combine these workout texts in order:\n\n${nonEmptyTexts.map((text, idx) => `Text ${idx + 1}:\n${text}`).join('\n\n')}`,
        },
      ],
    });
    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:420',
        message: 'After OpenAI API call',
        data: {
          hasCompletion: !!completion,
          hasChoices: !!completion?.choices,
          choicesLength: completion?.choices?.length || 0,
          hasMessage: !!completion?.choices?.[0]?.message,
          hasContent: !!completion?.choices?.[0]?.message?.content,
          contentLength: completion?.choices?.[0]?.message?.content?.length || 0,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion

    const combinedText = completion.choices[0]?.message?.content?.trim() || '';
    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:437',
        message: 'Extracted combinedText',
        data: {
          combinedTextLength: combinedText.length,
          combinedTextPreview: combinedText.substring(0, 100),
          isEmpty: !combinedText,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion

    if (!combinedText) {
      // #region agent log
      try {
        const logEntry = JSON.stringify({
          location: 'index.js:451',
          message: 'AI returned empty response',
          data: {},
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E'
        }) + '\n';
        fs.appendFileSync(logPath, logEntry);
      } catch (logErr) {}
      // #endregion
      console.error("Combine AI returned empty response");
      return res.status(500).json({ error: "AI formatting returned empty result" });
    }

    console.log("Combine SUCCESS:", {
      inputCount: nonEmptyTexts.length,
      outputLength: combinedText.length,
    });
    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:465',
        message: 'Sending success response',
        data: {
          inputCount: nonEmptyTexts.length,
          outputLength: combinedText.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion

    res.json({
      combinedText,
    });
  } catch (err) {
    // #region agent log
    try {
      const logEntry = JSON.stringify({
        location: 'index.js:480',
        message: 'COMBINE ERROR catch block',
        data: {
          errorType: err?.constructor?.name,
          errorMessage: err?.message || String(err),
          errorStack: err?.stack?.substring(0, 300),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A,B,C,D,E,F'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {}
    // #endregion
    console.error("COMBINE ERROR:", err);
    res.status(500).json({
      error: "Combine failed",
      details: err?.message ?? String(err),
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`STT server running on port ${PORT}`);
  console.log(`Available routes: POST /transcribe, POST /combine`);
  // #region agent log
  try {
    const logPath = 'c:\\gymvoicelog\\.cursor\\debug.log';
    const logEntry = JSON.stringify({
      location: 'index.js:660',
      message: 'Server started - routes registered',
      data: {
        port: PORT,
        routes: ['POST /transcribe', 'POST /combine'],
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'F'
    }) + '\n';
    fs.appendFileSync(logPath, logEntry);
  } catch (logErr) {}
  // #endregion
});
