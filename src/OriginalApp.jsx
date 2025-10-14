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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    color: #333;
    font-size: 2.5rem;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: #666;
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.5;
  }
`;

const MainContent = styled.main`
  width: 100%;
  max-width: 800px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 300px;
  }
`;

const ChatSection = styled.section`
  height: 600px;
`;

const InfoPanel = styled.aside`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
  
  h3 {
    color: #333;
    margin-bottom: 15px;
    font-size: 1.2rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    padding: 8px 0;
    color: #666;
    font-size: 0.9rem;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &::before {
      content: "💡";
      margin-right: 8px;
    }
  }
`;

const StatusIndicator = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${props => props.$active ? '#4CAF50' : '#f44336'};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

function App() {
  const { 
    isTyping, 
    handleSendMessage, 
    setChatBoxRef, 
    apiConnected, 
    testApiConnection 
  } = useChatBox();
  
  const {
    currentEmotion,
    handleFrameCapture,
    handleEmotionDetected,
    getMostFrequentEmotion,
    setWebcamRef,
    setVideoRef,
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
          <h3>💡 Try asking about:</h3>
          <ul>
            <li>Explain Newton's Laws</li>
            <li>How does gravity work?</li>
            <li>What is algebra?</li>
            <li>Basics of calculus</li>
            <li>How do magnets work?</li>
            <li>What is photosynthesis?</li>
          </ul>
          
          <h3 style={{marginTop: '25px'}}>🎯 Features:</h3>
          <ul>
            <li>Real-time responses</li>
            <li>Adaptive explanations</li>
            <li>Interactive learning</li>
            <li>Emotion-aware teaching</li>
          </ul>
          
          {currentEmotion && (
            <>
              <h3 style={{marginTop: '25px'}}>😊 Current Mood:</h3>
              <ul>
                <li style={{textTransform: 'capitalize'}}>{currentEmotion}</li>
              </ul>
            </>
          )}
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
