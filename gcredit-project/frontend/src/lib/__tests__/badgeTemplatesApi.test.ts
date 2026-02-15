/**
 * badgeTemplatesApi.test.ts
 * Story 10.8 BUG-003: Badge Templates API Client Tests
 *
 * Tests for CRUD operations: getAllTemplates, getTemplateById,
 * createTemplate, updateTemplate, deleteTemplate
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type BadgeTemplate,
} from '../badgeTemplatesApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_TEMPLATE: BadgeTemplate = {
  id: 'tpl-1',
  name: 'Cloud Expert',
  description: 'Cloud certification badge',
  category: 'certification',
  skillIds: ['skill-1'],
  issuanceCriteria: { type: 'manual', description: 'Pass exam' },
  validityPeriod: 365,
  status: 'ACTIVE',
  createdBy: 'admin-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('badgeTemplatesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllTemplates', () => {
    it('calls the correct URL with auth headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([MOCK_TEMPLATE]),
      });

      await getAllTemplates();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badge-templates/all'),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('returns array when response is an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([MOCK_TEMPLATE]),
      });

      const result = await getAllTemplates();
      expect(result).toEqual([MOCK_TEMPLATE]);
    });

    it('returns data.data when response is paginated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [MOCK_TEMPLATE], total: 1, page: 1, limit: 20 }),
      });

      const result = await getAllTemplates();
      expect(result).toEqual([MOCK_TEMPLATE]);
    });

    it('throws on HTTP error with message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' }),
      });

      await expect(getAllTemplates()).rejects.toThrow('Forbidden');
    });

    it('throws generic error when response has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('parse error')),
      });

      await expect(getAllTemplates()).rejects.toThrow('Unknown error');
    });
  });

  describe('getTemplateById', () => {
    it('calls the correct URL with template ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await getTemplateById('tpl-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badge-templates/tpl-1'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('returns parsed template data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      const result = await getTemplateById('tpl-1');
      expect(result).toEqual(MOCK_TEMPLATE);
    });

    it('throws on not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Template not found' }),
      });

      await expect(getTemplateById('bad-id')).rejects.toThrow('Template not found');
    });
  });

  describe('createTemplate', () => {
    it('sends POST with FormData including all fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await createTemplate({
        name: 'Cloud Expert',
        description: 'Cloud cert',
        category: 'certification',
        skillIds: ['skill-1', 'skill-2'],
        issuanceCriteria: { type: 'manual' },
        validityPeriod: 365,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badge-templates'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('name')).toBe('Cloud Expert');
      expect(formData.get('description')).toBe('Cloud cert');
      expect(formData.get('category')).toBe('certification');
      expect(formData.get('skillIds')).toBe('["skill-1","skill-2"]');
      expect(formData.get('issuanceCriteria')).toBe('{"type":"manual"}');
      expect(formData.get('validityPeriod')).toBe('365');
    });

    it('sends credentials: include without Content-Type (FormData sets it)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await createTemplate({ name: 'Test', category: 'skill' });

      const callOptions = mockFetch.mock.calls[0][1];
      expect(callOptions.credentials).toBe('include');
      expect(callOptions.headers).not.toHaveProperty('Content-Type');
    });

    it('appends image file when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      const imageFile = new File(['png'], 'badge.png', { type: 'image/png' });
      await createTemplate({ name: 'Test', category: 'skill' }, imageFile);

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('image')).toEqual(imageFile);
    });

    it('throws on create error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Name is required' }),
      });

      await expect(createTemplate({ name: '', category: 'skill' })).rejects.toThrow(
        'Name is required'
      );
    });
  });

  describe('updateTemplate', () => {
    it('sends PATCH with FormData to correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await updateTemplate('tpl-1', { name: 'Updated', status: 'ACTIVE' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badge-templates/tpl-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.any(FormData),
        })
      );

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('name')).toBe('Updated');
      expect(formData.get('status')).toBe('ACTIVE');
    });

    it('sends null validityPeriod as empty string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await updateTemplate('tpl-1', { validityPeriod: null });

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('validityPeriod')).toBe('');
    });

    it('does not send skillIds when not provided (status-only update)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await updateTemplate('tpl-1', { status: 'ARCHIVED' });

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.has('skillIds')).toBe(false);
      expect(formData.get('status')).toBe('ARCHIVED');
    });

    it('sends skillIds when explicitly provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await updateTemplate('tpl-1', { skillIds: ['skill-1', 'skill-2'] });

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('skillIds')).toBe('["skill-1","skill-2"]');
    });

    it('sends empty skillIds array when explicitly clearing skills', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TEMPLATE),
      });

      await updateTemplate('tpl-1', { skillIds: [] });

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('skillIds')).toBe('[]');
    });
  });

  describe('deleteTemplate', () => {
    it('sends DELETE to correct URL with credentials', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await deleteTemplate('tpl-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badge-templates/tpl-1'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('throws on delete error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Cannot delete active template' }),
      });

      await expect(deleteTemplate('tpl-1')).rejects.toThrow('Cannot delete active template');
    });

    it('does not throw on successful delete', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await expect(deleteTemplate('tpl-1')).resolves.toBeUndefined();
    });
  });

  describe('auth credentials', () => {
    it('sends request with credentials: include (cookie-based auth)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getAllTemplates();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      );
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).not.toHaveProperty('Authorization');
    });
  });
});
