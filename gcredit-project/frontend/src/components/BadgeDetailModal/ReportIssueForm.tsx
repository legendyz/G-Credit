import React, { useState } from 'react';
import { toast } from 'sonner';

interface ReportIssueFormProps {
  badgeId: string;
  userEmail: string;
  onSuccess?: () => void;
}

const IssueTypes = {
  INCORRECT_INFO: 'Incorrect info',
  TECHNICAL_PROBLEM: 'Technical problem',
  OTHER: 'Other',
};

const ReportIssueForm: React.FC<ReportIssueFormProps> = ({
  badgeId,
  userEmail,
  onSuccess,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [issueType, setIssueType] = useState(IssueTypes.INCORRECT_INFO);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (description.trim().length === 0) {
      setError('Please provide a description');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/api/badges/${badgeId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueType,
          description: description.trim(),
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const data = await response.json();
      setDescription('');
      setShowForm(false);
      
      if (onSuccess) {
        onSuccess();
      }

      // AC 4.10: Show success message
      toast.success('Report submitted', {
        description: data.message || "We'll review your report within 2 business days.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
      >
        ⚠️ Report Issue
      </button>
    );
  }

  return (
    <div className="px-6 py-6 border-t bg-gray-50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Report an Issue</h4>

        {/* AC 4.9: Issue Type dropdown */}
        <div>
          <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Type *
          </label>
          <select
            id="issueType"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(IssueTypes).map(([key, value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* AC 4.9: Description textarea (500 char max) */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description * <span className="text-gray-500">({description.length}/500)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={4}
            maxLength={500}
            placeholder="Please describe the issue in detail..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>

        {/* AC 4.9: Email confirmation (pre-filled) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Your Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll use this email for follow-up communication
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* AC 4.9: Submit button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportIssueForm;
