/**
 * Profile & Password Change Page
 * Sprint 10 - Story 10.8 BUG-007
 *
 * Two-card layout: Profile Information + Change Password
 * Uses GET/PATCH /api/auth/profile and POST /api/auth/change-password
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { API_BASE_URL } from '@/lib/apiConfig';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export function ProfilePage() {
  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auth store for updating user display name
  const authStore = useAuthStore();

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setProfileLoading(true);
    setProfileError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: getAuthHeader(),
      });
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data: ProfileData = await response.json();
      setProfile(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleProfileSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError('First name and last name are required');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update profile');
      }

      const updated: ProfileData = await response.json();
      setProfile(updated);
      setFirstName(updated.firstName);
      setLastName(updated.lastName);

      // Update auth store user display info
      const currentUser = authStore.user;
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            firstName: updated.firstName,
            lastName: updated.lastName,
          },
        });
      }

      toast.success('Profile updated successfully');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange() {
    setPasswordError('');

    // Frontend validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError(
        'New password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to change password');
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      toast.success('Password changed successfully');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  const hasProfileChanges =
    profile && (firstName !== profile.firstName || lastName !== profile.lastName);

  function formatRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  if (profileLoading) {
    return (
      <PageTemplate title="My Profile">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <span className="ml-2 text-neutral-600">Loading profile...</span>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="My Profile">
      <div className="space-y-6 max-w-2xl">
        {/* Profile Information Card */}
        <Card className="shadow-elevation-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-brand-600" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileError && (
              <div className="rounded-lg border border-error/20 bg-error/5 p-3 text-sm text-error">
                {profileError}
              </div>
            )}

            {/* Email - readonly */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                Email
              </Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-neutral-50 text-neutral-500"
              />
            </div>

            {/* Role - readonly */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-sm font-medium text-neutral-700">
                Role
              </Label>
              <Input
                id="role"
                value={profile ? formatRole(profile.role) : ''}
                disabled
                className="bg-neutral-50 text-neutral-500"
              />
            </div>

            {/* Department - readonly */}
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-sm font-medium text-neutral-700">
                Department
              </Label>
              <Input
                id="department"
                value={profile?.department || 'N/A'}
                disabled
                className="bg-neutral-50 text-neutral-500"
              />
            </div>

            {/* First Name - editable */}
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm font-medium text-neutral-700">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name - editable */}
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm font-medium text-neutral-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>

            <Button
              onClick={handleProfileSave}
              disabled={profileSaving || !hasProfileChanges}
              className="bg-brand-600 text-white hover:bg-brand-700 min-h-[44px]"
            >
              {profileSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="shadow-elevation-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-brand-600" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="rounded-lg border border-error/20 bg-error/5 p-3 text-sm text-error">
                {passwordError}
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-neutral-700">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-sm font-medium text-neutral-700">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, upper + lower + number"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-neutral-500">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              className="bg-brand-600 text-white hover:bg-brand-700 min-h-[44px]"
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}

export default ProfilePage;
