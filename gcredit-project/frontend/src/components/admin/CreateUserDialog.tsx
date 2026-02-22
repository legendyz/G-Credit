/**
 * CreateUserDialog Component - Story 12.3b (AC #2, #3)
 *
 * Dialog for creating a local user with:
 * - Email, First Name, Last Name, Department, Role, Manager
 * - Client-side validation
 * - ADMIN role excluded from dropdown
 * - Default password notice
 *
 * WCAG 4.1.2 Compliant:
 * - role="dialog", aria-modal="true", aria-labelledby
 * - Focus trap, Escape key closes
 */

import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
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
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useCreateUser, useAdminUsers } from '@/hooks/useAdminUsers';
import type { UserRole } from '@/lib/adminUsersApi';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// ADMIN is excluded per AC #3
const ALLOWED_ROLES: UserRole[] = ['EMPLOYEE', 'ISSUER', 'MANAGER'];

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export function CreateUserDialog({ isOpen, onClose }: CreateUserDialogProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [managerId, setManagerId] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    autoFocus: true,
  });

  const createUserMutation = useCreateUser();

  // Fetch active LOCAL users for Manager dropdown
  // Local users are isolated from M365 — only local users can manage local users
  const { data: usersData, isLoading: managersLoading } = useAdminUsers({
    limit: 100,
    statusFilter: 'ACTIVE',
    sourceFilter: 'LOCAL',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const potentialManagers = usersData?.data ?? [];

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setDepartment('');
      setRole('EMPLOYEE');
      setManagerId('');
      setErrors({});
    }
  }, [isOpen]);

  // Client-side validation
  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Invalid email format';
    }
    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    } else if (firstName.trim().length > 100) {
      errs.firstName = 'Max 100 characters';
    }
    if (!lastName.trim()) {
      errs.lastName = 'Last name is required';
    } else if (lastName.trim().length > 100) {
      errs.lastName = 'Max 100 characters';
    }
    if (!role) {
      errs.role = 'Role is required';
    }
    return errs;
  }, [email, firstName, lastName, role]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      await createUserMutation.mutateAsync({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department.trim() || undefined,
        role,
        managerId: managerId && managerId !== '__none__' ? managerId : undefined,
      });

      toast.success('User created successfully');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('409')) {
          toast.error('A user with this email already exists');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to create user');
      }
    }
  }, [
    email,
    firstName,
    lastName,
    department,
    role,
    managerId,
    validate,
    createUserMutation,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
              <UserPlus className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h2
              id="create-user-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Create Local User
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:hover:bg-gray-700"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Default password notice */}
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          User will be created with the default password. They should change it on first login.
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="create-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className={errors.email ? 'border-red-500' : ''}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'create-email-error' : undefined}
            />
            {errors.email && (
              <p id="create-email-error" className="mt-1 text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* First Name */}
          <div>
            <Label htmlFor="create-firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              maxLength={100}
              className={errors.firstName ? 'border-red-500' : ''}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'create-firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="create-firstName-error" className="mt-1 text-xs text-red-600">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="create-lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              maxLength={100}
              className={errors.lastName ? 'border-red-500' : ''}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'create-lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="create-lastName-error" className="mt-1 text-xs text-red-600">
                {errors.lastName}
              </p>
            )}
          </div>

          {/* Department */}
          <div>
            <Label htmlFor="create-department">Department</Label>
            <Input
              id="create-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
              maxLength={100}
            />
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="create-role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger
                id="create-role"
                className={`w-full ${errors.role ? 'border-red-500' : ''}`}
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          </div>

          {/* Manager */}
          <div>
            <Label htmlFor="create-manager">Manager</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger id="create-manager" className="w-full">
                <SelectValue placeholder="None (no manager)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {managersLoading && (
                  <div className="px-2 py-1.5 text-sm text-gray-500">Loading...</div>
                )}
                {potentialManagers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createUserMutation.isPending}
            className="min-w-[100px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateUserDialog;
