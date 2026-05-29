import { useTheme } from '../contexts/ThemeContext';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 text-zinc-400">
      <Palette size={16} />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="bg-black/40 border border-white/5 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-brand hover:bg-white/5 transition-all text-white backdrop-blur-md"
      >
        <option value="default">Default Theme</option>
        <option value="cyberpunk">Cyberpunk</option>
        <option value="retro">Retro</option>
      </select>
    </div>
  );
}
