import { useTheme } from '../../contexts/ThemeContext';
import React from 'react';

type ThemeOption = 'dark' | 'midnight' | 'amoled';

export default function ThemePage() {
  const { theme: selectedTheme, setTheme, accentColor, setAccentColor } = useTheme();

  const themes: { id: ThemeOption; name: string; bg: string; preview: string }[] = [
    { id: 'dark', name: 'Dark', bg: '#111128', preview: '#1a1a3e' },
    { id: 'midnight', name: 'Midnight', bg: '#0a0a1a', preview: '#151530' },
    { id: 'amoled', name: 'AMOLED', bg: '#000000', preview: '#0a0a0a' },
  ];

  const accentColors = [
    '#7c3aed', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6',
  ];

  return (
    <div className="theme-page">
      {/* Theme Selection */}
      <div className="theme-section">
        <h3 className="theme-section-title">Appearance</h3>
        <div className="theme-options">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${selectedTheme === theme.id ? 'active' : ''}`}
              onClick={() => setTheme(theme.id)}
              style={{ '--theme-bg': theme.bg, '--theme-preview': theme.preview } as React.CSSProperties}
            >
              <div className="theme-preview-box">
                <div className="theme-preview-sidebar" />
                <div className="theme-preview-chat">
                  <div className="theme-preview-msg sent" />
                  <div className="theme-preview-msg received" />
                  <div className="theme-preview-msg sent short" />
                </div>
              </div>
              <span className="theme-option-name">{theme.name}</span>
              {selectedTheme === theme.id && <div className="theme-check">✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="theme-section">
        <h3 className="theme-section-title">Accent Color</h3>
        <div className="accent-colors">
          {accentColors.map((color) => (
            <button
              key={color}
              className={`accent-color-btn ${accentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setAccentColor(color)}
            >
              {accentColor === color && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Preview */}
      <div className="theme-section">
        <h3 className="theme-section-title">Preview</h3>
        <div className="theme-chat-preview">
          <div className="preview-bubble received">Hey! How are you? 👋</div>
          <div className="preview-bubble sent" style={{ background: accentColor }}>I'm great! Thanks for asking 😊</div>
          <div className="preview-bubble received">That's awesome!</div>
        </div>
      </div>
    </div>
  );
}
