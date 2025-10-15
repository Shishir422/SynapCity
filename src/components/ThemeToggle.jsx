import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ToggleButton = styled.button`
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ToggleButton onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? '🌙' : '☀️'}
    </ToggleButton>
  );
};

export default ThemeToggle;
