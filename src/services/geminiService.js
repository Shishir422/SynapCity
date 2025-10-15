import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
// IMPORTANT: API key should only be loaded from environment variable
// Never commit the .env file to version control
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('🔑 Initializing Gemini API...');
console.log('API Key present:', !!API_KEY);

if (!API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY not found in environment variables!');
  console.error('📝 Please create a .env file with: VITE_GEMINI_API_KEY=your_key_here');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

class GeminiService {
  constructor() {
    if (!genAI) {
      console.error('❌ Cannot initialize GeminiService: API key missing');
      this.model = null;
      this.conversationHistory = [];
      return;
    }

    // List of models to try (in order of preference for free tier)
    this.modelNames = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-pro',
    ];
    
    this.currentModelIndex = 0;
    this.initializeModel();
    this.conversationHistory = [];
  }

  initializeModel() {
    const modelName = this.modelNames[this.currentModelIndex];
    console.log(`🤖 Initializing model: ${modelName}`);
    
    this.model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
  }

  async tryNextModel() {
    this.currentModelIndex++;
    if (this.currentModelIndex < this.modelNames.length) {
      console.log(`⚠️ Trying next model...`);
      this.initializeModel();
      return true;
    }
    return false;
  }

  async generateResponse(userMessage, emotionalState = null) {
    try {
      if (!this.model) {
        return "⚠️ API Configuration Error: The Gemini API key is not configured. Please check your .env file.";
      }

      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(emotionalState);
      const fullPrompt = `${systemPrompt}\n\nStudent: ${userMessage}\n\nSynapCity:`;

      console.log('📤 Sending request to Gemini API...');
      console.log('Using model:', this.modelNames[this.currentModelIndex]);
      
      // Generate response
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Received response from Gemini API');

      // Store in conversation history
      this.conversationHistory.push({
        user: userMessage,
        ai: text,
        emotion: emotionalState,
        timestamp: new Date()
      });

      return text;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
      });
      
      // Try next model if available
      if (error.message.includes('404') || error.message.includes('not found')) {
        const hasNextModel = await this.tryNextModel();
        if (hasNextModel) {
          console.log('🔄 Retrying with different model...');
          return this.generateResponse(userMessage, emotionalState);
        }
      }
      
      return this.getErrorResponse(error);
    }
  }

  // Get the last user question for re-explanation
  getLastUserQuestion() {
    if (this.conversationHistory.length === 0) {
      return null;
    }
    const lastEntry = this.conversationHistory[this.conversationHistory.length - 1];
    return {
      question: lastEntry.user,
      answer: lastEntry.ai
    };
  }

  // Generate simplified explanation when student becomes confused
  async generateSimplifiedExplanation() {
    try {
      if (!this.model) {
        return null;
      }

      const lastQA = this.getLastUserQuestion();
      if (!lastQA) {
        console.log('📭 No previous conversation to simplify');
        return null;
      }

      console.log('🔄 Student confused! Simplifying previous answer...');
      console.log('📝 Previous question:', lastQA.question);

      const simplifyPrompt = `The student just looked confused after reading your explanation.

Their question was: "${lastQA.question}"

Your previous answer was: "${lastQA.answer}"

Please provide a MUCH SIMPLER explanation:
- Use only 2-3 SHORT sentences
- Include ONE easy real-world example
- Use simple everyday language (no technical terms)
- Focus ONLY on the main idea

Start with: "Let me explain that more simply..."`;

      console.log('📤 Generating simplified explanation...');
      
      const result = await this.model.generateContent(simplifyPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Simplified explanation ready');

      // Add to history with marker
      this.conversationHistory.push({
        user: '[AUTO-CLARIFICATION]',
        ai: text,
        emotion: 'confused',
        timestamp: new Date()
      });

      return text;
    } catch (error) {
      console.error('❌ Error generating simplified explanation:', error);
      return null;
    }
  }

  buildSystemPrompt(emotionalState) {
    let basePrompt = `You are SynapCity, an emotion-aware AI tutor designed to help students learn effectively. You should:

- Provide clear, educational explanations
- Break down complex topics into understandable parts
- Use examples and analogies when helpful
- Ask follow-up questions to ensure understanding
- Be encouraging and supportive
- Adapt your teaching style based on the student's needs

Keep responses concise but comprehensive (2-4 paragraphs maximum).`;

    // Adapt prompt based on detected emotion
    if (emotionalState) {
      switch (emotionalState.toLowerCase()) {
        case 'confused':
          basePrompt += `\n\nIMPORTANT: The student appears confused. Provide a simpler explanation, break the topic into smaller steps, and use concrete examples. Ask if they need clarification on any specific part.`;
          break;
        case 'bored':
          basePrompt += `\n\nIMPORTANT: The student appears bored or disengaged. Make your explanation more engaging with interesting facts, real-world applications, or interactive questions. Use analogies and make it fun!`;
          break;
        case 'focused':
          basePrompt += `\n\nIMPORTANT: The student appears focused and engaged. You can provide more detailed information and introduce advanced concepts. Feel free to ask deeper questions.`;
          break;
        case 'tired':
          basePrompt += `\n\nIMPORTANT: The student appears tired or fatigued. Keep your explanation brief and easy to follow. Consider suggesting a short break or review of key points.`;
          break;
        default:
          basePrompt += `\n\nThe student's emotional state is: ${emotionalState}. Adapt your response accordingly.`;
      }
    }

    return basePrompt;
  }

  getErrorResponse(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorString = error.toString().toLowerCase();
    
    console.log('🔍 Processing error:', errorMessage);
    
    if (errorMessage.includes('api key') || errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
      return "⚠️ API Key Error: There seems to be an issue with the API key. Please verify it's correct and has the necessary permissions.";
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return "⏱️ Rate Limit: I'm experiencing high demand right now. Please wait a moment and try again.";
    } else if (errorMessage.includes('blocked') || errorMessage.includes('safety')) {
      return "🛡️ Content Filter: This question triggered a safety filter. Please try rephrasing it differently.";
    } else if (errorMessage.includes('fetch failed') || errorMessage.includes('network') || errorString.includes('failed to fetch')) {
      return "🌐 Connection Issue: Unable to reach the AI server. Please check:\n\n1. Your internet connection\n2. If you're behind a firewall or VPN\n3. Try refreshing the page\n\nIf the problem persists, the API key might need to be regenerated.";
    } else if (errorMessage.includes('cors')) {
      return "🔒 CORS Error: There's a cross-origin issue. This might be due to browser security settings.";
    } else {
      return `❌ Unexpected Error: ${error.message || 'An unknown error occurred'}\n\nPlease try:\n1. Refreshing the page\n2. Checking your internet connection\n3. Trying a different question`;
    }
  }

  // Method to get conversation history for context
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Method to clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Method to test API connection
  async testConnection() {
    try {
      console.log('🧪 Testing API connection...');
      
      // Try to list available models
      try {
        const models = await genAI.listModels();
        console.log('📋 Available models:', models);
      } catch (listError) {
        console.log('Could not list models:', listError.message);
      }
      
      const result = await this.model.generateContent("Say 'Hello, I'm SynapCity, your emotion-aware learning companion!' in a friendly way.");
      const response = await result.response;
      return { success: true, message: response.text() };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;