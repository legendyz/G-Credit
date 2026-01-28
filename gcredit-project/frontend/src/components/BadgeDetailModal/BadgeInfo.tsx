import React from 'react';

interface BadgeInfoProps {
  description: string;
  skills: string[];
  criteria: any;
}

const BadgeInfo: React.FC<BadgeInfoProps> = ({ description, skills, criteria }) => {
  // Parse criteria (assuming it's a JSON object with a 'requirements' array)
  const criteriaList = Array.isArray(criteria?.requirements)
    ? criteria.requirements
    : typeof criteria === 'string'
    ? [criteria]
    : [];

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
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AC 4.4: Criteria list */}
      {criteriaList.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Earning Criteria</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {criteriaList.map((item: string, index: number) => (
              <li key={index} className="text-sm leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default BadgeInfo;
