import * as faceapi from 'face-api.js';

class FaceDetectionService {
  constructor() {
    this.modelsLoaded = false;
    this.isLoading = false;
    this.detectionInterval = null;
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
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
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
      // Detect face with expressions - IMPROVED SETTINGS FOR ACCURACY
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,  // Increased from 224 for better accuracy
          scoreThreshold: 0.3  // Lowered from 0.5 to detect faces more reliably
        }))
        .withFaceExpressions();

      if (!detection) {
        console.log('👤 No face detected in frame');
        return null;
      }

      // Get expressions
      const expressions = detection.expressions;
      
      // Log raw expressions for debugging
      console.log('� Raw expressions:', {
        happy: (expressions.happy * 100).toFixed(1) + '%',
        sad: (expressions.sad * 100).toFixed(1) + '%',
        angry: (expressions.angry * 100).toFixed(1) + '%',
        fearful: (expressions.fearful * 100).toFixed(1) + '%',
        disgusted: (expressions.disgusted * 100).toFixed(1) + '%',
        surprised: (expressions.surprised * 100).toFixed(1) + '%',
        neutral: (expressions.neutral * 100).toFixed(1) + '%'
      });
      
      // Map to learning state
      const learningState = this.mapToLearningState(expressions);
      
      // Get confidence
      const confidence = this.getConfidence(expressions, learningState);
      
      console.log('🎯 Learning State:', learningState, `(${Math.round(confidence * 100)}% confidence)`);

      return {
        expressions,
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

  mapToLearningState(expressions) {
    // Get all expression values
    const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions;
    
    console.log('📊 Analyzing expressions for learning state...');
    
    // IMPROVED MAPPING LOGIC - Tuned for classroom/learning context
    
    // 1. CONFUSED: Surprise, fear, or furrowed brow (uncertainty)
    // Students often look surprised or slightly fearful when confused
    if (surprised > 0.25 || fearful > 0.2) {
      console.log('→ CONFUSED detected (surprise/fear indicators)');
      return 'confused';
    }
    
    // Multiple competing emotions = cognitive load/confusion
    const significantEmotions = [happy, sad, angry, fearful, disgusted, surprised]
      .filter(val => val > 0.12).length;
    if (significantEmotions >= 3 && neutral < 0.4) {
      console.log('→ CONFUSED detected (mixed emotions)');
      return 'confused';
    }
    
    // 2. BORED: Sadness, disgust, or very flat affect
    if (sad > 0.25 || disgusted > 0.2) {
      console.log('→ BORED detected (sad/disgusted)');
      return 'bored';
    }
    
    // Extremely neutral (flat affect) with no positive emotions = disengagement
    if (neutral > 0.75 && happy < 0.1 && surprised < 0.1) {
      console.log('→ BORED detected (flat affect)');
      return 'bored';
    }
    
    // 3. TIRED: Subtle indicators of fatigue
    // Combination of neutral + slight sadness (droopy eyes, etc.)
    if (neutral > 0.45 && sad > 0.15 && sad < 0.35 && happy < 0.15) {
      console.log('→ TIRED detected (neutral + slight sadness)');
      return 'tired';
    }
    
    // Mild anger (irritation from fatigue) without other strong emotions
    if (angry > 0.2 && angry < 0.5 && happy < 0.12 && surprised < 0.12) {
      console.log('→ TIRED detected (mild irritation)');
      return 'tired';
    }
    
    // 4. FOCUSED/ENGAGED: Positive or attentive states
    // Clear happiness = engagement
    if (happy > 0.25) {
      console.log('→ FOCUSED detected (happy/engaged)');
      return 'focused';
    }
    
    // Calm, attentive state: moderate neutral with slight positive affect
    if (neutral >= 0.35 && neutral <= 0.65 && happy >= 0.12 && sad < 0.15) {
      console.log('→ FOCUSED detected (calm attention)');
      return 'focused';
    }
    
    // Slight surprise (interest/curiosity) with positive baseline
    if (surprised > 0.15 && surprised < 0.25 && happy > 0.15) {
      console.log('→ FOCUSED detected (curious)');
      return 'focused';
    }
    
    // 5. DEFAULT: Assume focused (give benefit of doubt)
    console.log('→ FOCUSED (default - benefit of doubt)');
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
    // Improved confidence calculation based on emotional clarity
    const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions;
    
    // Get the relevant expressions for this state
    let stateScore = 0;
    
    switch(learningState) {
      case 'confused':
        // High surprise or fear = high confidence
        stateScore = Math.max(surprised, fearful);
        break;
      case 'bored':
        // Clear boredom indicators
        stateScore = Math.max(sad, disgusted, (neutral > 0.75 ? neutral : 0));
        break;
      case 'tired':
        // Fatigue combination score
        stateScore = (neutral * 0.5 + sad * 0.3 + angry * 0.2);
        break;
      case 'focused':
        // Engagement indicators
        stateScore = Math.max(happy, (neutral >= 0.35 && neutral <= 0.65 ? 0.6 : neutral * 0.5));
        break;
      default:
        stateScore = 0.5;
    }
    
    // Calculate clarity (how dominant is the top emotion)
    const values = Object.values(expressions);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const clarity = Math.min((max - avg) * 2, 1); // How clear/distinct the emotion is
    
    // Final confidence: weighted combination of state score and clarity
    const confidence = (stateScore * 0.7) + (clarity * 0.3);
    
    // Ensure confidence is between 0.2 and 1.0
    return Math.max(Math.min(confidence, 1.0), 0.2);
  }

  // Get detailed emotion breakdown
  getEmotionBreakdown(expressions) {
    return Object.entries(expressions)
      .map(([emotion, value]) => ({
        emotion,
        value: Math.round(value * 100),
        percentage: `${Math.round(value * 100)}%`
      }))
      .sort((a, b) => b.value - a.value);
  }

  // Start continuous detection
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

  // Stop continuous detection
  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      console.log('⏹️ Stopped emotion detection');
    }
  }

  // Check if models are ready
  isReady() {
    return this.modelsLoaded;
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;