/**
 * Badge Sharing API Client
 * Sprint 6 - Epic 7: Badge Sharing & Social Proof
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ShareViaEmailRequest {
  recipientEmails: string[];
  customMessage?: string;
}

export interface ShareToTeamsRequest {
  teamId?: string;
  channelId?: string;
  customMessage?: string;
}

export interface ShareStats {
  total: number;
  byPlatform: {
    email: number;
    teams: number;
    widget: number;
  };
}

export interface ShareHistoryItem {
  id: string;
  platform: string;
  sharedAt: string;
  recipientEmail?: string;
  metadata?: Record<string, any>;
}

export interface WidgetEmbedData {
  badgeId: string;
  badgeName: string;
  badgeImageUrl: string;
  issuerName: string;
  issuedAt: string;
  verificationUrl: string;
  status: string;
}

export interface WidgetHtmlData {
  html: string;
  css: string;
  script: string;
}

/**
 * Share badge via email
 */
export async function shareBadgeViaEmail(
  badgeId: string,
  data: ShareViaEmailRequest
): Promise<{ message: string; shareCount: number }> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to share badge via email');
  }

  return response.json();
}

/**
 * Share badge to Microsoft Teams
 */
export async function shareBadgeToTeams(
  badgeId: string,
  data: ShareToTeamsRequest
): Promise<{ message: string; activityId: string }> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/teams/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to share badge to Teams');
  }

  return response.json();
}

/**
 * Get badge sharing analytics statistics
 */
export async function getBadgeShareStats(badgeId: string): Promise<ShareStats> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/analytics/shares`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch share stats');
  }

  return response.json();
}

/**
 * Get badge sharing history
 */
export async function getBadgeShareHistory(
  badgeId: string,
  limit: number = 10
): Promise<ShareHistoryItem[]> {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(
    `${API_BASE_URL}/badges/${badgeId}/analytics/shares/history?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch share history');
  }

  return response.json();
}

/**
 * Get widget embed data (JSON)
 */
export async function getWidgetEmbedData(badgeId: string): Promise<WidgetEmbedData> {
  const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/embed`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch widget embed data');
  }

  return response.json();
}

/**
 * Get widget HTML snippet
 */
export async function getWidgetHtml(
  badgeId: string,
  options: {
    size?: 'small' | 'medium' | 'large';
    theme?: 'light' | 'dark' | 'auto';
    showDetails?: boolean;
  } = {}
): Promise<WidgetHtmlData> {
  const { size = 'medium', theme = 'light', showDetails = true } = options;
  const params = new URLSearchParams({
    size,
    theme,
    showDetails: String(showDetails),
  });

  const response = await fetch(`${API_BASE_URL}/badges/${badgeId}/widget?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch widget HTML');
  }

  return response.json();
}
