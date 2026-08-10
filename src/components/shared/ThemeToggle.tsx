import type { ReactElement } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

/** Toggles the pastel light and evening themes. */
export function ThemeToggle(): ReactElement {
  const { darkMode, toggleTheme } = useUiStore();
  return <button className="icon-button" onClick={toggleTheme} aria-label={`Use ${darkMode ? 'light' : 'evening'} theme`}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
