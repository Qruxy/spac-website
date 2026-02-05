/**
 * Profile Page
 *
 * Member profile management.
 */

import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your SPAC profile',
};

export default async function ProfilePage() {
  const session = await getSession();
  const user = session!.user;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {user.name}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-primary mt-1 capitalize">
                {user.membershipType?.toLowerCase() || 'Free'} Member
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-6">
          <ProfileField
            icon={User}
            label="Full Name"
            value={user.name || 'Not set'}
          />
          <ProfileField
            icon={Mail}
            label="Email Address"
            value={user.email}
          />
          <ProfileField
            icon={Phone}
            label="Phone Number"
            value="Not set"
          />
          <ProfileField
            icon={Calendar}
            label="Member Since"
            value="December 2024"
          />
          <ProfileField
            icon={Shield}
            label="Account Type"
            value={user.role}
          />
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            disabled
          >
            Edit Profile (Coming Soon)
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-border bg-card mt-6">
        <div className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Security</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">Password</p>
                <p className="text-sm text-muted-foreground">
                  Managed through your SPAC account
                </p>
              </div>
              <button
                className="text-sm text-primary hover:underline"
                disabled
              >
                Change Password
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Not enabled
                </p>
              </div>
              <button
                className="text-sm text-primary hover:underline"
                disabled
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
    </div>
  );
}
