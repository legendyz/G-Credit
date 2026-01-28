import type { ViewMode } from './TimelineView';
import { List, Grid3x3 } from 'lucide-react';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
      <button
        onClick={() => onChange('timeline')}
        className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${
          mode === 'timeline'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label="Timeline view"
      >
        <List className="w-4 h-4" />
        Timeline
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`px-3 py-2 rounded flex items-center gap-2 transition-colors ${
          mode === 'grid'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-label="Grid view"
      >
        <Grid3x3 className="w-4 h-4" />
        Grid
      </button>
    </div>
  );
}
