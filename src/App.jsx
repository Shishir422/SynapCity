import React, { useRef, useEffect, useCallback, useState } from 'react'
import styled from 'styled-components'
import ChatBox from './components/ChatBox'
import WebcamFeed from './components/WebcamFeed'
import EmotionDebugPanel from './components/EmotionDebugPanel'
import { useChatBox } from './hooks/useChatBox'
import { useWebcam } from './hooks/useWebcam'
import './App.css'

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: var(--bg-color);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const Header = styled.header`
  text-align: center;
  width: 100%;
  max-width: 800px;
  
  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: var(--subtext-color);
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const MainContent = styled.main`
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 320px;
  }
`;

const ChatSection = styled.section`
  height: 70vh;
  display: flex;
  flex-direction: column;
`;

const InfoPanel = styled.aside`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
  height: fit-content;
  
  h3 {
    color: var(--header-text-color);
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    padding: 0.6rem 0;
    color: var(--subtext-color);
    font-size: 0.95rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    &:last-child {
      border-bottom: none;
    }
    
    &::before {
      content: '';
      display: inline-block;
      width: 18px;
      height: 18px;
      line-height: 18px;
      text-align: center;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
      color: white;
      font-size: 0.8rem;
      font-weight: bold;
    }
  }
`;

const StatusIndicator = styled.div`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: ${props => props.$active ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'};
  color: ${props => props.$active ? '#28a745' : '#dc3545'};
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid ${props => props.$active ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)'};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.$active ? '#28a745' : '#dc3545'};
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
    100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
  }
`;

function App() {
  const { 
    isTyping, 
    handleSendMessage, 
    setChatBoxRef,
    handleConfusedState,
    apiConnected, 
    testApiConnection 
  } = useChatBox();
  
  const {
    currentEmotion,
    previousEmotion,
    handleFrameCapture,
    handleEmotionDetected,
    getMostFrequentEmotion,
    setWebcamRef,
    setVideoRef,
    setOnEmotionChange,
    modelsLoaded,
    isLoadingModels,
    emotionHistory,
    detectionStats
  } = useWebcam();
  
  const chatBoxRef = useRef(null);
  const webcamRef = useRef(null);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  useEffect(() => {
    setChatBoxRef(chatBoxRef.current);
  }, [setChatBoxRef]);

  useEffect(() => {
    setWebcamRef(webcamRef.current);
  }, [setWebcamRef]);

  // Handle video element ready
  const handleVideoReady = useCallback((videoElement) => {
    console.log('📹 Video element ready for emotion detection');
    setVideoRef(videoElement);
  }, [setVideoRef]);

  useEffect(() => {
    // Test API connection when app loads
    testApiConnection();
  }, [testApiConnection]);

  // Register emotion change callback for adaptive teaching
  useEffect(() => {
    const handleEmotionTransition = (fromEmotion, toEmotion) => {
      console.log(`🧠 Emotion transition detected: ${fromEmotion} → ${toEmotion}`);
      
      // Trigger auto-clarification when student goes from focused → confused
      if (fromEmotion === 'focused' && toEmotion === 'confused') {
        console.log('🎯 Focused → Confused detected! Triggering auto-clarification...');
        handleConfusedState();
      }
    };

    setOnEmotionChange(handleEmotionTransition);
  }, [setOnEmotionChange, handleConfusedState]);

  // Enhanced message handler with emotion context
  const handleMessageWithEmotion = (message) => {
    const emotion = getMostFrequentEmotion();
    console.log('📨 Sending message with emotion context:', emotion);
    handleSendMessage(message, emotion);
  };

  return (
    <AppContainer>
      <StatusIndicator $active={apiConnected !== false && modelsLoaded}>
        {isLoadingModels ? '📦 Loading AI Models...' :
         !modelsLoaded ? '⚠️ Models Failed' :
         apiConnected === null ? '🔄 Connecting...' : 
         apiConnected ? '🤖 AI Tutor Online' : '⚠️ AI Offline'}
      </StatusIndicator>
      
      <Header>
        <h1>AI Tutor</h1>
        <p>
          Your personalized learning companion. Ask questions, explore topics, 
          and learn at your own pace with AI-powered explanations.
        </p>
      </Header>

      <MainContent>
        <ChatSection>
          <ChatBox
            ref={chatBoxRef}
            onSendMessage={handleMessageWithEmotion}
            isTyping={isTyping}
          />
        </ChatSection>

        <InfoPanel>
          {currentEmotion && (
            <>
              <h3>😊 Current Mood</h3>
              <ul>
                <li style={{textTransform: 'capitalize'}}>{currentEmotion}</li>
              </ul>
            </>
          )}
          
          <h3 style={{marginTop: currentEmotion ? '2rem' : '0'}}>�💡 Try Asking...</h3>
          <ul>
            <li>Explain Newton's Laws</li>
            <li>How does gravity work?</li>
            <li>What is algebra?</li>
            <li>Basics of calculus</li>
            <li>How do magnets work?</li>
            <li>What is photosynthesis?</li>
          </ul>
          
          <h3 style={{marginTop: '2rem'}}>🎯 Key Features</h3>
          <ul>
            <li>Real-time AI Responses</li>
            <li>Adaptive Explanations</li>
            <li>Interactive Learning</li>
            <li>Emotion-Aware Teaching</li>
          </ul>
        </InfoPanel>
      </MainContent>

      {/* Webcam Feed - Fixed position in corner */}
      <WebcamFeed
        ref={webcamRef}
        onFrameCapture={handleFrameCapture}
        onEmotionDetected={handleEmotionDetected}
        onVideoReady={handleVideoReady}
      />

      {/* Emotion Debug Panel */}
      {showDebugPanel && (
        <EmotionDebugPanel
          emotionHistory={emotionHistory}
          detectionStats={detectionStats}
          currentEmotion={currentEmotion}
          onClose={() => setShowDebugPanel(false)}
        />
      )}
    </AppContainer>
  )
}

export default App
