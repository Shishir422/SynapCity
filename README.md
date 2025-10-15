# SynapCity - Emotion-Aware Learning Platform 🧠

An intelligent tutoring system that adapts teaching style based on student emotions detected through real-time webcam analysis. SynapCity combines AI-powered tutoring with emotion detection to create a personalized, adaptive learning experience.

## ✨ Features

### 🤖 AI-Powered Adaptive Teaching
- **Context-Aware Responses** - Google Gemini API analyzes questions with emotional context
- **Emotion-Based Adaptation** - AI adjusts explanation complexity based on detected mood:
  - **Confused**: Simpler explanations, smaller steps, concrete examples
  - **Focused**: Detailed information, advanced concepts
  - **Bored**: Engaging facts, real-world applications, interactive questions
  - **Tired**: Brief, easy-to-follow explanations

### 😊 Real-Time Emotion Detection
- **Advanced Face Analysis** - Powered by face-api.js and TensorFlow.js
- **Learning State Mapping** - Facial expressions mapped to learning states:
  - Happy → Focused
  - Angry/Surprised → Confused
  - Sad → Bored
  - Neutral → Neutral
- **Emotion Stability Buffer** - Prevents false triggers with multi-frame validation
- **Live Emotion Debug Panel** - Real-time emotion confidence visualization

### 🎯 Smart Auto-Clarification
- **Intelligent Triggers** - Detects `focused → confused` transitions
- **4-Second Confirmation** - Waits to confirm sustained confusion before intervening
- **Cooldown System** - 10-second cooldown prevents excessive clarifications
- **Simplified Re-Explanations** - AI automatically generates simpler versions of previous answers

### 💬 Modern Chat Interface
- **Clean Design** - Professional, distraction-free chat UI
- **Typing Indicators** - Visual feedback during AI response generation
- **Message History** - Full conversation context maintained
- **Emotion-Tagged Messages** - Each message sent with current emotional state

### 🎨 Dark/Light Theme Toggle
- **Seamless Theme Switching** - Beautiful circular toggle button
- **Professional Dark Mode** - Low-contrast, eye-friendly dark theme
- **Theme Persistence** - Preference saved to localStorage
- **Smooth Transitions** - CSS-based theme changes without layout shifts

### 🎥 Live Webcam Integration
- **Real-Time Monitoring** - Continuous emotion tracking during learning
- **Privacy-Focused** - All processing happens locally in the browser
- **Webcam Toggle** - Easy on/off control
- **Face Detection Stats** - FPS and detection quality metrics

## 🔧 Setup Instructions

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Shishir422/SynapCity.git
cd SynapCity
npm install
```

### 2. Configure Google Gemini API Key (REQUIRED!)

1. **Get your API key** from: [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Create `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```
3. **Add your API key** to `.env`:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

⚠️ **SECURITY WARNING**: 
- Never commit `.env` to version control! (It's already in `.gitignore`)
- The API key is exposed in browser requests - consider adding a backend proxy for production

### 3. Download AI Models

The emotion detection models are already included in `public/models/`:
- `tiny_face_detector_model` - Face detection
- `face_landmark_68_model` - Facial landmark detection
- `face_expression_model` - Expression recognition

No additional downloads needed!

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 5. Build for Production

```bash
npm run build
npm run preview
```

## 🎮 How to Use

1. **Allow Webcam Access** - Grant camera permissions when prompted
2. **Wait for Models** - AI models load automatically (shows "📦 Loading AI Models...")
3. **Start Learning** - Ask any question in the chat
4. **Your emotions are tracked** - The system detects your mood in real-time
5. **AI Adapts** - Responses are tailored to your emotional state
6. **Auto-Clarification** - If you get confused, AI simplifies automatically (after 4 seconds)
7. **Toggle Theme** - Click the moon/sun button (top-left) to switch themes

## 🔍 How It Works

### Emotion Detection Pipeline
```
Webcam Frame → Face Detection → Landmark Analysis → Expression Recognition → 
Learning State Mapping → Stability Buffer → Emotion Change Callback
```

### Adaptive Teaching Flow
```
Student Question + Current Emotion → 
Gemini API (with emotion context) → 
Emotion-Aware Prompt → 
Adaptive AI Response
```

### Auto-Clarification Trigger
```
Emotion Transition (focused → confused) → 
4-Second Confirmation Timer → 
Cooldown Check → 
Generate Simplified Explanation → 
Auto-send to Chat
```

## 📚 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | React 19.1.1 |
| **Build Tool** | Vite 6.2.0 |
| **Styling** | styled-components 6.1.19 |
| **AI/ML** | Google Generative AI (@google/generative-ai) |
| **Emotion Detection** | face-api.js + TensorFlow.js |
| **Webcam** | react-webcam 7.2.0 |
| **State Management** | React Hooks (useState, useCallback, useRef) |

## 📁 Project Structure

```
SynapCity/
├── public/
│   └── models/              # Pre-trained AI models
├── src/
│   ├── components/
│   │   ├── ChatBox.jsx      # Chat interface
│   │   ├── WebcamFeed.jsx   # Webcam component
│   │   ├── EmotionDebugPanel.jsx  # Emotion visualization
│   │   ├── ThemeToggle.jsx  # Dark/light theme switcher
│   │   └── ...
│   ├── hooks/
│   │   ├── useChatBox.js    # Chat logic & auto-clarification
│   │   └── useWebcam.js     # Emotion detection logic
│   ├── services/
│   │   ├── geminiService.js # AI response generation
│   │   ├── faceDetectionService.js  # Emotion mapping
│   │   └── faceMeshService.js       # Face landmark detection
│   ├── App.jsx              # Main app orchestration
│   └── main.jsx             # Entry point
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

## 🎯 Key Features Explained

### Auto-Clarification System
- **Trigger**: Emotion transition from `focused` to `confused`
- **Delay**: 4-second confirmation (prevents false triggers)
- **Cooldown**: 10 seconds between auto-clarifications
- **Method**: AI re-explains previous answer in 2-3 simple sentences

### Emotion Stability Buffer
- **Size**: 5 consecutive frames
- **Purpose**: Ensures emotion is stable before triggering state change
- **Benefit**: Eliminates jitter from momentary facial expressions

### Theme System
- **Implementation**: CSS custom properties (`--background`, `--text`, etc.)
- **Switching**: `data-theme` attribute on `<html>` element
- **Storage**: localStorage for persistence across sessions

## 🔒 Security & Privacy

- ✅ **Local Processing** - All emotion detection runs in your browser
- ✅ **No Video Upload** - Webcam frames are never sent to servers
- ✅ **API Key Protection** - Environment variables (not in source code)
- ✅ **No Data Collection** - No analytics, tracking, or user data storage
- ⚠️ **Client-Side API** - Gemini API key visible in browser (consider backend proxy for production)

## 🐛 Troubleshooting

### Models Not Loading
- Check browser console for errors
- Ensure `public/models/` directory exists with all model files
- Try clearing browser cache and reloading

### API Connection Failed
- Verify `.env` file exists and contains valid API key
- Check [Google AI Studio](https://aistudio.google.com/) for API quota
- Ensure internet connection is active

### Webcam Not Working
- Grant camera permissions in browser
- Check if another app is using the webcam
- Try reloading the page

### Emotion Not Detected
- Ensure your face is visible and well-lit
- Look directly at the camera
- Wait a few seconds for models to initialize
- Check Emotion Debug Panel for confidence scores

## 🚀 Future Enhancements

- [ ] Backend API proxy for secure key management
- [ ] Multi-user support with user profiles
- [ ] Learning progress tracking and analytics
- [ ] Voice input/output for hands-free learning
- [ ] Mobile-responsive design
- [ ] Quiz generation based on conversation
- [ ] Export conversation history

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

**Developer**: Shishir  
**GitHub**: [@Shishir422](https://github.com/Shishir422)  
**Repository**: [SynapCity](https://github.com/Shishir422/SynapCity)

---

Made with ❤️ for adaptive learning
