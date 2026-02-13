'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Calendar, Shield, Camera, Save, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  membership: {
    type: string;
    status: string;
    endDate: string | null;
  } | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
        });
      }
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => prev ? { ...prev, ...updated } : prev);
        setEditing(false);
        showToast('Profile updated!', 'success');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB', 'error');
      return;
    }

    setUploading(true);
    try {
      // Get presigned URL with user-scoped path
      const presignRes = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        showToast(err.error || 'Upload failed', 'error');
        return;
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      // Upload directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (uploadRes.ok) {
        setProfile((prev) => prev ? { ...prev, avatarUrl: publicUrl } : prev);
        showToast('Avatar updated!', 'success');
      } else {
        showToast('Upload failed', 'error');
      }
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card">
        {/* Header with Avatar */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                  {profile.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <p className="text-sm text-primary mt-1 capitalize">
                {profile.membership?.type?.toLowerCase() || 'Free'} Member
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          ) : (
            <>
              <ProfileField icon={User} label="Full Name" value={`${profile.firstName} ${profile.lastName}`} />
              <ProfileField icon={Mail} label="Email Address" value={profile.email} />
              <ProfileField icon={Phone} label="Phone Number" value={profile.phone || 'Not set'} />
              <ProfileField icon={Calendar} label="Member Since" value={formatDate(profile.createdAt)} />
              <ProfileField icon={Shield} label="Account Type" value={profile.role} />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border flex gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    phone: profile.phone || '',
                  });
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Edit Profile
            </button>
          )}
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
                <p className="text-sm text-muted-foreground">Managed through your SPAC account</p>
              </div>
              <button className="text-sm text-primary hover:underline" disabled>
                Change Password
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Not enabled</p>
              </div>
              <button className="text-sm text-primary hover:underline" disabled>
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
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
