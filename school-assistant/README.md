# 🎓 School Assistant — AI Study Overlay

A **transparent, always-on-top desktop overlay** that reads your screen, answers exam questions, fills forms, and helps you revise past papers — powered by **Google Gemini AI**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 👁️ **Screen Reader** | Auto-captures your screen every 4 seconds & finds questions |
| 🤖 **AI Answers** | Gemini Vision answers every question with full explanations |
| 📝 **Form Filler** | Detects form fields and suggests what to fill in |
| 📚 **Past Papers** | Upload PDF past papers — AI extracts all Q&As |
| 🎯 **Quiz Mode** | Auto-generates multiple choice quizzes from your papers |
| 🪟 **Overlay Window** | Transparent, draggable, always on top of everything |
| ▶️ **Start/Stop** | One-click toggle for live screen monitoring |
| 🎚️ **Opacity Slider** | Make it as transparent as you like |
| 🕐 **History** | All answers saved to PostgreSQL (Render.com) |
| ⌨️ **Shortcuts** | `Ctrl+Shift+S` = show/hide · `Ctrl+Shift+A` = instant scan |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Electron Desktop App (Overlay)              │
│   Transparent window · Always-on-top · Draggable        │
│   ┌────────────────────────────────────────────────┐    │
│   │  React UI — 4 Tabs: Screen · Chat · Papers · History│
│   └──────────────────┬─────────────────────────────┘    │
│                      │ desktopCapturer (screenshots)     │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTP (localhost:3001)
          ┌────────────▼──────────────────┐
          │   Node.js / Express Backend    │
          │   localhost:3001               │
          └────────────┬──────────────────┘
                       │
          ┌────────────▼──────────────────┐
          │   Google Gemini 1.5 Flash AI   │
          │   Vision + Text + JSON         │
          └────────────┬──────────────────┘
                       │
          ┌────────────▼──────────────────┐
          │   PostgreSQL — Render.com      │
          │   cheetah_aeef (Oregon)        │
          └───────────────────────────────┘
```

---

## 🚀 Quick Start

### Step 1 — Start the Backend
```bash
cd backend
npm install
node src/index.js
# ✅ Backend running on http://localhost:3001
```

### Step 2 — Launch the Overlay App
```bash
cd frontend
npm install
npm start
# 🪟 Electron overlay window appears on screen
```

### Step 3 — Use It!
1. The overlay appears in the **top-right corner** of your screen
2. Drag it anywhere you want
3. Press **▶ Start Monitoring** to begin auto-scanning
4. Or press **📸 Snap** for a one-time capture
5. Upload PDFs in the **Papers** tab to quiz yourself
6. Ask anything in the **Chat** tab

---

## ⚙️ Environment Setup

The `.env` file is **already configured** with your credentials:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | AIzaSyDBGTPSBcVpsPga9WHQ_875RCG4mNiZtAk |
| `DATABASE_URL` | postgresql://cheetah_aeef_user:...@render.com/cheetah_aeef |
| `PORT` | 3001 |

---

## 🚢 Deploy Backend to Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Render auto-reads `render.yaml` and deploys everything
5. Update `REACT_APP_API_URL` in frontend to your Render URL

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+S` | Show / hide the overlay |
| `Ctrl+Shift+A` | Instant AI screen scan |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/analyze` | Analyze screenshot (base64) |
| POST | `/api/chat` | Chat with AI |
| GET | `/api/papers` | List past papers |
| POST | `/api/papers/upload` | Upload PDF paper |
| GET | `/api/papers/:id/questions` | Get paper questions |
| POST | `/api/papers/:id/quiz` | Generate quiz |
| GET | `/api/history` | Answer history |
| DELETE | `/api/history` | Clear history |

---

## 🛠️ Tech Stack

- **Desktop**: Electron 31 + React 18
- **AI**: Google Gemini 1.5 Flash (Vision + Text)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL on Render.com (cheetah_aeef)
- **PDF**: pdf-parse
- **Deployment**: Render.com (render.yaml included)
