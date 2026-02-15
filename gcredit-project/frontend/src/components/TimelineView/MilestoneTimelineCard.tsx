import { Calendar } from 'lucide-react';

// Story 11.24 AC-C3: Milestone card for wallet timeline
interface MilestoneTimelineCardProps {
  milestone: {
    milestoneId: string;
    title: string;
    description: string;
    achievedAt: string;
  };
}

export function MilestoneTimelineCard({ milestone }: MilestoneTimelineCardProps) {
  const achievedDate = new Date(milestone.achievedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative pl-8 md:pl-12">
      {/* Timeline dot */}
      <div className="absolute left-0 top-4 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm" />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl" role="img" aria-label="Milestone">
              {milestone.title.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
              {milestone.title}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mt-1">{milestone.description}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Achieved {achievedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
