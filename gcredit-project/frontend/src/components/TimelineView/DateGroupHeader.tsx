interface DateGroupHeaderProps {
  label: string;
  count: number;
}

export function DateGroupHeader({ label, count }: DateGroupHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {label}
      </h2>
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-sm text-gray-500">
        {count} {count === 1 ? 'badge' : 'badges'}
      </span>
    </div>
  );
}
