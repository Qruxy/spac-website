'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Eye, Shield, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

interface UserPrefs {
  emailNotifications: boolean;
  eventReminders: boolean;
  listingAlerts: boolean;
  profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
}

const defaultPrefs: UserPrefs = {
  emailNotifications: true,
  eventReminders: true,
  listingAlerts: true,
  profileVisibility: 'MEMBERS_ONLY',
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPrefs>(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('spac-user-prefs');
    if (saved) {
      try {
        setPrefs({ ...defaultPrefs, ...JSON.parse(saved) });
      } catch { /* use defaults */ }
    }
    setLoaded(true);
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = () => {
    setSaving(true);
    // Save to localStorage (can be migrated to API later)
    localStorage.setItem('spac-user-prefs', JSON.stringify(prefs));
    setTimeout(() => {
      setSaving(false);
      showToast('Settings saved!', 'success');
    }, 300);
  };

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Account</h3>
          <div className="space-y-3">
            <Link
              href="/profile"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <div>
                  <p className="text-foreground font-medium">Edit Profile</p>
                  <p className="text-sm text-muted-foreground">Update your name, phone, and avatar</p>
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </Link>
            <Link
              href="/billing"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <div>
                  <p className="text-foreground font-medium">Billing & Subscription</p>
                  <p className="text-sm text-muted-foreground">Manage your membership plan and payments</p>
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Notification Preferences</h3>
          </div>
          <div className="space-y-4">
            <ToggleSetting
              label="Email Notifications"
              description="Receive important updates and announcements via email"
              checked={prefs.emailNotifications}
              onChange={(v) => setPrefs({ ...prefs, emailNotifications: v })}
            />
            <ToggleSetting
              label="Event Reminders"
              description="Get reminded about upcoming events you've registered for"
              checked={prefs.eventReminders}
              onChange={(v) => setPrefs({ ...prefs, eventReminders: v })}
            />
            <ToggleSetting
              label="Listing Alerts"
              description="Notifications about your classifieds listings and offers"
              checked={prefs.listingAlerts}
              onChange={(v) => setPrefs({ ...prefs, listingAlerts: v })}
            />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Privacy</h3>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Profile Visibility</label>
            <select
              value={prefs.profileVisibility}
              onChange={(e) => setPrefs({ ...prefs, profileVisibility: e.target.value as UserPrefs['profileVisibility'] })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="PUBLIC">Public - Visible to everyone</option>
              <option value="MEMBERS_ONLY">Members Only - Only SPAC members can see</option>
              <option value="PRIVATE">Private - Only you can see</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

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

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
      <div>
        <p className="text-foreground font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </label>
  );
}
