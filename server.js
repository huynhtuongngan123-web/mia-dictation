import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";
import { toFile } from "openai/uploads";

dotenv.config();

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/check", upload.single("audio"), async (req, res) => {
  try {
    console.log("Received /api/check request");

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return res.status(500).json({
        error: "Server chưa cấu hình OPENAI_API_KEY."
      });
    }

    if (!req.file) {
      console.error("No audio file received");
      return res.status(400).json({
        error: "Không tìm thấy file audio."
      });
    }

    console.log("Audio file:", req.file.originalname, req.file.mimetype, req.file.size);

    const prompt =
      req.body.prompt ||
      "Transcribe this academic English dictation audio accurately.";

    const language = req.body.language || undefined;
    const model = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";

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

    console.log("Transcription successful");

    res.json({
      transcript: transcription.text || ""
    });
  } catch (error) {
    console.error("Transcription error:", error);

    res.status(500).json({
      error: error.message || "Không thể xử lý audio."
    });
  }
});

app.use((error, req, res, next) => {
  console.error("Server middleware error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File audio lớn hơn 25MB. Hãy cắt nhỏ hoặc nén file."
    });
  }

  res.status(500).json({
    error: error.message || "Server error."
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`MIA Dictation AI is running on port ${port}`);
});
