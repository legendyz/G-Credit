/**
 * TemplateSelector Component - Story 8.1: P1 Enhancement
 *
 * Autocomplete dropdown for selecting badge templates before downloading CSV.
 * Fetches approved badge templates and passes selection to parent.
 *
 * P1 Priority — optional enhancement for Sprint 9 MVP.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getActiveTemplates } from '../../lib/badgeTemplatesApi';

interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
}

interface TemplateSelectorProps {
  /** Called when a template is selected */
  onSelect: (templateId: string | null) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export function TemplateSelector({ onSelect, disabled = false }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch approved badge templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await getActiveTemplates();
        setTemplates(data);
      } catch {
        toast.error('Failed to load badge templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = useCallback(
    (template: BadgeTemplate) => {
      setSelectedTemplate(template);
      setSearchTerm(template.name);
      setIsOpen(false);
      onSelect(template.id);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setSelectedTemplate(null);
    setSearchTerm('');
    onSelect(null);
  }, [onSelect]);

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="template-selector" className="block text-sm font-medium text-gray-700 mb-1">
        Badge Template (optional)
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="template-selector"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              if (selectedTemplate) {
                setSelectedTemplate(null);
                onSelect(null);
              }
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={isLoading ? 'Loading templates...' : 'Search badge templates...'}
            disabled={disabled || isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:bg-gray-100 disabled:cursor-not-allowed
                       min-h-[44px]"
            aria-label="Search badge templates"
            aria-expanded={isOpen}
            aria-controls="template-listbox"
            aria-autocomplete="list"
            role="combobox"
          />
          {selectedTemplate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(selectedTemplate.id);
                toast.success('Template ID copied to clipboard');
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-brand-600 cursor-pointer"
              title={`Click to copy: ${selectedTemplate.id}`}
              aria-label="Copy template ID"
            >
              📋 {selectedTemplate.id.substring(0, 8)}...
            </button>
          )}
        </div>
        {selectedTemplate && (
          <button
            onClick={handleClear}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 
                       rounded-lg text-sm hover:bg-gray-50 min-h-[44px]"
            aria-label="Clear template selection"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredTemplates.length > 0 && (
        <ul
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg 
                     shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
          id="template-listbox"
          aria-label="Badge template options"
        >
          {filteredTemplates.map((template) => (
            <li
              key={template.id}
              onClick={() => handleSelect(template)}
              className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors
                         border-b border-gray-100 last:border-b-0"
              role="option"
              aria-selected={selectedTemplate?.id === template.id}
            >
              <div className="text-sm font-medium text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-500 mt-0.5" title={template.id}>
                {template.id.substring(0, 8)}...
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && searchTerm && filteredTemplates.length === 0 && !isLoading && (
        <div
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg 
                        shadow-lg p-4 text-sm text-gray-500 text-center"
        >
          No templates found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}

export default TemplateSelector;
