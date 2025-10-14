import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 600px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  font-weight: 600;
  text-align: center;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 400px;
  max-height: 450px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`;

const Message = styled.div`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 8px;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: ${props => props.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    : '#f5f5f5'};
  color: ${props => props.isUser ? 'white' : '#333'};
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MessageInfo = styled.div`
  font-size: 11px;
  color: ${props => props.isUser ? 'rgba(255,255,255,0.8)' : '#666'};
  margin-top: 4px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

const InputContainer = styled.div`
  display: flex;
  padding: 16px;
  gap: 12px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
  border-radius: 0 0 12px 12px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const SendButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 18px 18px 18px 4px;
  max-width: 70%;
  margin-bottom: 8px;
  
  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: typing 1.4s infinite ease-in-out;
    animation-delay: 0.2s;
  }
  
  span::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #999;
    animation: typing 1.4s infinite ease-in-out;
    animation-delay: 0.4s;
    display: inline-block;
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  
  h3 {
    margin-bottom: 8px;
    color: #333;
  }
  
  p {
    font-size: 14px;
    line-height: 1.4;
  }
`;

const ChatBox = React.forwardRef(({ onSendMessage, isTyping = false, className }, ref) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: Date.now(),
        text: inputValue.trim(),
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Call the parent's send message handler
      if (onSendMessage) {
        onSendMessage(inputValue.trim());
      }
      
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Function to add AI response (to be called from parent component)
  const addAIResponse = (text) => {
    const aiMessage = {
      id: Date.now() + Math.random(), // Ensure unique IDs
      text: text,
      isUser: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  // Function to clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  // Expose functions to parent component
  React.useImperativeHandle(ref, () => ({
    addAIResponse,
    clearMessages
  }));

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ChatContainer className={className}>
      <ChatHeader>
        🤖 AI Tutor - Ask me anything!
      </ChatHeader>
      
      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            <h3>Welcome to your AI Tutor! 👋</h3>
            <p>
              Ask me about any topic you'd like to learn.<br/>
              For example: "Explain Newton's Laws" or "How does gravity work?"
            </p>
          </EmptyState>
        ) : (
          messages.map((message) => (
            <Message key={message.id} isUser={message.isUser}>
              <div>
                <MessageBubble isUser={message.isUser}>
                  {message.text}
                </MessageBubble>
                <MessageInfo isUser={message.isUser}>
                  {message.isUser ? 'You' : 'AI Tutor'} • {formatTime(message.timestamp)}
                </MessageInfo>
              </div>
            </Message>
          ))
        )}
        
        {isTyping && (
          <Message isUser={false}>
            <TypingIndicator>
              <span></span>
              AI Tutor is thinking...
            </TypingIndicator>
          </Message>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question or enter a topic to learn..."
          disabled={isTyping}
        />
        <SendButton 
          onClick={handleSend} 
          disabled={!inputValue.trim() || isTyping}
        >
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
});

ChatBox.displayName = 'ChatBox';

export default ChatBox;