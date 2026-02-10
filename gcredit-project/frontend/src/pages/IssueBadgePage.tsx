import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { issueBadge } from '@/lib/badgesApi';
import { API_BASE_URL } from '@/lib/apiConfig';
import { Award, Send, Loader2 } from 'lucide-react';

interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
}

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function IssueBadgePage() {
  const navigate = useNavigate();

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data state
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [users, setUsers] = useState<Recipient[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/badge-templates?status=ACTIVE`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to load templates');
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data || data.items || [];
        setTemplates(list);
      } catch {
        toast.error('Failed to load badge templates');
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch recipients on mount (uses /badges/recipients - accessible by ADMIN + ISSUER)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/badges/recipients`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to load recipients');
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      toast.error('Please select a badge template');
      return;
    }
    if (!selectedRecipientId) {
      toast.error('Please select a recipient');
      return;
    }
    if (evidenceUrl && !isValidUrl(evidenceUrl)) {
      toast.error('Please enter a valid URL for evidence');
      return;
    }
    if (expiresIn !== '' && (Number(expiresIn) < 1 || Number(expiresIn) > 3650)) {
      toast.error('Expiry must be between 1 and 3650 days');
      return;
    }

    setIsSubmitting(true);
    try {
      await issueBadge({
        templateId: selectedTemplateId,
        recipientId: selectedRecipientId,
        ...(evidenceUrl ? { evidenceUrl } : {}),
        ...(expiresIn !== '' ? { expiresIn: Number(expiresIn) } : {}),
      });
      toast.success('Badge issued successfully!');
      navigate('/admin/badges');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to issue badge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTemplate
      title="Issue Badge"
      description="Issue a new badge to a recipient"
      actions={
        <Button
          variant="outline"
          onClick={() => navigate('/admin/badges')}
          className="min-h-[44px]"
        >
          Back to Badges
        </Button>
      }
    >
      <Card className="max-w-2xl shadow-elevation-1 border border-neutral-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-h3 font-semibold text-neutral-900">
            <Award className="h-5 w-5 text-brand-600" />
            Badge Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label htmlFor="template" className="text-body font-medium text-neutral-700">
                Badge Template <span className="text-error">*</span>
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={loadingTemplates}
              >
                <SelectTrigger
                  id="template"
                  aria-required="true"
                  className="min-h-[44px] focus:ring-brand-500"
                >
                  <SelectValue
                    placeholder={loadingTemplates ? 'Loading templates...' : 'Select a template'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Selector */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-body font-medium text-neutral-700">
                Recipient <span className="text-error">*</span>
              </Label>
              <Select
                value={selectedRecipientId}
                onValueChange={setSelectedRecipientId}
                disabled={loadingUsers}
              >
                <SelectTrigger
                  id="recipient"
                  aria-required="true"
                  className="min-h-[44px] focus:ring-brand-500"
                >
                  <SelectValue
                    placeholder={loadingUsers ? 'Loading users...' : 'Select a recipient'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Evidence URL */}
            <div className="space-y-2">
              <Label htmlFor="evidenceUrl" className="text-body font-medium text-neutral-700">
                Evidence URL <span className="text-neutral-500">(optional)</span>
              </Label>
              <Input
                id="evidenceUrl"
                type="url"
                placeholder="https://example.com/evidence"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="min-h-[44px] focus:ring-brand-500"
              />
            </div>

            {/* Expiry Days */}
            <div className="space-y-2">
              <Label htmlFor="expiresIn" className="text-body font-medium text-neutral-700">
                Expiry (days) <span className="text-neutral-500">(optional)</span>
              </Label>
              <Input
                id="expiresIn"
                type="number"
                min={1}
                max={3650}
                placeholder="e.g. 365"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="min-h-[44px] focus:ring-brand-500"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-600 hover:bg-brand-700 text-white min-h-[44px] px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Issue Badge
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}

export default IssueBadgePage;
