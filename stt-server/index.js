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

    fs.unlink(fixedPath, () => {});
    res.json({ text: transcription.text });
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
