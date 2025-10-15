# SynapCity - Emotion-Aware Learning Platform

An intelligent tutoring system that adapts teaching style based on student emotions detected through webcam.

## 🚀 Features

- 🤖 **AI-Powered Tutoring** - Uses Google Gemini API for intelligent responses
- 😊 **Emotion Detection** - Webcam-based emotion analysis (face-api.js)
- 💬 **Interactive Chat** - Clean, modern chat interface
- 🎯 **Adaptive Learning** - AI adjusts explanations based on detected emotions
- 🎥 **Live Webcam Feed** - Real-time emotion monitoring

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key (IMPORTANT!)

1. Get your Gemini API key from: https://aistudio.google.com/app/apikey
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

⚠️ **SECURITY WARNING**: Never commit `.env` to version control! It's already in `.gitignore`.

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173/ in your browser.

## 🔒 Security Best Practices

- ✅ API key stored in `.env` (excluded from git)
- ✅ `.env.example` provided for reference
- ✅ No hardcoded API keys in source code
- ⚠️ Note: Client-side API calls expose keys in browser - consider adding a backend proxy for production

## 📚 Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: styled-components
- **AI**: Google Gemini API
- **Webcam**: react-webcam
- **Emotion Detection**: face-api.js + TensorFlow.js

## 🎯 How It Works

1. Student asks a question via chat
2. Webcam captures frames every 2 seconds
3. Face detection analyzes emotion
4. AI receives emotion context with question
5. AI adapts teaching style based on emotion
6. Student receives personalized explanation

---

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
