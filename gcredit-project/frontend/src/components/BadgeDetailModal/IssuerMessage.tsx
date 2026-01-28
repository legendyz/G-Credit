import React from 'react';

interface IssuerMessageProps {
  issuerName: string;
  message: string;
}

const IssuerMessage: React.FC<IssuerMessageProps> = ({ issuerName, message }) => {
  return (
    <section className="px-6 py-6 border-b">
      {/* AC 4.3: Issuer message section */}
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💬</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 mb-2">Message from {issuerName}</p>
          <blockquote className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded-r-md">
            <p className="text-gray-700 italic">&ldquo;{message}&rdquo;</p>
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default IssuerMessage;
