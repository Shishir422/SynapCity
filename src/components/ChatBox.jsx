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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px;
  max-height: 450px;
  background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%);
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #5568d3 0%, #653a8a 100%);
  }
`;

const Message = styled.div`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 4px;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MessageBubble = styled.div`
  max-width: 75%;
  padding: 16px 20px;
  border-radius: ${props => props.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'};
  color: ${props => props.isUser ? 'white' : '#2c3e50'};
  font-size: 15px;
  line-height: 1.8;
  word-wrap: break-word;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  white-space: pre-wrap;
  border: ${props => props.isUser ? 'none' : '1px solid #e8e8e8'};
  
  p {
    margin: 0 0 16px 0;
    line-height: 1.8;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  strong, b {
    font-weight: 700;
    color: ${props => props.isUser ? '#ffffff' : '#1a202c'};
    letter-spacing: 0.3px;
  }
  
  em, i {
    font-style: italic;
    color: ${props => props.isUser ? 'rgba(255,255,255,0.95)' : '#4a5568'};
  }
  
  code {
    background: ${props => props.isUser ? 'rgba(255,255,255,0.25)' : '#e8eaed'};
    color: ${props => props.isUser ? '#ffffff' : '#d63384'};
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    font-weight: 500;
    border: ${props => props.isUser ? '1px solid rgba(255,255,255,0.3)' : '1px solid #d1d5db'};
  }
  
  pre {
    background: ${props => props.isUser ? 'rgba(0,0,0,0.2)' : '#f6f8fa'};
    border: 1px solid ${props => props.isUser ? 'rgba(255,255,255,0.2)' : '#d0d7de'};
    border-radius: 6px;
    padding: 12px 16px;
    margin: 12px 0;
    overflow-x: auto;
    
    code {
      background: transparent;
      border: none;
      padding: 0;
      color: ${props => props.isUser ? '#ffffff' : '#24292f'};
      font-size: 13px;
    }
  }
  
  ul, ol {
    margin: 12px 0;
    padding-left: 24px;
    
    li {
      margin: 8px 0;
      line-height: 1.7;
      
      &::marker {
        color: ${props => props.isUser ? 'rgba(255,255,255,0.8)' : '#667eea'};
        font-weight: 600;
      }
    }
  }
  
  ul {
    list-style-type: disc;
  }
  
  ol {
    list-style-type: decimal;
  }
  
  blockquote {
    border-left: 4px solid ${props => props.isUser ? 'rgba(255,255,255,0.5)' : '#667eea'};
    padding-left: 16px;
    margin: 12px 0;
    font-style: italic;
    color: ${props => props.isUser ? 'rgba(255,255,255,0.9)' : '#4a5568'};
  }
  
  h1, h2, h3, h4 {
    margin: 16px 0 12px 0;
    font-weight: 700;
    color: ${props => props.isUser ? '#ffffff' : '#1a202c'};
    line-height: 1.4;
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  h1 { font-size: 1.4em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.2em; }
  h4 { font-size: 1.1em; }
  
  a {
    color: ${props => props.isUser ? '#ffffff' : '#667eea'};
    text-decoration: underline;
    font-weight: 500;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  hr {
    border: none;
    border-top: 1px solid ${props => props.isUser ? 'rgba(255,255,255,0.3)' : '#e0e0e0'};
    margin: 16px 0;
  }
`;

const MessageInfo = styled.div`
  font-size: 11px;
  color: ${props => props.isUser ? 'rgba(102, 126, 234, 0.8)' : '#999'};
  margin-top: 6px;
  padding: 0 4px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
  font-weight: 500;
  letter-spacing: 0.3px;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 16px 20px;
  gap: 12px;
  border-top: 2px solid #f0f0f0;
  background: linear-gradient(to top, #ffffff 0%, #fafbfc 100%);
  border-radius: 0 0 12px 12px;
`;

const Input = styled.input`
  flex: 1;
  padding: 14px 20px;
  border: 2px solid #e8eaed;
  border-radius: 24px;
  outline: none;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.3s ease;
  background: #ffffff;
  
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    background: #fefefe;
  }
  
  &::placeholder {
    color: #adb5bd;
    font-weight: 400;
  }
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SendButton = styled.button`
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #5568d3 0%, #653a8a 100%);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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

  // Enhanced formatting function with more markdown support
  const formatMessageText = (text) => {
    if (!text) return '';
    
    let formatted = text;
    
    // Step 1: Protect code blocks from further processing
    const codeBlocks = [];
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const index = codeBlocks.length;
      codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
      return `__CODE_BLOCK_${index}__`;
    });
    
    // Step 2: Split by double newlines for paragraphs
    const paragraphs = formatted.split(/\n\n+/);
    
    // Step 3: Process each paragraph
    const processedParagraphs = paragraphs.map((para, idx) => {
      // Skip if it's a code block placeholder
      if (para.includes('__CODE_BLOCK_')) {
        return para;
      }
      
      // Handle headers (# Header)
      if (para.match(/^#{1,4}\s+(.+)/)) {
        const headerMatch = para.match(/^(#{1,4})\s+(.+)/);
        const level = headerMatch[1].length;
        const content = headerMatch[2];
        return `<h${level}>${processInlineFormatting(content)}</h${level}>`;
      }
      
      // Handle blockquotes (> Quote)
      if (para.startsWith('> ')) {
        const quote = para.replace(/^>\s+/gm, '');
        return `<blockquote>${processInlineFormatting(quote)}</blockquote>`;
      }
      
      // Handle horizontal rules
      if (para.match(/^[-*_]{3,}$/)) {
        return '<hr/>';
      }
      
      // Handle unordered lists
      if (para.match(/^[-*+]\s+/m)) {
        const items = para.split('\n')
          .filter(line => line.match(/^[-*+]\s+/))
          .map(line => {
            const content = line.replace(/^[-*+]\s+/, '');
            return `<li>${processInlineFormatting(content)}</li>`;
          })
          .join('');
        return `<ul>${items}</ul>`;
      }
      
      // Handle ordered lists
      if (para.match(/^\d+\.\s+/m)) {
        const items = para.split('\n')
          .filter(line => line.match(/^\d+\.\s+/))
          .map(line => {
            const content = line.replace(/^\d+\.\s+/, '');
            return `<li>${processInlineFormatting(content)}</li>`;
          })
          .join('');
        return `<ol>${items}</ol>`;
      }
      
      // Regular paragraph
      const content = processInlineFormatting(para.replace(/\n/g, '<br/>'));
      return `<p>${content}</p>`;
    });
    
    // Step 4: Join paragraphs and restore code blocks
    let result = processedParagraphs.join('');
    codeBlocks.forEach((block, index) => {
      result = result.replace(`__CODE_BLOCK_${index}__`, block);
    });
    
    return result;
  };
  
  // Process inline formatting (bold, italic, code, links)
  const processInlineFormatting = (text) => {
    let formatted = text;
    
    // Handle inline code first (to protect it)
    const inlineCodes = [];
    formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
      return `__INLINE_CODE_${index}__`;
    });
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        .replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_ (but not in URLs or already processed)
    formatted = formatted.replace(/\*([^*\s][^*]*[^*\s]|\w)\*/g, '<em>$1</em>')
                        .replace(/_([^_\s][^_]*[^_\s]|\w)_/g, '<em>$1</em>');
    
    // Links: [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Restore inline code
    inlineCodes.forEach((code, index) => {
      formatted = formatted.replace(`__INLINE_CODE_${index}__`, code);
    });
    
    return formatted;
  };
  
  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
                <MessageBubble 
                  isUser={message.isUser}
                  dangerouslySetInnerHTML={{ 
                    __html: message.isUser ? message.text : formatMessageText(message.text)
                  }}
                />
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