import * as faceapi from 'face-api.js';

class FaceDetectionService {
  constructor() {
    this.modelsLoaded = false;
    this.isLoading = false;
    this.detectionInterval = null;
    
    // 🆕 Smoothing for landmark-based detection
    this.smoothingAlpha = 0.6; // Higher = more responsive, Lower = smoother
    this.previousMetrics = {
      eyebrowRaise: 0,
      smileWidth: 0,
      eyeOpenness: 0,
      mouthOpen: 0,
      browFurrow: 0
    };
    
    // History for temporal smoothing
    this.metricsHistory = [];
    this.maxHistoryLength = 5; // Keep last 5 frames
  }

  async loadModels() {
    if (this.modelsLoaded || this.isLoading) {
      console.log('Models already loaded or loading...');
      return this.modelsLoaded;
    }

    this.isLoading = true;
    console.log('📦 Loading face-api.js models...');

    try {
      // Load models from public/models directory
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // ✅ Already loaded
      ]);

      this.modelsLoaded = true;
      this.isLoading = false;
      console.log('✅ Face detection models loaded successfully!');
      return true;
    } catch (error) {
      this.isLoading = false;
      console.error('❌ Error loading face-api.js models:', error);
      console.error('Make sure model files are in /public/models/ directory');
      return false;
    }
  }

  async detectEmotion(videoElement) {
    if (!this.modelsLoaded) {
      console.warn('⚠️ Models not loaded yet');
      return null;
    }

    if (!videoElement || videoElement.readyState !== 4) {
      console.warn('⚠️ Video element not ready');
      return null;
    }

    try {
      // 🎯 ENHANCED: Detect face with BOTH landmarks and expressions
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,  // Higher resolution for better accuracy
          scoreThreshold: 0.3
        }))
        .withFaceLandmarks()  // ✅ KEY ADDITION: 68-point facial landmarks
        .withFaceExpressions();

      if (!detection) {
        console.log('👤 No face detected in frame');
        return null;
      }

      // Get expressions and landmarks
      const expressions = detection.expressions;
      const landmarks = detection.landmarks;
      
      // 🆕 LANDMARK-BASED EMOTION METRICS
      const landmarkMetrics = this.analyzeLandmarks(landmarks);
      
      // 🆕 SMOOTH THE METRICS to avoid jitter
      const smoothedMetrics = this.smoothMetrics(landmarkMetrics);
      
      // Log raw expressions for debugging
      console.log('📊 Raw expressions:', {
        happy: (expressions.happy * 100).toFixed(1) + '%',
        sad: (expressions.sad * 100).toFixed(1) + '%',
        angry: (expressions.angry * 100).toFixed(1) + '%',
        fearful: (expressions.fearful * 100).toFixed(1) + '%',
        disgusted: (expressions.disgusted * 100).toFixed(1) + '%',
        surprised: (expressions.surprised * 100).toFixed(1) + '%',
        neutral: (expressions.neutral * 100).toFixed(1) + '%'
      });
      
      console.log('🎭 Landmark metrics:', {
        eyebrowRaise: smoothedMetrics.eyebrowRaise.toFixed(2),
        smileWidth: smoothedMetrics.smileWidth.toFixed(2),
        eyeOpenness: smoothedMetrics.eyeOpenness.toFixed(2),
        mouthOpen: smoothedMetrics.mouthOpen.toFixed(2),
        browFurrow: smoothedMetrics.browFurrow.toFixed(2)
      });
      
      // 🆕 FUSION: Combine landmarks + expressions for better accuracy
      const learningState = this.mapToLearningStateAdvanced(expressions, smoothedMetrics);
      
      // Get confidence based on both sources
      const confidence = this.getAdvancedConfidence(expressions, smoothedMetrics, learningState);
      
      console.log('🎯 Learning State:', learningState, `(${Math.round(confidence * 100)}% confidence)`);

      return {
        expressions,
        landmarks: smoothedMetrics, // Include landmark data
        learningState,
        confidence,
        faceDetected: true,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error detecting emotion:', error);
      return null;
    }
  }

  /**
   * 🆕 Analyze facial landmarks to extract emotion-related metrics
   * Returns normalized metrics (0-1 scale) for key facial movements
   */
  analyzeLandmarks(landmarks) {
    const points = landmarks.positions;
    
    // Key landmark indices (68-point model):
    // Eyebrows: 17-21 (right), 22-26 (left)
    // Eyes: 36-41 (right), 42-47 (left)
    // Nose: 27-35
    // Mouth: 48-67
    // Jaw: 0-16
    
    // 1. EYEBROW RAISE (confusion/surprise indicator)
    // Distance between eyebrow center and eye center
    const rightBrowY = (points[19].y + points[20].y) / 2; // Right eyebrow middle
    const rightEyeY = (points[37].y + points[38].y) / 2; // Right eye top
    const leftBrowY = (points[23].y + points[24].y) / 2; // Left eyebrow middle
    const leftEyeY = (points[43].y + points[44].y) / 2; // Left eye top
    
    const avgBrowEyeDistance = ((rightBrowY - rightEyeY) + (leftBrowY - leftEyeY)) / 2;
    const eyebrowRaise = Math.max(0, Math.min(1, avgBrowEyeDistance / 15)); // Normalize
    
    // 2. SMILE WIDTH (happiness/engagement indicator)
    // Distance between mouth corners
    const mouthLeftCorner = points[48]; // Left corner
    const mouthRightCorner = points[54]; // Right corner
    const mouthWidth = Math.abs(mouthRightCorner.x - mouthLeftCorner.x);
    const faceWidth = Math.abs(points[16].x - points[0].x); // Jaw width
    const smileWidth = Math.min(1, mouthWidth / (faceWidth * 0.6)); // Normalize to face width
    
    // 3. EYE OPENNESS (tiredness indicator)
    // Vertical distance of eye opening
    const rightEyeHeight = Math.abs(points[37].y - points[41].y); // Right eye top-bottom
    const leftEyeHeight = Math.abs(points[43].y - points[47].y); // Left eye top-bottom
    const avgEyeHeight = (rightEyeHeight + leftEyeHeight) / 2;
    const eyeOpenness = Math.min(1, avgEyeHeight / 8); // Normalize
    
    // 4. MOUTH OPENNESS (surprise/confusion indicator)
    // Vertical distance of mouth opening
    const mouthTop = points[62].y; // Upper lip center
    const mouthBottom = points[66].y; // Lower lip center
    const mouthHeight = Math.abs(mouthBottom - mouthTop);
    const mouthOpen = Math.min(1, mouthHeight / 20); // Normalize
    
    // 5. BROW FURROW (concentration/confusion/anger indicator)
    // Distance between inner eyebrow points
    const innerBrowDistance = Math.abs(points[21].x - points[22].x); // Inner eyebrow corners
    const browFurrow = Math.max(0, Math.min(1, 1 - (innerBrowDistance / 20))); // Closer = more furrowed
    
    // 6. MOUTH CORNERS DOWN (sadness/boredom indicator) - NEW!
    // Check if mouth corners are lower than the center of the mouth
    const mouthCenterY = points[62].y; // Upper lip center (reference point)
    const leftCornerY = points[48].y; // Left mouth corner
    const rightCornerY = points[54].y; // Right mouth corner
    const avgCornerY = (leftCornerY + rightCornerY) / 2;
    
    // If corners are BELOW center, it's a frown (positive value)
    // If corners are ABOVE center, it's a smile (negative value, clamped to 0)
    const mouthCornersDown = Math.max(0, Math.min(1, (avgCornerY - mouthCenterY) / 10));
    
    return {
      eyebrowRaise,
      smileWidth,
      eyeOpenness,
      mouthOpen,
      browFurrow,
      mouthCornersDown  // NEW: Direct sadness indicator
    };
  }

  /**
   * 🆕 Smooth metrics using exponential moving average to reduce jitter
   */
  smoothMetrics(currentMetrics) {
    const smoothed = {};
    
    for (const key in currentMetrics) {
      const current = currentMetrics[key];
      const previous = this.previousMetrics[key] || current;
      
      // Exponential smoothing formula
      smoothed[key] = this.smoothingAlpha * current + (1 - this.smoothingAlpha) * previous;
      
      // Update previous for next frame
      this.previousMetrics[key] = smoothed[key];
    }
    
    // Add to history for temporal analysis
    this.metricsHistory.push(smoothed);
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory.shift();
    }
    
    return smoothed;
  }

  /**
   * 🆕 ADVANCED: Map to learning state using BOTH expressions AND landmarks
   * This fusion approach is more accurate than using either alone
   */
  mapToLearningStateAdvanced(expressions, landmarks) {
    const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions;
    const { eyebrowRaise, smileWidth, eyeOpenness, mouthOpen, browFurrow, mouthCornersDown } = landmarks;
    
    console.log('🔬 Advanced emotion analysis...');
    console.log('📊 Expression values:', { 
      happy: (happy * 100).toFixed(1) + '%', 
      sad: (sad * 100).toFixed(1) + '%', 
      surprised: (surprised * 100).toFixed(1) + '%', 
      neutral: (neutral * 100).toFixed(1) + '%',
      angry: (angry * 100).toFixed(1) + '%'
    });
    console.log('🎭 Landmark values:', { 
      eyebrowRaise: eyebrowRaise.toFixed(2), 
      smileWidth: smileWidth.toFixed(2), 
      eyeOpenness: eyeOpenness.toFixed(2),
      mouthOpen: mouthOpen.toFixed(2),
      mouthCornersDown: mouthCornersDown.toFixed(2)
    });
    
    // 1. CONFUSED: High eyebrow raise + mouth open + surprise/fear
    const confusionScore = (
      eyebrowRaise * 0.4 +
      mouthOpen * 0.2 +
      browFurrow * 0.2 +
      surprised * 0.15 +
      fearful * 0.05
    );
    
    console.log(`💡 Confusion score: ${confusionScore.toFixed(3)} (threshold: 0.15)`);
    if (confusionScore > 0.15 || eyebrowRaise > 0.3 || surprised > 0.2) {
      console.log(`✅ CONFUSED triggered!`);
      return 'confused';
    }
    
    // 2. TIRED: ENHANCED - Multiple indicators for fatigue
    const tiredScore = (
      (1 - eyeOpenness) * 0.45 +      // Droopy eyes (strongest)
      (1 - smileWidth) * 0.15 +       // No energy for smile
      neutral * 0.15 +                // Blank expression
      sad * 0.15 +                    // Slight sadness
      (1 - eyebrowRaise) * 0.1        // Low eyebrows (relaxed/tired)
    );
    
    console.log(`💡 Tired score: ${tiredScore.toFixed(3)} (threshold: 0.20), eye openness: ${eyeOpenness.toFixed(2)} (threshold: 0.55)`);
    // IMPROVED: Lower thresholds + multiple trigger conditions
    if (tiredScore > 0.20 || eyeOpenness < 0.55 || (neutral > 0.6 && eyeOpenness < 0.65)) {
      console.log(`✅ TIRED triggered! (${eyeOpenness < 0.55 ? 'eyes closing' : tiredScore > 0.20 ? 'fatigue score' : 'neutral + drowsy'})`);
      return 'tired';
    }
    
    // 3. BORED: ENHANCED with mouth corners down (frown detection)
    const boredScore = (
      mouthCornersDown * 0.30 +       // Direct frown detection
      sad * 0.25 +                    // Sad expression
      (1 - smileWidth) * 0.20 +       // No smile
      neutral * 0.15 +                // Emotionless/flat
      disgusted * 0.10                // Disgust expression
    );
    
    console.log(`💡 Bored score: ${boredScore.toFixed(3)} (threshold: 0.12), mouthDown: ${mouthCornersDown.toFixed(2)}, sad: ${(sad * 100).toFixed(1)}%, neutral: ${(neutral * 100).toFixed(1)}%`);
    // IMPROVED: Lower threshold + more trigger conditions
    if (boredScore > 0.12 || mouthCornersDown > 0.25 || sad > 0.10 || (neutral > 0.55 && smileWidth < 0.35) || (mouthCornersDown > 0.15 && neutral > 0.4)) {
      console.log(`✅ BORED triggered! (${mouthCornersDown > 0.25 ? 'frowning' : sad > 0.10 ? 'sad expression' : boredScore > 0.12 ? 'boredom score' : 'neutral + no smile'})`);
      return 'bored';
    }
    
    // 4. FOCUSED: Default
    console.log(`✅ FOCUSED (default)`);
    return 'focused';
  }

  /**
   * 🆕 Calculate confidence based on both expression probabilities and landmark clarity
   */
  getAdvancedConfidence(expressions, landmarks, learningState) {
    // 1. Expression confidence (how clear the emotion is)
    const values = Object.values(expressions);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const expressionClarity = Math.min((max - avg) * 2, 1);
    
    // 2. Landmark confidence (how pronounced the facial movements are)
    let landmarkClarity = 0;
    switch(learningState) {
      case 'confused':
        landmarkClarity = (landmarks.eyebrowRaise + landmarks.browFurrow) / 2;
        break;
      case 'tired':
        landmarkClarity = 1 - landmarks.eyeOpenness;
        break;
      case 'bored':
        landmarkClarity = (1 - landmarks.smileWidth + 1 - landmarks.eyeOpenness) / 2;
        break;
      case 'focused':
        landmarkClarity = (landmarks.eyeOpenness + landmarks.smileWidth) / 2;
        break;
    }
    
    // 3. Temporal stability (consistency over recent frames)
    let temporalStability = 0.5;
    if (this.metricsHistory.length >= 3) {
      const recentStates = this.metricsHistory.slice(-3);
      const variance = this.calculateVariance(recentStates);
      temporalStability = Math.max(0.3, 1 - variance);
    }
    
    // 4. Fusion: Weighted combination
    const finalConfidence = (
      expressionClarity * 0.3 +
      landmarkClarity * 0.5 +
      temporalStability * 0.2
    );
    
    return Math.max(0.3, Math.min(finalConfidence, 1.0));
  }

  /**
   * Calculate variance of metrics over time (for stability)
   */
  calculateVariance(metricsArray) {
    if (metricsArray.length === 0) return 1;
    
    const keys = Object.keys(metricsArray[0]);
    let totalVariance = 0;
    
    keys.forEach(key => {
      const values = metricsArray.map(m => m[key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    });
    
    return totalVariance / keys.length;
  }

  // Keep original method as fallback
  mapToLearningState(expressions) {
    const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions;
    
    if (surprised > 0.25 || fearful > 0.2) {
      return 'confused';
    }
    
    const significantEmotions = [happy, sad, angry, fearful, disgusted, surprised]
      .filter(val => val > 0.12).length;
    if (significantEmotions >= 3 && neutral < 0.4) {
      return 'confused';
    }
    
    if (sad > 0.25 || disgusted > 0.2) {
      return 'bored';
    }
    
    if (neutral > 0.75 && happy < 0.1 && surprised < 0.1) {
      return 'bored';
    }
    
    if (neutral > 0.45 && sad > 0.15 && sad < 0.35 && happy < 0.15) {
      return 'tired';
    }
    
    if (angry > 0.2 && angry < 0.5 && happy < 0.12 && surprised < 0.12) {
      return 'tired';
    }
    
    if (happy > 0.25) {
      return 'focused';
    }
    
    if (neutral >= 0.35 && neutral <= 0.65 && happy >= 0.12 && sad < 0.15) {
      return 'focused';
    }
    
    return 'focused';
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

  getConfidence(expressions, learningState) {
    const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions;
    
    let stateScore = 0;
    
    switch(learningState) {
      case 'confused':
        stateScore = Math.max(surprised, fearful);
        break;
      case 'bored':
        stateScore = Math.max(sad, disgusted, (neutral > 0.75 ? neutral : 0));
        break;
      case 'tired':
        stateScore = (neutral * 0.5 + sad * 0.3 + angry * 0.2);
        break;
      case 'focused':
        stateScore = Math.max(happy, (neutral >= 0.35 && neutral <= 0.65 ? 0.6 : neutral * 0.5));
        break;
      default:
        stateScore = 0.5;
    }
    
    const values = Object.values(expressions);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const clarity = Math.min((max - avg) * 2, 1);
    
    const confidence = (stateScore * 0.7) + (clarity * 0.3);
    
    return Math.max(Math.min(confidence, 1.0), 0.2);
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
    if (this.detectionInterval) {
      console.log('Detection already running');
      return;
    }

    console.log('🎥 Starting emotion detection...');
    
    this.detectionInterval = setInterval(async () => {
      const result = await this.detectEmotion(videoElement);
      if (result && callback) {
        callback(result);
      }
    }, interval);
  }

  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      console.log('⏹️ Stopped emotion detection');
    }
  }

  isReady() {
    return this.modelsLoaded;
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;
