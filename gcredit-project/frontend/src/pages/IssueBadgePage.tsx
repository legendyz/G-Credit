import { useState, useEffect, useCallback } from 'react';
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
import { getRecipients } from '@/lib/badgesApi';
import { getActiveTemplates } from '@/lib/badgeTemplatesApi';
import { uploadEvidenceFile, addUrlEvidence, MAX_EVIDENCE_ITEMS } from '@/lib/evidenceApi';
import EvidenceAttachmentPanel, {
  type PendingFile,
} from '@/components/evidence/EvidenceAttachmentPanel';
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

export function IssueBadgePage() {
  const navigate = useNavigate();

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachingEvidence, setIsAttachingEvidence] = useState(false);

  // Evidence state (Story 12.6)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Data state
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [users, setUsers] = useState<Recipient[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getActiveTemplates();
        setTemplates(data);
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
        const data = await getRecipients();
        setUsers(data);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Evidence handlers (Story 12.6)
  const handleAddFiles = useCallback((files: File[]) => {
    const newPending: PendingFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
  }, []);

  const handleAddUrl = useCallback((url: string) => {
    setPendingUrls((prev) => [...prev, url]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.id !== id));
  }, []);

  const handleRemoveUrl = useCallback((index: number) => {
    setPendingUrls((prev) => prev.filter((_, i) => i !== index));
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
    if (expiresIn !== '' && (Number(expiresIn) < 1 || Number(expiresIn) > 3650)) {
      toast.error('Expiry must be between 1 and 3650 days');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Issue badge (no evidence yet)
      const badge = await issueBadge({
        templateId: selectedTemplateId,
        recipientId: selectedRecipientId,
        ...(expiresIn !== '' ? { expiresIn: Number(expiresIn) } : {}),
      });

      // Step 2: Attach evidence (files + URLs)
      const hasEvidence = pendingFiles.length > 0 || pendingUrls.length > 0;
      if (hasEvidence) {
        setIsAttachingEvidence(true);

        // Upload files with per-file progress
        for (const pf of pendingFiles) {
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pf.id ? { ...f, status: 'uploading' as const } : f))
          );
          try {
            await uploadEvidenceFile(badge.id, pf.file, (pct) => {
              setUploadProgress((prev) => ({ ...prev, [pf.id]: pct }));
            });
            setPendingFiles((prev) =>
              prev.map((f) =>
                f.id === pf.id ? { ...f, status: 'done' as const, progress: 100 } : f
              )
            );
          } catch (err) {
            setPendingFiles((prev) =>
              prev.map((f) =>
                f.id === pf.id
                  ? { ...f, status: 'error' as const, error: (err as Error).message }
                  : f
              )
            );
          }
        }

        // Add URL evidence
        for (const url of pendingUrls) {
          try {
            await addUrlEvidence(badge.id, url);
          } catch (err) {
            toast.error(`Failed to add URL evidence: ${(err as Error).message}`);
          }
        }
      }

      toast.success('Badge issued successfully!');
      navigate('/admin/badges');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to issue badge');
    } finally {
      setIsSubmitting(false);
      setIsAttachingEvidence(false);
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

            {/* Evidence (Story 12.6: stacked file + URL upload) */}
            <div className="space-y-2">
              <Label className="text-body font-medium text-neutral-700">
                Evidence{' '}
                <span className="text-neutral-500">
                  (optional, up to {MAX_EVIDENCE_ITEMS} items)
                </span>
              </Label>
              <EvidenceAttachmentPanel
                pendingFiles={pendingFiles}
                pendingUrls={pendingUrls}
                onAddFiles={handleAddFiles}
                onAddUrl={handleAddUrl}
                onRemoveFile={handleRemoveFile}
                onRemoveUrl={handleRemoveUrl}
                uploadProgress={uploadProgress}
                disabled={isSubmitting}
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
                    {isAttachingEvidence ? 'Attaching evidence...' : 'Issuing...'}
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
