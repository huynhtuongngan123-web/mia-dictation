import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static("public"));

app.post("/api/check", upload.single("audio"), async (req, res) => {
  let filePath = req.file?.path;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Server chưa cấu hình OPENAI_API_KEY."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Không tìm thấy file audio."
      });
    }

    const prompt = req.body.prompt || "Transcribe this academic English dictation audio accurately.";
    const language = req.body.language || undefined;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
      prompt,
      language,
      response_format: "json"
    });

    res.json({
      transcript: transcription.text || ""
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Không thể xử lý audio."
    });
  } finally {
    if (filePath) {
      fs.unlink(filePath, () => {});
    }
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`BRIS Dictation AI is running on port ${port}`);
});
