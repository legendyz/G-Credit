import type { DateGroup } from '../../hooks/useWallet';

interface DateNavigationSidebarProps {
  dateGroups: DateGroup[];
  /** Currently selected date group label (for grid filtering) */
  selectedLabel?: string | null;
  /** Callback when a date group is clicked */
  onSelect?: (label: string) => void;
  className?: string;
}

export function DateNavigationSidebar({
  dateGroups,
  selectedLabel,
  onSelect,
  className = '',
}: DateNavigationSidebarProps) {
  const handleClick = (label: string) => {
    if (onSelect) {
      onSelect(label);
    } else {
      // Fallback: scroll to group
      const element = document.getElementById(`group-${label}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Group by year
  const yearGroups = dateGroups.reduce(
    (acc, group) => {
      const year = group.label.split(' ')[1]; // Extract year from "January 2026"
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(group);
      return acc;
    },
    {} as Record<string, DateGroup[]>
  );

  return (
    <div className={`sticky top-4 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Date Navigation</h3>

        {Object.entries(yearGroups).map(([year, groups]) => (
          <div key={year} className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{year}</h4>
            <ul className="space-y-1">
              {groups.map((group) => {
                const month = group.label.split(' ')[0]; // Extract month
                return (
                  <li key={group.label}>
                    <button
                      onClick={() => handleClick(group.label)}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex justify-between items-center ${
                        selectedLabel === group.label
                          ? 'bg-brand-100 text-brand-700 font-medium'
                          : 'hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <span>• {month}</span>
                      <span className="text-gray-500">({group.count})</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {dateGroups.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No badges yet</p>
        )}
      </div>
    </div>
  );
}
