import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { toFile } from "openai/uploads";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "mia-dictation-clean",
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1"
  });
});

app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "Frontend connected to backend successfully."
  });
});

app.post("/api/check", upload.single("audio"), async (req, res) => {
  console.log("POST /api/check received");

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return res.status(500).json({
        ok: false,
        error: "Thieu OPENAI_API_KEY trong Render Environment."
      });
    }

    if (!req.file) {
      console.error("No audio file");
      return res.status(400).json({
        ok: false,
        error: "Khong nhan duoc file audio."
      });
    }

    console.log("Audio:", {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const model = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";
    const prompt = req.body.prompt || "Transcribe this dictation audio accurately.";
    const language = req.body.language || undefined;

    const audioFile = await toFile(
      req.file.buffer,
      req.file.originalname || "audio.mp3",
      { type: req.file.mimetype || "audio/mpeg" }
    );

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model,
      prompt,
      language,
      response_format: "json"
    });

    console.log("Transcription OK");

    return res.json({
      ok: true,
      transcript: transcription.text || ""
    });
  } catch (error) {
    console.error("OpenAI/server error:", error);

    const message =
      error?.response?.data?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Khong xu ly duoc audio.";

    return res.status(500).json({
      ok: false,
      error: message
    });
  }
});

app.use((error, req, res, next) => {
  console.error("Middleware error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      ok: false,
      error: "File audio lon hon 25MB."
    });
  }

  return res.status(500).json({
    ok: false,
    error: error.message || "Server error."
  });
});

app.listen(port, () => {
  console.log(`MIA Dictation Clean is running on port ${port}`);
});
