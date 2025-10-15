import { useState, useCallback, useRef } from 'react';
import geminiService from '../services/geminiService';

export const useChatBox = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [chatBoxRef, setChatBoxRef] = useState(null);
  const [apiConnected, setApiConnected] = useState(null);
  const lastClarificationTime = useRef(null);
  const CLARIFICATION_COOLDOWN_MS = 10000; // 10 seconds cooldown

  // Test API connection on first load
  const testApiConnection = useCallback(async () => {
    try {
      const result = await geminiService.testConnection();
      setApiConnected(result.success);
      if (result.success) {
        console.log('✅ Gemini API connected successfully');
      } else {
        console.error('❌ Gemini API connection failed:', result.error);
      }
      return result.success;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      setApiConnected(false);
      return false;
    }
  }, []);

  const handleSendMessage = useCallback(async (message, emotionalState = null) => {
    console.log('Student asked:', message);
    if (emotionalState) {
      console.log('Detected emotion:', emotionalState);
    }
    
    // Set typing indicator
    setIsTyping(true);
    
    try {
      // Test connection if not already tested
      if (apiConnected === null) {
        const connected = await testApiConnection();
        if (!connected) {
          throw new Error('API connection failed');
        }
      }

      // Get AI response from Gemini
      const aiResponse = await geminiService.generateResponse(message, emotionalState);
      
      // Add AI response to chat
      if (chatBoxRef?.addAIResponse) {
        chatBoxRef.addAIResponse(aiResponse);
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      const fallbackResponse = apiConnected === false 
        ? "I'm having trouble connecting to my AI brain. Please check your internet connection and try again."
        : generateMockResponse(message);
        
      if (chatBoxRef?.addAIResponse) {
        chatBoxRef.addAIResponse(fallbackResponse);
      }
    } finally {
      setIsTyping(false);
    }
  }, [chatBoxRef, apiConnected, testApiConnection]);

  const addAIResponse = useCallback((response) => {
    if (chatBoxRef?.addAIResponse) {
      chatBoxRef.addAIResponse(response);
    }
  }, [chatBoxRef]);

  const clearConversation = useCallback(() => {
    geminiService.clearHistory();
    if (chatBoxRef?.clearMessages) {
      chatBoxRef.clearMessages();
    }
  }, [chatBoxRef]);

  const handleConfusedState = useCallback(async () => {
    // Don't interrupt if AI is already typing
    if (isTyping) {
      console.log('⚠️ AI is typing, skipping auto-clarification');
      return;
    }

    // Check cooldown to prevent continuous clarifications
    const now = Date.now();
    if (lastClarificationTime.current) {
      const timeSinceLastClarification = now - lastClarificationTime.current;
      if (timeSinceLastClarification < CLARIFICATION_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((CLARIFICATION_COOLDOWN_MS - timeSinceLastClarification) / 1000);
        console.log(`⏳ Cooldown active - ${remainingSeconds}s remaining before next auto-clarification`);
        return;
      }
    }

    console.log('🔄 Student confused - generating simplified explanation...');
    
    try {
      const simplifiedText = await geminiService.generateSimplifiedExplanation();
      
      if (simplifiedText && chatBoxRef?.addAIResponse) {
        const autoClarificationMessage = `🔄 **Auto-Clarification** _(I noticed you looked confused)_\n\n${simplifiedText}`;
        chatBoxRef.addAIResponse(autoClarificationMessage);
        lastClarificationTime.current = now;
        console.log('✅ Auto-clarification sent (30s cooldown started)');
      }
    } catch (error) {
      console.error('❌ Error generating auto-clarification:', error);
    }
  }, [isTyping, chatBoxRef]);

  return {
    isTyping,
    handleSendMessage,
    addAIResponse,
    setChatBoxRef,
    clearConversation,
    handleConfusedState,
    apiConnected,
    testApiConnection
  };
};

// Mock AI response generator (replace with actual AI integration)
const generateMockResponse = (message) => {
  const responses = {
    // Physics topics
    'newton': "Newton's Laws describe the relationship between forces and motion:\n\n1st Law: Objects at rest stay at rest, objects in motion stay in motion (unless acted upon by a force)\n2nd Law: F = ma (Force equals mass times acceleration)\n3rd Law: For every action, there's an equal and opposite reaction\n\nWould you like me to explain any of these in more detail?",
    
    'gravity': "Gravity is a fundamental force that attracts objects with mass toward each other. On Earth, it pulls everything toward the center at 9.8 m/s². The more massive an object, the stronger its gravitational pull. This is why planets orbit stars and why things fall down instead of up!",
    
    // Math topics
    'algebra': "Algebra is about finding unknown values using equations. We use letters (like x or y) to represent unknown numbers, then solve to find what those letters equal. For example: if x + 5 = 12, then x = 7.",
    
    'calculus': "Calculus studies how things change. There are two main parts:\n- Derivatives: How fast something changes (like speed from distance)\n- Integrals: Adding up all the small changes (like finding area under a curve)\n\nIt's used everywhere from physics to economics!",
    
    // Default responses
    'default': [
      "That's a great question! Let me break this down for you step by step.",
      "I'd be happy to help you understand this topic better!",
      "That's an interesting topic. Let me explain it in a way that makes sense.",
      "Great question! Here's how I like to think about this concept..."
    ]
  };

  const lowerMessage = message.toLowerCase();
  
  // Check for keywords
  for (const [keyword, response] of Object.entries(responses)) {
    if (keyword !== 'default' && lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  // Return random default response
  const defaultResponses = responses.default;
  const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  
  return `${randomResponse}\n\nYou asked about: "${message}"\n\nI'm still learning about this topic. Could you be more specific about what aspect you'd like me to explain?`;
};

export default useChatBox;