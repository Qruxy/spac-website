'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Palette,
  Home,
  Users,
  Calendar,
  Image as ImageIcon,
  CreditCard,
  Mail,
  Phone,
  BookOpen,
  Star,
  ShoppingBag,
  Heart,
  Telescope,
  Eye,
  Zap,
  MessageSquare,
  ExternalLink,
  Upload,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

type FieldType = 'text' | 'textarea' | 'richtext' | 'image';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
}

interface PageDef {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
  fields: FieldDef[];
}

const PAGES: PageDef[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    fields: [
      { key: 'hero_title', label: 'Hero Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
      { key: 'hero_image', label: 'Hero Background Image', type: 'image' },
      { key: 'intro_text', label: 'Introduction Text', type: 'textarea' },
      { key: 'cta_primary_text', label: 'Primary Button Text', type: 'text' },
      { key: 'cta_secondary_text', label: 'Secondary Button Text', type: 'text' },
    ],
  },
  {
    key: 'about',
    label: 'About',
    href: '/about',
    icon: Users,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'about_body', label: 'About Body Text', type: 'richtext' },
      { key: 'history_snippet', label: 'History Snippet', type: 'textarea' },
      { key: 'hero_image', label: 'Hero Image', type: 'image' },
    ],
  },
  {
    key: 'events',
    label: 'Events',
    href: '/events',
    icon: Calendar,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'empty_state_text', label: 'No Events Message', type: 'text' },
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    href: '/gallery',
    icon: ImageIcon,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
    ],
  },
  {
    key: 'membership',
    label: 'Membership',
    href: '/membership',
    icon: CreditCard,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'intro_text', label: 'Introduction Text', type: 'richtext' },
      { key: 'student_price_monthly', label: 'Student Price (Monthly)', type: 'text' },
      { key: 'student_price_annual', label: 'Student Price (Annual)', type: 'text' },
      { key: 'individual_price_monthly', label: 'Individual/Single Price (Monthly)', type: 'text' },
      { key: 'individual_price_annual', label: 'Individual/Single Price (Annual)', type: 'text' },
      { key: 'family_price_monthly', label: 'Family Price (Monthly)', type: 'text' },
      { key: 'family_price_annual', label: 'Family Price (Annual)', type: 'text' },
      { key: 'patron_price_monthly', label: 'Patron Price (Monthly)', type: 'text' },
      { key: 'patron_price_annual', label: 'Patron Price (Annual)', type: 'text' },
      { key: 'benefactor_price_monthly', label: 'Benefactor Price (Monthly)', type: 'text' },
      { key: 'benefactor_price_annual', label: 'Benefactor Price (Annual)', type: 'text' },
      { key: 'benefits_text', label: 'Member Benefits', type: 'richtext' },
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    href: '/newsletter',
    icon: Mail,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    href: '/contact',
    icon: Phone,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'intro_text', label: 'Introduction Text', type: 'textarea' },
      { key: 'address', label: 'Mailing Address', type: 'textarea' },
      { key: 'email', label: 'Contact Email', type: 'text' },
      { key: 'phone', label: 'Phone Number', type: 'text' },
    ],
  },
  {
    key: 'history',
    label: 'History',
    href: '/history',
    icon: BookOpen,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'body', label: 'History Body', type: 'richtext' },
    ],
  },
  {
    key: 'mirror-lab',
    label: 'Mirror Lab',
    href: '/mirror-lab',
    icon: Telescope,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'body', label: 'Mirror Lab Content', type: 'richtext' },
      { key: 'hero_image', label: 'Hero Image', type: 'image' },
    ],
  },
  {
    key: 'viewing',
    label: 'Viewing Sites',
    href: '/viewing',
    icon: Eye,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'body', label: 'Viewing Sites Content', type: 'richtext' },
    ],
  },
  {
    key: 'general-meetings',
    label: 'General Meetings',
    href: '/general-meetings',
    icon: MessageSquare,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'body', label: 'Meetings Content', type: 'richtext' },
    ],
  },
  {
    key: 'classifieds',
    label: 'Classifieds',
    href: '/classifieds',
    icon: ShoppingBag,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'rules_text', label: 'Classifieds Rules / Policy', type: 'richtext' },
    ],
  },
  {
    key: 'donations',
    label: 'Donations',
    href: '/donations',
    icon: Heart,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'body', label: 'Donation Appeal Text', type: 'richtext' },
    ],
  },
  {
    key: 'obs',
    label: 'OBS Event',
    href: '/obs',
    icon: Star,
    fields: [
      { key: 'hero_title', label: 'OBS Event Title', type: 'text' },
      { key: 'hero_subtitle', label: 'OBS Subtitle', type: 'textarea' },
      { key: 'hero_image', label: 'OBS Hero Image', type: 'image' },
      { key: 'description', label: 'Event Description', type: 'richtext' },
    ],
  },
  {
    key: 'star-party-request',
    label: 'Star Party Request',
    href: '/star-party-request',
    icon: Zap,
    fields: [
      { key: 'hero_title', label: 'Page Title', type: 'text' },
      { key: 'hero_subtitle', label: 'Page Subtitle', type: 'textarea' },
      { key: 'intro_text', label: 'Introduction Text', type: 'textarea' },
    ],
  },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function PageBuilderPage() {
  const [selectedPage, setSelectedPage] = useState<PageDef>(PAGES[0]);
  const [contentMap, setContentMap] = useState<Record<string, Record<string, string>>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/page-builder');
      if (res.ok) setContentMap(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (pageKey: string, fieldKey: string) =>
    contentMap[pageKey]?.[fieldKey] || '';

  const handleChange = useCallback((pageKey: string, fieldKey: string, value: string) => {
    setContentMap(prev => ({
      ...prev,
      [pageKey]: { ...(prev[pageKey] || {}), [fieldKey]: value },
    }));

    const statusKey = `${pageKey}:${fieldKey}`;
    setSaveStatus(prev => ({ ...prev, [statusKey]: 'saving' }));

    clearTimeout(saveTimers.current[statusKey]);
    saveTimers.current[statusKey] = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/page-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageKey, fieldKey, value }),
        });
        setSaveStatus(prev => ({ ...prev, [statusKey]: res.ok ? 'saved' : 'error' }));
        setTimeout(() => setSaveStatus(prev => ({ ...prev, [statusKey]: 'idle' })), 2000);
      } catch {
        setSaveStatus(prev => ({ ...prev, [statusKey]: 'error' }));
      }
    }, 600);
  }, []);

  const handleImageUpload = async (pageKey: string, fieldKey: string, file: File) => {
    const statusKey = `${pageKey}:${fieldKey}`;
    setUploadingField(statusKey);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pageKey', pageKey);
      fd.append('fieldKey', fieldKey);
      const res = await fetch('/api/admin/page-builder/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      handleChange(pageKey, fieldKey, url);
    } catch {
      const s = `${pageKey}:${fieldKey}`;
      setSaveStatus(prev => ({ ...prev, [s]: 'error' }));
    } finally {
      setUploadingField(null);
    }
  };

  const renderField = (page: PageDef, field: FieldDef) => {
    const value = getFieldValue(page.key, field.key);
    const statusKey = `${page.key}:${field.key}`;
    const status = saveStatus[statusKey] || 'idle';

    return (
      <div key={field.key} className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-200">{field.label}</label>
          <span className="text-xs">
            {status === 'saving' && (
              <span className="text-slate-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />Saving...
              </span>
            )}
            {status === 'saved' && (
              <span className="text-green-400 flex items-center gap-1">
                <Check className="h-3 w-3" />Saved
              </span>
            )}
            {status === 'error' && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />Error
              </span>
            )}
          </span>
        </div>

        {field.type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={e => handleChange(page.key, field.key, e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            value={value}
            onChange={e => handleChange(page.key, field.key, e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm resize-y"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        )}

        {field.type === 'richtext' && (
          <RichTextEditor
            value={value}
            onChange={v => handleChange(page.key, field.key, v)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        )}

        {field.type === 'image' && (
          <div className="space-y-3">
            {value && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Current" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(page.key, field.key, f);
                  e.target.value = '';
                }}
              />
              <span
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uploadingField === statusKey
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {uploadingField === statusKey ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />{value ? 'Replace Image' : 'Upload Image'}
                  </>
                )}
              </span>
            </label>
            {value && (
              <p className="text-xs text-slate-500 truncate max-w-sm">{value}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">
      {/* Left: Page List */}
      <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto pr-1">
        <p className="px-2 pb-2 text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">
          Pages
        </p>
        {PAGES.map(page => {
          const Icon = page.icon;
          const active = selectedPage.key === page.key;
          return (
            <button
              key={page.key}
              onClick={() => setSelectedPage(page)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                active
                  ? 'bg-indigo-600/15 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{page.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Fields */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {/* Page header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <selectedPage.icon className="h-6 w-6 text-indigo-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedPage.label}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedPage.fields.length} editable field
                    {selectedPage.fields.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <a
                href={selectedPage.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Page
              </a>
            </div>

            {selectedPage.fields.map(field => renderField(selectedPage, field))}
          </div>
        )}
      </div>
    </div>
  );
}
