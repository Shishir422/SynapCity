import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const OverlayCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

/**
 * 🎨 Landmark Overlay Component
 * Visualizes the 68 facial landmark points for debugging
 * Optional: Can be toggled on/off
 */
const LandmarkOverlay = ({ videoRef, landmarks, enabled = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current || !videoRef.current || !landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmark points (if we have raw positions)
    if (landmarks.positions) {
      landmarks.positions.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        
        // Color code different facial regions
        if (index >= 17 && index <= 26) {
          ctx.fillStyle = '#00ff00'; // Eyebrows = green
        } else if ((index >= 36 && index <= 41) || (index >= 42 && index <= 47)) {
          ctx.fillStyle = '#0000ff'; // Eyes = blue
        } else if (index >= 48 && index <= 67) {
          ctx.fillStyle = '#ff0000'; // Mouth = red
        } else {
          ctx.fillStyle = '#ffff00'; // Jaw/nose = yellow
        }
        
        ctx.fill();

        // Draw key point labels for debugging
        if ([19, 23, 37, 43, 48, 54, 62, 66].includes(index)) {
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.fillText(index, point.x + 5, point.y - 5);
        }
      });

      // Draw connections for key features
      drawConnections(ctx, landmarks.positions);
    }
  }, [landmarks, videoRef, enabled]);

  const drawConnections = (ctx, points) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;

    // Eyebrow connections
    drawLine(ctx, points, [17, 18, 19, 20, 21]); // Right eyebrow
    drawLine(ctx, points, [22, 23, 24, 25, 26]); // Left eyebrow

    // Eye connections
    drawLine(ctx, points, [36, 37, 38, 39, 40, 41, 36]); // Right eye
    drawLine(ctx, points, [42, 43, 44, 45, 46, 47, 42]); // Left eye

    // Mouth connections
    drawLine(ctx, points, [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48]); // Outer mouth
  };

  const drawLine = (ctx, points, indices) => {
    if (indices.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[indices[0]].x, points[indices[0]].y);
    
    for (let i = 1; i < indices.length; i++) {
      ctx.lineTo(points[indices[i]].x, points[indices[i]].y);
    }
    
    ctx.stroke();
  };

  if (!enabled) return null;

  return <OverlayCanvas ref={canvasRef} />;
};

export default LandmarkOverlay;
