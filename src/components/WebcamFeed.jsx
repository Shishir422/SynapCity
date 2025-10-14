import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import styled from 'styled-components';

const WebcamContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 240px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: #000;
  z-index: 1000;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const WebcamWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 Aspect Ratio */
  background: #000;
`;

const StyledWebcam = styled(Webcam)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const WebcamHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#4CAF50' : '#f44336'};
  animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const StatusText = styled.span`
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
`;

const EmotionBadge = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  z-index: 1;
`;

const EmotionIcon = styled.span`
  font-size: 16px;
  margin-right: 6px;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
  padding: 20px;
  font-size: 12px;
  z-index: 1;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 6px;
  color: white;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  z-index: 2;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const WebcamFeed = React.forwardRef(({ onFrameCapture, onEmotionDetected, onVideoReady, className }, ref) => {
  const webcamRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  useEffect(() => {
    // Request webcam permission
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        setIsActive(true);
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Webcam permission denied:', error);
        setHasPermission(false);
        setIsActive(false);
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    // Notify parent when video element is ready
    if (webcamRef.current?.video && onVideoReady) {
      onVideoReady(webcamRef.current.video);
    }
  }, [onVideoReady, hasPermission]);

  useEffect(() => {
    if (!isActive || !hasPermission || isMinimized) return;

    // Capture frames periodically for emotion detection
    const interval = setInterval(() => {
      captureFrame();
    }, 1000); // Capture every 1 second (as per requirements)

    return () => clearInterval(interval);
  }, [isActive, hasPermission, isMinimized]);

  const captureFrame = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc && onFrameCapture) {
        onFrameCapture(imageSrc);
      }
    }
  };

  const handleEmotionUpdate = (emotion) => {
    setCurrentEmotion(emotion);
    if (onEmotionDetected) {
      onEmotionDetected(emotion);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    captureFrame,
    updateEmotion: handleEmotionUpdate
  }));

  const getEmotionDisplay = () => {
    if (!currentEmotion) return { icon: '😊', text: 'Analyzing...' };
    
    const emotionMap = {
      happy: { icon: '😊', text: 'Happy' },
      sad: { icon: '😢', text: 'Sad' },
      angry: { icon: '😠', text: 'Angry' },
      surprised: { icon: '😮', text: 'Surprised' },
      neutral: { icon: '😐', text: 'Neutral' },
      confused: { icon: '😕', text: 'Confused' },
      focused: { icon: '🤓', text: 'Focused' },
      tired: { icon: '😴', text: 'Tired' },
      bored: { icon: '😑', text: 'Bored' },
    };

    return emotionMap[currentEmotion?.toLowerCase()] || { icon: '🤔', text: currentEmotion };
  };

  if (hasPermission === false) {
    return (
      <WebcamContainer className={className}>
        <WebcamWrapper>
          <ErrorMessage>
            📷 Webcam access denied<br/>
            Please enable camera permissions
          </ErrorMessage>
        </WebcamWrapper>
      </WebcamContainer>
    );
  }

  if (isMinimized) {
    return (
      <WebcamContainer className={className} style={{ width: '60px', cursor: 'pointer' }} onClick={toggleMinimize}>
        <WebcamWrapper style={{ paddingTop: '100%' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: '24px'
          }}>
            📷
          </div>
        </WebcamWrapper>
      </WebcamContainer>
    );
  }

  const emotionDisplay = getEmotionDisplay();

  return (
    <WebcamContainer className={className}>
      <WebcamWrapper>
        <WebcamHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusDot $active={isActive} />
            <StatusText>{isActive ? 'Live' : 'Offline'}</StatusText>
          </div>
        </WebcamHeader>
        
        <ToggleButton onClick={toggleMinimize}>
          ━
        </ToggleButton>

        {hasPermission && (
          <StyledWebcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            mirrored={true}
          />
        )}

        {currentEmotion && (
          <EmotionBadge>
            <EmotionIcon>{emotionDisplay.icon}</EmotionIcon>
            {emotionDisplay.text}
          </EmotionBadge>
        )}
      </WebcamWrapper>
    </WebcamContainer>
  );
});

WebcamFeed.displayName = 'WebcamFeed';

export default WebcamFeed;