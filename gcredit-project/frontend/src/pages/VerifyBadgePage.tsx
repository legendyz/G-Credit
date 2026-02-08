import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { VerificationResponse } from '../types/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  Calendar,
  User,
  Building2,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { API_BASE_URL } from '../lib/apiConfig';
import { RevokedBadgeAlert } from '../components/badges/RevokedBadgeAlert';

export function VerifyBadgePage() {
  const { verificationId } = useParams<{ verificationId: string }>();
  const navigate = useNavigate();
  const [badge, setBadge] = useState<VerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!verificationId) {
      setError('Invalid verification link');
      setIsLoading(false);
      return;
    }

    const loadBadgeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/verify/${verificationId}`);

        // Transform API response to match frontend type
        const apiData = response.data;
        const transformedData: VerificationResponse = {
          id: apiData.id,
          verificationId: verificationId!,
          status:
            apiData.status ||
            (apiData.revoked
              ? 'REVOKED'
              : apiData.verificationStatus === 'valid'
                ? 'ACTIVE'
                : 'EXPIRED'),
          badge: apiData.badge || apiData._meta?.badge || {},
          recipient: apiData.recipient || apiData._meta?.recipient || {},
          issuer: apiData.issuer || apiData._meta?.issuer || {},
          issuedAt: apiData.issuedAt || apiData.issuedOn || new Date().toISOString(),
          expiresAt: apiData.expiresAt || apiData.expires || null,
          claimedAt: apiData.claimedAt || null,
          isValid: apiData.isValid !== undefined ? apiData.isValid : true,
          revokedAt: apiData.revokedAt || undefined,
          revocationReason: apiData.revocationReason || undefined,
          revocationNotes: apiData.revocationNotes || undefined,
          isPublicReason: apiData.isPublicReason || false,
          revokedBy: apiData.revokedBy || undefined,
          evidenceFiles: apiData.evidenceFiles || apiData._meta?.evidenceFiles || [],
          assertionJson: apiData.assertionJson || apiData,
        };

        setBadge(transformedData);
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number; data?: { badge?: VerificationResponse } };
        };
        if (axiosErr.response?.status === 404) {
          setError('Badge not found. The verification link may be invalid.');
        } else if (axiosErr.response?.status === 410) {
          // Badge revoked - show revocation details
          setBadge(axiosErr.response.data?.badge ?? null);
          setError(null);
        } else {
          setError('Failed to verify badge. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBadgeData();
  }, [verificationId]);

  const downloadAssertion = () => {
    if (!badge?.assertionJson) return;

    const blob = new Blob([JSON.stringify(badge.assertionJson, null, 2)], {
      type: 'application/ld+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badge-${verificationId}-assertion.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !badge) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Verification Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
          Return to Home
        </Button>
      </div>
    );
  }

  if (!badge) return null;

  const isRevoked = badge.status === 'REVOKED';
  const isExpired = badge.expiresAt && new Date(badge.expiresAt) < new Date();
  const isValid = !isRevoked && !isExpired;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Story 9.2 AC1-AC2: Revoked Badge Alert */}
      {isRevoked && (badge.revokedAt || badge.revocationReason) && (
        <RevokedBadgeAlert
          revokedAt={badge.revokedAt || new Date().toISOString()}
          reason={badge.revocationReason || 'Unknown'}
          notes={badge.revocationNotes}
          isPublicReason={badge.isPublicReason || false}
          revokedBy={badge.revokedBy}
        />
      )}

      {/* Expired Badge Alert */}
      {!isRevoked && isExpired && (
        <Alert variant="warning" className="mb-6 border-yellow-600">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-900">This credential has expired</AlertTitle>
          <AlertDescription className="text-yellow-800">
            Expired on {format(new Date(badge.expiresAt!), 'MMMM d, yyyy')}
          </AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert className="mb-6 border-green-600 bg-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900">Verified Credential</AlertTitle>
          <AlertDescription className="text-green-800">
            This badge is authentic and currently valid.
          </AlertDescription>
        </Alert>
      )}

      {/* Story 9.2 AC3: Badge Details Card - grayed out if revoked */}
      <Card className={`mb-6 ${isRevoked ? 'opacity-60' : ''}`}>
        <CardHeader>
          {isRevoked && (
            <div className="text-sm text-gray-600 italic mb-2">
              Historical Information Only - This badge is no longer valid
            </div>
          )}
          <div className="flex items-start gap-6">
            {/* Badge Image */}
            {badge.badge.imageUrl && (
              <img
                src={badge.badge.imageUrl}
                alt={badge.badge.name}
                className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
              />
            )}

            {/* Badge Info */}
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{badge.badge.name}</CardTitle>
              <CardDescription className="text-base">{badge.badge.description}</CardDescription>

              {/* Verified Badge */}
              <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Verified by G-Credit</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Recipient */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-gray-500">Awarded To</div>
              <div className="text-lg">{badge.recipient.name}</div>
              <div className="text-sm text-gray-500">{badge.recipient.email}</div>
            </div>
          </div>

          {/* Issuer */}
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-gray-500">Issued By</div>
              <div className="text-lg">{badge.issuer.name}</div>
              <div className="text-sm text-gray-500">{badge.issuer.email}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-gray-500">Issued On</div>
                <div>{format(new Date(badge.issuedAt), 'MMMM d, yyyy')}</div>
              </div>
            </div>

            {badge.expiresAt && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-gray-500">Expires On</div>
                  <div>{format(new Date(badge.expiresAt), 'MMMM d, yyyy')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Criteria */}
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-500 mb-2">
                Criteria for Earning Badge
              </div>
              <div className="text-gray-700">{badge.badge.criteria}</div>
            </div>
          </div>

          {/* Skills */}
          {badge.badge.skills && badge.badge.skills.length > 0 && (
            <div>
              <div className="font-semibold text-sm text-gray-500 mb-2">Skills & Competencies</div>
              <div className="flex flex-wrap gap-2">
                {badge.badge.skills.map((skillId: string) => (
                  <span
                    key={skillId}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skillId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Files */}
          {badge.evidenceFiles && badge.evidenceFiles.length > 0 && (
            <div>
              <div className="font-semibold text-sm text-gray-500 mb-2">Evidence</div>
              <div className="space-y-2">
                {badge.evidenceFiles.map(
                  (file: { blobUrl: string; filename: string }, index: number) => (
                    <a
                      key={index}
                      href={file.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {file.filename}
                    </a>
                  )
                )}
              </div>
            </div>
          )}

          {/* Story 9.2 AC5: Download Button - disabled for revoked badges */}
          <div className="flex justify-center">
            <Button
              onClick={downloadAssertion}
              className="gap-2"
              variant="outline"
              disabled={!badge.assertionJson || isRevoked}
              title={
                isRevoked
                  ? 'This badge has been revoked and cannot be downloaded'
                  : 'Download Open Badges 2.0 JSON-LD'
              }
            >
              <Download className="h-4 w-4" />
              Download Open Badges 2.0 JSON-LD
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
