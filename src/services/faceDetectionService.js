import * as faceapi from 'face-api.js';

class FaceDetectionService {
  constructor() {
    this.modelsLoaded = false;
    this.isLoading = false;
    this.detectionInterval = null;
    this.eyeClosureStartTime = null;
    this.BOREDOM_THRESHOLD_MS = 2500;
    this.smoothingAlpha = 0.7;
    this.previousMetrics = {
      eyeOpenness: 1.0,
      smileWidth: 0,
      eyebrowRaise: 0,
      mouthOpen: 0
    };
    this.detectionHistory = [];
    this.maxHistoryLength = 10;
  }

  async loadModels() {
    if (this.modelsLoaded || this.isLoading) {
      console.log('Models already loaded');
      return this.modelsLoaded;
    }
    this.isLoading = true;
    console.log('Loading models...');
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      this.modelsLoaded = true;
      this.isLoading = false;
      console.log('Models loaded successfully');
      return true;
    } catch (error) {
      this.isLoading = false;
      console.error('Error loading models:', error);
      return false;
    }
  }

  async detectEmotion(videoElement) {
    if (!this.modelsLoaded || !videoElement || videoElement.readyState !== 4) {
      return null;
    }
    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({inputSize: 416, scoreThreshold: 0.3}))
        .withFaceLandmarks()
        .withFaceExpressions();
      if (!detection) {
        this.eyeClosureStartTime = null;
        return null;
      }
      const expressions = detection.expressions;
      const landmarks = detection.landmarks;
      const rawMetrics = this.analyzeLandmarks(landmarks);
      const smoothedMetrics = this.smoothMetrics(rawMetrics);
      const learningState = this.mapToLearningState(expressions, smoothedMetrics);
      const confidence = this.calculateConfidence(expressions, smoothedMetrics, learningState);
      this.logDetection(expressions, smoothedMetrics, learningState, confidence);
      const result = {
        expressions,
        landmarks: smoothedMetrics,
        learningState,
        confidence,
        faceDetected: true,
        timestamp: new Date()
      };
      this.addToHistory(result);
      return result;
    } catch (error) {
      console.error('Detection error:', error);
      return null;
    }
  }

  analyzeLandmarks(landmarks) {
    const points = landmarks.positions;
    const rightEyeHeight = Math.abs(points[37].y - points[41].y);
    const leftEyeHeight = Math.abs(points[43].y - points[47].y);
    const avgEyeHeight = (rightEyeHeight + leftEyeHeight) / 2;
    const eyeOpenness = Math.min(1, avgEyeHeight / 8);
    const mouthWidth = Math.abs(points[54].x - points[48].x);
    const faceWidth = Math.abs(points[16].x - points[0].x);
    const smileWidth = Math.min(1, mouthWidth / (faceWidth * 0.6));
    const rightBrowY = (points[19].y + points[20].y) / 2;
    const rightEyeY = (points[37].y + points[38].y) / 2;
    const leftBrowY = (points[23].y + points[24].y) / 2;
    const leftEyeY = (points[43].y + points[44].y) / 2;
    const avgBrowEyeDistance = Math.abs(((rightBrowY - rightEyeY) + (leftBrowY - leftEyeY)) / 2);
    const eyebrowRaise = Math.max(0, Math.min(1, avgBrowEyeDistance / 15));
    const mouthHeight = Math.abs(points[66].y - points[62].y);
    const mouthOpen = Math.min(1, mouthHeight / 20);
    return {eyeOpenness, smileWidth, eyebrowRaise, mouthOpen};
  }

  smoothMetrics(currentMetrics) {
    const smoothed = {};
    for (const key in currentMetrics) {
      const current = currentMetrics[key];
      const previous = this.previousMetrics[key] || current;
      smoothed[key] = this.smoothingAlpha * current + (1 - this.smoothingAlpha) * previous;
      this.previousMetrics[key] = smoothed[key];
    }
    return smoothed;
  }

  mapToLearningState(expressions, landmarks) {
    const happy = expressions.happy * 100;
    const neutral = expressions.neutral * 100;
    const angry = expressions.angry * 100;
    const surprised = expressions.surprised * 100;
    const sad = expressions.sad * 100;
    const fearful = expressions.fearful * 100;
    const disgusted = expressions.disgusted * 100;
    const eyeOpenness = landmarks.eyeOpenness;
    const eyesClosed = eyeOpenness < 0.3;
    if (eyesClosed) {
      if (this.eyeClosureStartTime === null) {
        this.eyeClosureStartTime = Date.now();
      } else {
        const duration = Date.now() - this.eyeClosureStartTime;
        if (duration > this.BOREDOM_THRESHOLD_MS) {
          console.log('BORED: Eyes closed');
          return 'bored';
        }
      }
    } else {
      this.eyeClosureStartTime = null;
    }
    if (happy >= 85) {
      console.log('FOCUSED: Happy');
      return 'focused';
    }
    if (neutral >= 85) {
      console.log('FOCUSED: Neutral');
      return 'focused';
    }
    if (angry >= 75) {
      console.log('CONFUSED: Angry');
      return 'confused';
    }
    if (surprised >= 80) {
      console.log('CONFUSED: Surprised');
      return 'confused';
    }
    if (sad >= 60) {
      console.log('BORED: Sad');
      return 'bored';
    }
    if (surprised >= 60 || fearful >= 60) {
      console.log('CONFUSED: Moderate surprise/fear');
      return 'confused';
    }
    if (angry >= 60) {
      console.log('CONFUSED: Moderate angry');
      return 'confused';
    }
    if (disgusted >= 50) {
      console.log('BORED: Disgusted');
      return 'bored';
    }
    if (sad >= 40) {
      console.log('BORED: Moderate sad');
      return 'bored';
    }
    if (eyeOpenness < 0.5 && happy < 20 && neutral > 40) {
      console.log('BORED: Tired');
      return 'bored';
    }
    if (happy > 30 || neutral > 50) {
      console.log('FOCUSED: Default positive');
      return 'focused';
    }
    console.log('FOCUSED: Fallback');
    return 'focused';
  }

  calculateConfidence(expressions, landmarks, learningState) {
    const values = Object.values(expressions);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const expressionClarity = Math.min((max - avg) * 2.5, 1);
    let movementClarity = 0;
    switch(learningState) {
      case 'focused': movementClarity = Math.max(landmarks.eyeOpenness, landmarks.smileWidth * 0.8); break;
      case 'confused': movementClarity = Math.max(landmarks.eyebrowRaise, landmarks.mouthOpen * 0.7); break;
      case 'bored': movementClarity = Math.max(1 - landmarks.eyeOpenness, 1 - landmarks.smileWidth); break;
      default: movementClarity = 0.5;
    }
    const confidence = (expressionClarity * 0.6) + (movementClarity * 0.4);
    return Math.max(0.4, Math.min(confidence, 1.0));
  }

  logDetection(expressions, landmarks, state, confidence) {
    console.log('============ Emotion Detection ============');
    const sorted = Object.entries(expressions).sort(([, a], [, b]) => b - a).slice(0, 4);
    console.log('Raw Expressions:');
    sorted.forEach(([e, v]) => console.log(`  ${e}: ${(v*100).toFixed(1)}%`));
    console.log('Landmarks:');
    console.log(`  Eyes: ${(landmarks.eyeOpenness*100).toFixed(0)}%`);
    console.log(`  Smile: ${(landmarks.smileWidth*100).toFixed(0)}%`);
    console.log(`State: ${state.toUpperCase()}`);
    console.log(`Confidence: ${(confidence*100).toFixed(0)}%`);
    console.log('===========================================');
  }

  addToHistory(result) {
    this.detectionHistory.push({
      emotion: result.learningState,
      confidence: result.confidence,
      timestamp: result.timestamp
    });
    if (this.detectionHistory.length > this.maxHistoryLength) {
      this.detectionHistory.shift();
    }
  }

  getDominantExpression(expressions) {
    let maxExpression = 'neutral';
    let maxValue = 0;
    Object.keys(expressions).forEach(expression => {
      if (expressions[expression] > maxValue) {
        maxValue = expressions[expression];
        maxExpression = expression;
      }
    });
    return maxExpression;
  }

  getEmotionBreakdown(expressions) {
    return Object.entries(expressions)
      .map(([emotion, value]) => ({
        emotion,
        value: Math.round(value * 100),
        percentage: `${Math.round(value * 100)}%`
      }))
      .sort((a, b) => b.value - a.value);
  }

  startDetection(videoElement, callback, interval = 1000) {
    if (this.detectionInterval) return;
    console.log('Starting detection...');
    this.detectionInterval = setInterval(async () => {
      const result = await this.detectEmotion(videoElement);
      if (result && callback) callback(result);
    }, interval);
  }

  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      this.eyeClosureStartTime = null;
      console.log('Stopped detection');
    }
  }

  isReady() {
    return this.modelsLoaded;
  }

  getHistory() {
    return this.detectionHistory;
  }

  clearHistory() {
    this.detectionHistory = [];
    this.eyeClosureStartTime = null;
  }
}

export const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;
