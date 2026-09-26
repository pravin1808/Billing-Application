import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ showLabel = true, className = '' }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? (
            <Moon size={13} className="theme-icon moon" />
          ) : (
            <Sun size={13} className="theme-icon sun" />
          )}
        </div>
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
