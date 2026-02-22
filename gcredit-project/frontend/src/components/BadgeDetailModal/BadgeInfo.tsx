import React from 'react';
import { getCategoryColorClasses } from '@/lib/categoryColors';
import { UNKNOWN_SKILL_LABEL } from '@/hooks/useSkills';

type SkillItem = string | { name: string; categoryColor?: string | null };

interface BadgeInfoProps {
  description: string;
  skills: SkillItem[];
  criteria: Record<string, unknown> | string | null;
}

const BadgeInfo: React.FC<BadgeInfoProps> = ({ description, skills, criteria }) => {
  // Story 11.24 AC-C2: Parse criteria in multiple formats
  const parsedCriteria = typeof criteria === 'object' && criteria !== null ? criteria : null;

  // Format 1: { requirements: ['req1', 'req2'] } → bullet list
  const criteriaList = Array.isArray(parsedCriteria?.requirements)
    ? (parsedCriteria.requirements as string[])
    : [];

  // Format 2: { description: '...' } or { type: 'manual', description: '...' } → paragraph
  const criteriaDescription =
    criteriaList.length === 0 && parsedCriteria && typeof parsedCriteria.description === 'string'
      ? (parsedCriteria.description as string)
      : null;

  // Format 3: plain string → paragraph
  const criteriaText =
    criteriaList.length === 0 && !criteriaDescription && typeof criteria === 'string'
      ? criteria
      : null;

  const hasCriteria = criteriaList.length > 0 || criteriaDescription || criteriaText;

  return (
    <section className="px-6 py-6 border-b">
      {/* AC 4.4: Badge description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Badge</h3>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>

      {/* AC 4.4: Skills tags */}
      {skills && skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills Demonstrated</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => {
              const isObject = typeof skill === 'object';
              const name = isObject ? skill.name : skill;
              const color = isObject ? getCategoryColorClasses(skill.categoryColor) : null;
              const isUnknown = name === UNKNOWN_SKILL_LABEL;
              return (
                <span
                  key={index}
                  className={`px-3 py-1.5 text-sm rounded-full ${
                    isUnknown
                      ? 'text-muted-foreground italic bg-muted'
                      : color
                        ? `${color.bg} ${color.text} font-medium`
                        : 'bg-blue-600 text-white font-medium'
                  }`}
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* AC 4.4: Criteria list */}
      {hasCriteria && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Earning Criteria</h3>
          {criteriaList.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {criteriaList.map((item: string, index: number) => (
                <li key={index} className="text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed">
              {criteriaDescription || criteriaText}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default BadgeInfo;
