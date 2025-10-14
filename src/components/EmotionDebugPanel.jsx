import React from 'react';
import styled from 'styled-components';

const DebugPanel = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
`;

const Title = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  color: #4CAF50;
  font-size: 13px;
`;

const Section = styled.div`
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.div`
  color: #888;
  font-size: 10px;
  margin-bottom: 4px;
`;

const Value = styled.div`
  color: ${props => props.color || 'white'};
  font-weight: bold;
  font-size: 12px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 3px;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.value}%;
  background: ${props => props.color || '#4CAF50'};
  transition: width 0.3s ease;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    color: white;
  }
`;

const EmotionDebugPanel = ({ emotionHistory, detectionStats, currentEmotion, onClose }) => {
  if (!emotionHistory || emotionHistory.length === 0) {
    return null;
  }

  const latest = emotionHistory[emotionHistory.length - 1];
  const expressions = latest?.expressions || {};
  
  const emotionColors = {
    happy: '#4CAF50',
    sad: '#2196F3',
    angry: '#F44336',
    surprised: '#FF9800',
    fearful: '#9C27B0',
    disgusted: '#795548',
    neutral: '#9E9E9E'
  };

  const stateColors = {
    focused: '#4CAF50',
    confused: '#FF9800',
    bored: '#2196F3',
    tired: '#9C27B0'
  };

  return (
    <DebugPanel>
      <CloseButton onClick={onClose}>×</CloseButton>
      
      <Title>🔬 Emotion Debug Panel</Title>
      
      <Section>
        <Label>CURRENT STATE</Label>
        <Value color={stateColors[currentEmotion]}>
          {currentEmotion?.toUpperCase() || 'DETECTING...'}
        </Value>
        {latest?.confidence && (
          <>
            <Label style={{marginTop: 5}}>Confidence</Label>
            <ProgressBar>
              <ProgressFill 
                value={latest.confidence * 100} 
                color={latest.confidence > 0.6 ? '#4CAF50' : latest.confidence > 0.4 ? '#FF9800' : '#F44336'}
              />
            </ProgressBar>
            <div style={{marginTop: 2, fontSize: 10}}>
              {Math.round(latest.confidence * 100)}%
            </div>
          </>
        )}
      </Section>

      <Section>
        <Label>RAW EXPRESSIONS</Label>
        {Object.entries(expressions).map(([emotion, value]) => (
          <div key={emotion} style={{marginBottom: 6}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{textTransform: 'capitalize'}}>{emotion}</span>
              <span style={{color: emotionColors[emotion]}}>{Math.round(value * 100)}%</span>
            </div>
            <ProgressBar>
              <ProgressFill value={value * 100} color={emotionColors[emotion]} />
            </ProgressBar>
          </div>
        ))}
      </Section>

      <Section>
        <Label>DETECTION STATS</Label>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
          <div>
            <Label>Total</Label>
            <Value>{detectionStats.total}</Value>
          </div>
          <div>
            <Label>Success</Label>
            <Value color="#4CAF50">{detectionStats.successful}</Value>
          </div>
          <div>
            <Label>Failed</Label>
            <Value color="#F44336">{detectionStats.failed}</Value>
          </div>
          <div>
            <Label>Success Rate</Label>
            <Value color={detectionStats.total > 0 ? '#4CAF50' : '#888'}>
              {detectionStats.total > 0 
                ? Math.round((detectionStats.successful / detectionStats.total) * 100) + '%'
                : '0%'
              }
            </Value>
          </div>
        </div>
      </Section>

      <Section>
        <Label>HISTORY (last 5)</Label>
        {emotionHistory.slice(-5).reverse().map((item, index) => (
          <div key={index} style={{marginBottom: 4, fontSize: 10}}>
            <span style={{color: stateColors[item.emotion]}}>
              {item.emotion}
            </span>
            <span style={{color: '#666', marginLeft: 8}}>
              {Math.round(item.confidence * 100)}%
            </span>
          </div>
        ))}
      </Section>
    </DebugPanel>
  );
};

export default EmotionDebugPanel;