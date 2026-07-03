# BRIS Dictation AI Web

Web online có backend AI. Học viên chỉ cần:
1. Chèn audio
2. Gõ bài dictation
3. Bấm **Kiểm tra & sửa bài**

AI sẽ tự nghe audio, tạo transcript, rồi sửa trực tiếp trong bài gõ.

## Chạy thử trên máy

```bash
npm install
cp .env.example .env
npm start
```

Mở:

```text
http://localhost:3000
```

## Biến môi trường cần có

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
PORT=3000
```

## Deploy online nhanh

Dùng Render/Railway/VPS:
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `OPENAI_API_KEY`
  - `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`

Không đưa API key vào file HTML. API key chỉ nằm ở server.
