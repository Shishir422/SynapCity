import { useState, useCallback, useRef, useEffect } from 'react';
import faceDetectionService from '../services/faceDetectionService';

export const useWebcam = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [previousEmotion, setPreviousEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [detectionStats, setDetectionStats] = useState({
    total: 0,
    successful: 0,
    failed: 0
  });
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const lastDetectionRef = useRef(null);
  const emotionChangeCallback = useRef(null);
  const emotionStabilityBuffer = useRef([]); // Buffer to track recent emotions
  const STABILITY_BUFFER_SIZE = 3; // Require 3 consecutive detections before changing emotion

  // Load face-api models on mount
  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      const loaded = await faceDetectionService.loadModels();
      setModelsLoaded(loaded);
      setIsLoadingModels(false);
      
      if (!loaded) {
        console.error('⚠️ Failed to load face detection models');
      }
    };

    loadModels();
  }, []);

  const handleFrameCapture = useCallback(async (imageSrc) => {
    if (!modelsLoaded) {
      console.log('⏳ Models not loaded yet, skipping detection');
      return;
    }

    // Get video element from webcam ref
    if (!videoRef.current) {
      console.log('⏳ Video element not ready');
      return;
    }

    console.log('📸 Analyzing emotion from video feed...');
    
    try {
      setDetectionStats(prev => ({ ...prev, total: prev.total + 1 }));
      
      const result = await faceDetectionService.detectEmotion(videoRef.current);
      
      if (result) {
        const { learningState, expressions, confidence } = result;
        
        // Smoothing: Only update if confidence is reasonable or if it's consistent
        const shouldUpdate = confidence > 0.4 || 
          (lastDetectionRef.current === learningState);
        
        if (shouldUpdate) {
          console.log('✅ Emotion:', learningState, `| Confidence: ${Math.round(confidence * 100)}%`);
          
          // Add to stability buffer
          emotionStabilityBuffer.current.push(learningState);
          if (emotionStabilityBuffer.current.length > STABILITY_BUFFER_SIZE) {
            emotionStabilityBuffer.current.shift();
          }
          
          // Check if emotion is stable (same emotion detected multiple times in a row)
          const isStableEmotion = emotionStabilityBuffer.current.length === STABILITY_BUFFER_SIZE &&
            emotionStabilityBuffer.current.every(e => e === learningState);
          
          // Only trigger emotion change if emotion is stable and different from current
          if (isStableEmotion && lastDetectionRef.current !== learningState) {
            const previousState = lastDetectionRef.current;
            const newState = learningState;
            
            console.log(`🔄 STABLE Emotion transition: ${previousState} → ${newState}`);
            
            // Trigger callback if registered (focused → confused triggers auto-clarification)
            if (emotionChangeCallback.current) {
              emotionChangeCallback.current(previousState, newState);
            }
            
            setPreviousEmotion(previousState);
            setCurrentEmotion(learningState);
            lastDetectionRef.current = learningState;
          } else if (!lastDetectionRef.current) {
            // First detection - set initial emotion
            setCurrentEmotion(learningState);
            lastDetectionRef.current = learningState;
          } else if (isStableEmotion) {
            // Same emotion continuing - just update current
            setCurrentEmotion(learningState);
          }
          
          setEmotionHistory(prev => [...prev.slice(-19), {  // Keep last 20 instead of 10
            emotion: learningState,
            expressions,
            confidence,
            timestamp: new Date()
          }]);
          
          setDetectionStats(prev => ({ ...prev, successful: prev.successful + 1 }));
        } else {
          console.log(`⚠️ Low confidence (${Math.round(confidence * 100)}%), keeping previous state`);
        }
      } else {
        setDetectionStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
    } catch (error) {
      console.error('Error in emotion detection:', error);
      setDetectionStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    }
  }, [modelsLoaded]);

  const handleEmotionDetected = useCallback((emotion) => {
    console.log('😊 Emotion detected:', emotion);
    setCurrentEmotion(emotion);
    
    setEmotionHistory(prev => [...prev.slice(-9), {
      emotion: emotion,
      timestamp: new Date()
    }]);
  }, []);

  const setVideoRef = useCallback((ref) => {
    videoRef.current = ref;
  }, []);

  const getMostFrequentEmotion = useCallback(() => {
    if (emotionHistory.length === 0) return currentEmotion;

    // Get emotions from last 30 seconds with confidence weighting
    const now = Date.now();
    const recentEmotions = emotionHistory.filter(
      item => now - item.timestamp.getTime() < 30000
    );

    if (recentEmotions.length === 0) return currentEmotion;

    // Weighted scoring based on confidence and recency
    const emotionScores = {};
    recentEmotions.forEach((item, index) => {
      const emotion = item.emotion;
      const confidence = item.confidence || 0.5;
      
      // More recent = higher weight
      const recencyWeight = (index + 1) / recentEmotions.length;
      
      // Combined score
      const score = confidence * 0.7 + recencyWeight * 0.3;
      
      emotionScores[emotion] = (emotionScores[emotion] || 0) + score;
    });

    // Find highest scoring emotion
    const topEmotion = Object.entries(emotionScores).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
    
    console.log('🎯 Most frequent emotion (30s):', topEmotion, emotionScores);
    
    return topEmotion;
  }, [emotionHistory, currentEmotion]);

  const setWebcamRef = useCallback((ref) => {
    webcamRef.current = ref;
  }, []);

  const toggleWebcam = useCallback(() => {
    setIsWebcamActive(prev => !prev);
  }, []);

  const setOnEmotionChange = useCallback((callback) => {
    emotionChangeCallback.current = callback;
  }, []);

  return {
    isWebcamActive,
    currentEmotion,
    previousEmotion,
    emotionHistory,
    modelsLoaded,
    isLoadingModels,
    detectionStats,
    handleFrameCapture,
    handleEmotionDetected,
    getMostFrequentEmotion,
    setWebcamRef,
    setVideoRef,
    toggleWebcam,
    setOnEmotionChange,
    webcamRef,
    videoRef
  };
};

export default useWebcam;