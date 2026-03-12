'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Users, Calendar, Image as ImageIcon, CreditCard, Mail,
  Phone, BookOpen, Star, ShoppingBag, Heart, Telescope, Eye, Zap,
  MessageSquare, Upload, Check, AlertCircle, Loader2,
  Type, AlignLeft, FileImage, FileText, ChevronRight, Globe, Sparkles,
  Info,
} from 'lucide-react';
import { PageContentEditor } from '@/components/admin/page-content-editor';

type FieldType = 'text' | 'textarea' | 'richtext' | 'image';

interface FieldDef {
  key: string;
  label: string;
  hint: string;           // plain English — what does this control?
  type: FieldType;
  placeholder?: string;
  maxLength?: number;
  section?: string;       // group label
}

interface PageDef {
  key: string;
  label: string;
  href: string;
  description: string;   // what this page is for
  icon: React.ElementType;
  fields: FieldDef[];
}

const PAGES: PageDef[] = [
  {
    key: 'home',
    label: 'Home Page',
    href: '/',
    description: 'The first page visitors see when they come to the site.',
    icon: Home,
    fields: [
      { key: 'hero_title', label: 'Main Headline', hint: 'The big bold text front and center — the first thing everyone reads.', type: 'text', placeholder: 'e.g. St. Petersburg Astronomy Club', maxLength: 80, section: 'Hero Section (Top of Page)' },
      { key: 'hero_subtitle', label: 'Tagline / Subheading', hint: 'A short sentence below the headline that describes the club.', type: 'textarea', placeholder: 'e.g. Exploring the universe together since 1975', maxLength: 200, section: 'Hero Section (Top of Page)' },
      { key: 'hero_image', label: 'Hero Background Photo', hint: 'The full-width background image behind the headline. Use a high-quality astronomy or night sky photo.', type: 'image', section: 'Hero Section (Top of Page)' },
      { key: 'cta_primary_text', label: 'Join Button Text', hint: 'The text on the main call-to-action button (usually "Join the Club" or "Become a Member").', type: 'text', placeholder: 'Join the Club', maxLength: 40, section: 'Buttons' },
      { key: 'cta_secondary_text', label: 'Secondary Button Text', hint: 'The text on the second button (usually something like "Learn More" or "View Events").', type: 'text', placeholder: 'View Events', maxLength: 40, section: 'Buttons' },
      { key: 'intro_text', label: 'Welcome Paragraph', hint: 'A short welcome message shown below the hero section introducing the club.', type: 'textarea', placeholder: 'Welcome to the St. Petersburg Astronomy Club...', maxLength: 500, section: 'Welcome Section' },
    ],
  },
  {
    key: 'about',
    label: 'About Page',
    href: '/about',
    description: 'Tells visitors who the club is, its history, and its mission.',
    icon: Users,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The large heading at the top of the About page.', type: 'text', placeholder: 'About SPAC', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description shown just below the title.', type: 'textarea', placeholder: 'Dedicated to astronomy education and stargazing...', maxLength: 200, section: 'Page Header' },
      { key: 'hero_image', label: 'Header Photo', hint: 'Optional: a photo used at the top of the About page.', type: 'image', section: 'Page Header' },
      { key: 'about_body', label: 'About Us Text', hint: 'The main body of the About page — who you are, what you do, why you exist. You can include paragraphs, headings, and bullet points.', type: 'richtext', section: 'Page Content' },
      { key: 'history_snippet', label: 'History Summary', hint: "A short 1-2 sentence summary of the club's history (shown in a callout or sidebar).", type: 'textarea', placeholder: 'Founded in 1975, SPAC has been serving the Tampa Bay area for over 45 years...', maxLength: 300, section: 'Page Content' },
    ],
  },
  {
    key: 'events',
    label: 'Events Page',
    href: '/events',
    description: 'Lists all upcoming club events and star parties.',
    icon: Calendar,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Events page.', type: 'text', placeholder: 'Upcoming Events', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description shown below the title.', type: 'textarea', placeholder: 'Join us for star parties, meetings, and more...', maxLength: 200, section: 'Page Header' },
      { key: 'empty_state_text', label: '"No Events" Message', hint: 'Text shown when there are no upcoming events listed. Example: "Check back soon — new events are coming!"', type: 'text', placeholder: 'No upcoming events at this time. Check back soon!', maxLength: 150, section: 'Page Content' },
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery Page',
    href: '/gallery',
    description: 'Showcases member-submitted astrophotography.',
    icon: ImageIcon,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Gallery page.', type: 'text', placeholder: 'Member Gallery', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description below the title.', type: 'textarea', placeholder: 'Beautiful astrophotography by our members...', maxLength: 200, section: 'Page Header' },
    ],
  },
  {
    key: 'membership',
    label: 'Membership Page',
    href: '/membership',
    description: 'Where visitors sign up and choose a membership plan.',
    icon: CreditCard,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Membership page.', type: 'text', placeholder: 'Join SPAC', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short pitch shown below the title.', type: 'textarea', placeholder: 'Become a member and start exploring the stars with us.', maxLength: 200, section: 'Page Header' },
      { key: 'intro_text', label: 'Introduction / Benefits Overview', hint: 'A brief intro explaining what membership includes. This appears before the pricing cards.', type: 'richtext', section: 'Page Content' },
      { key: 'student_price_monthly', label: 'Student — Monthly Price', hint: 'Just the dollar amount, e.g. "5.00"', type: 'text', placeholder: '5.00', maxLength: 10, section: 'Pricing' },
      { key: 'student_price_annual', label: 'Student — Annual Price', hint: 'Just the dollar amount, e.g. "50.00"', type: 'text', placeholder: '50.00', maxLength: 10, section: 'Pricing' },
      { key: 'individual_price_monthly', label: 'Individual/Single — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '10.00', maxLength: 10, section: 'Pricing' },
      { key: 'individual_price_annual', label: 'Individual/Single — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '100.00', maxLength: 10, section: 'Pricing' },
      { key: 'family_price_monthly', label: 'Family — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '15.00', maxLength: 10, section: 'Pricing' },
      { key: 'family_price_annual', label: 'Family — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '150.00', maxLength: 10, section: 'Pricing' },
      { key: 'patron_price_monthly', label: 'Patron — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '25.00', maxLength: 10, section: 'Pricing' },
      { key: 'patron_price_annual', label: 'Patron — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '250.00', maxLength: 10, section: 'Pricing' },
      { key: 'benefactor_price_monthly', label: 'Benefactor — Monthly Price', hint: 'Just the dollar amount', type: 'text', placeholder: '50.00', maxLength: 10, section: 'Pricing' },
      { key: 'benefactor_price_annual', label: 'Benefactor — Annual Price', hint: 'Just the dollar amount', type: 'text', placeholder: '500.00', maxLength: 10, section: 'Pricing' },
      { key: 'benefits_text', label: 'Member Benefits Details', hint: 'A full list or description of what members get. Use bullet points for easy reading.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter Page',
    href: '/newsletter',
    description: 'Archive of the club newsletter (The Eyepiece).',
    icon: Mail,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Newsletter page.', type: 'text', placeholder: 'The Eyepiece Newsletter', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description shown below the title.', type: 'textarea', placeholder: 'Monthly newsletter for SPAC members...', maxLength: 200, section: 'Page Header' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact Page',
    href: '/contact',
    description: 'How visitors can get in touch with the club.',
    icon: Phone,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Contact page.', type: 'text', placeholder: 'Contact Us', maxLength: 60, section: 'Page Header' },
      { key: 'intro_text', label: 'Introduction', hint: "A friendly opening paragraph inviting visitors to reach out.", type: 'textarea', placeholder: "Have questions? We'd love to hear from you...", maxLength: 300, section: 'Contact Info' },
      { key: 'email', label: 'Contact Email Address', hint: 'The main email address people should use to contact the club.', type: 'text', placeholder: 'info@stpeteastro.org', maxLength: 100, section: 'Contact Info' },
      { key: 'phone', label: 'Phone Number', hint: 'Club phone number (leave blank if none).', type: 'text', placeholder: '(727) 555-0000', maxLength: 30, section: 'Contact Info' },
      { key: 'address', label: 'Mailing Address', hint: "The club's mailing address (shown on the contact page).", type: 'textarea', placeholder: 'P.O. Box 12345\nSt. Petersburg, FL 33701', maxLength: 200, section: 'Contact Info' },
    ],
  },
  {
    key: 'history',
    label: 'Club History',
    href: '/history',
    description: 'The history and story of the club.',
    icon: BookOpen,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the History page.', type: 'text', placeholder: 'Our History', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short phrase shown below the title.', type: 'textarea', placeholder: 'Over 45 years of exploring the night sky...', maxLength: 200, section: 'Page Header' },
      { key: 'body', label: 'History Content', hint: 'The full history of the club. You can use headings to break it into time periods, and add photos with the image insert button.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'mirror-lab',
    label: 'Mirror Lab',
    href: '/mirror-lab',
    description: "Information about the club's telescope mirror-making lab.",
    icon: Telescope,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Mirror Lab page.', type: 'text', placeholder: 'Mirror Lab', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short tagline for the mirror lab.', type: 'textarea', placeholder: 'Build your own telescope mirror with guidance from expert club members.', maxLength: 200, section: 'Page Header' },
      { key: 'hero_image', label: 'Header Photo', hint: 'A photo for the top of the Mirror Lab page (e.g., someone grinding a mirror).', type: 'image', section: 'Page Header' },
      { key: 'body', label: 'Mirror Lab Content', hint: 'All the details about the mirror lab — how it works, how to participate, schedule, etc.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'viewing',
    label: 'Viewing Sites',
    href: '/viewing',
    description: 'List of dark sky viewing locations used by the club.',
    icon: Eye,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Viewing Sites page.', type: 'text', placeholder: 'Viewing Sites', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description of the viewing sites.', type: 'textarea', placeholder: 'Discover the best dark sky locations in the Tampa Bay area.', maxLength: 200, section: 'Page Header' },
      { key: 'body', label: 'Viewing Sites Content', hint: 'Details about each viewing location — name, address, directions, what to expect, rules, etc.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'general-meetings',
    label: 'General Meetings',
    href: '/general-meetings',
    description: "Information about the club's regular monthly meetings.",
    icon: MessageSquare,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the General Meetings page.', type: 'text', placeholder: 'General Meetings', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description of when and where meetings are held.', type: 'textarea', placeholder: 'Join us every third Friday of the month...', maxLength: 200, section: 'Page Header' },
      { key: 'body', label: 'Meetings Content', hint: 'Full details about general meetings — day, time, location, parking, what happens at a meeting, etc.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'classifieds',
    label: 'Classifieds',
    href: '/classifieds',
    description: 'Member telescope and equipment buy/sell listings.',
    icon: ShoppingBag,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Classifieds page.', type: 'text', placeholder: 'Member Classifieds', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description of the classifieds section.', type: 'textarea', placeholder: 'Buy and sell telescopes, eyepieces, and astronomy gear...', maxLength: 200, section: 'Page Header' },
      { key: 'rules_text', label: 'Classifieds Rules & Policy', hint: 'The rules and guidelines for posting classifieds ads. Members will read this before posting.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'donations',
    label: 'Donations',
    href: '/donations',
    description: 'Page where visitors can make donations to the club.',
    icon: Heart,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Donations page.', type: 'text', placeholder: 'Support SPAC', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short tagline encouraging donations.', type: 'textarea', placeholder: 'Help us keep the stars accessible to everyone.', maxLength: 200, section: 'Page Header' },
      { key: 'body', label: 'Donation Appeal', hint: 'A heartfelt message about why donations matter and what the money funds (equipment, events, outreach programs, etc.).', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'obs',
    label: 'OBS Event',
    href: '/obs',
    description: 'The public page for the annual Observing Skills event.',
    icon: Star,
    fields: [
      { key: 'hero_title', label: 'Event Title', hint: 'The name of the OBS event shown at the top of the page.', type: 'text', placeholder: 'Observing Skills Event', maxLength: 80, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Event Tagline', hint: 'A short description of the event shown below the title.', type: 'textarea', placeholder: 'An annual celebration of astronomical observation...', maxLength: 200, section: 'Page Header' },
      { key: 'hero_image', label: 'Event Banner Photo', hint: 'A large photo used as the banner for the OBS event page.', type: 'image', section: 'Page Header' },
      { key: 'description', label: 'Event Description', hint: 'Full details about the event — what it is, who can attend, schedule, what to bring, registration info, etc.', type: 'richtext', section: 'Page Content' },
    ],
  },
  {
    key: 'star-party-request',
    label: 'Star Party Request',
    href: '/star-party-request',
    description: 'Form page where schools and groups can request a star party.',
    icon: Zap,
    fields: [
      { key: 'hero_title', label: 'Page Title', hint: 'The heading at the top of the Star Party Request page.', type: 'text', placeholder: 'Request a Star Party', maxLength: 60, section: 'Page Header' },
      { key: 'hero_subtitle', label: 'Page Subtitle', hint: 'A short description of the program.', type: 'textarea', placeholder: 'Bring the wonders of the universe to your school or group.', maxLength: 200, section: 'Page Header' },
      { key: 'intro_text', label: 'Introduction Text', hint: "An explanation of the star party program — what it is, who it's for, what's involved, how to fill out the form.", type: 'textarea', placeholder: 'Our club members love sharing astronomy with the community...', maxLength: 600, section: 'Page Content' },
    ],
  },
];

// Field type icons and colors
const FIELD_TYPE_META = {
  text:     { icon: Type,      color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Short Text'    },
  textarea: { icon: AlignLeft, color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Paragraph'     },
  richtext: { icon: FileText,  color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Rich Content'  },
  image:    { icon: FileImage, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Image'         },
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function PageBuilderPage() {
  const [selectedPage, setSelectedPage] = useState<PageDef>(PAGES[0]);
  const [contentMap, setContentMap] = useState<Record<string, Record<string, string>>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetch('/api/admin/page-builder')
      .then(r => r.ok ? r.json() : {})
      .then(data => setContentMap(data))
      .finally(() => setLoading(false));
  }, []);

  const val = (fieldKey: string) => contentMap[selectedPage.key]?.[fieldKey] ?? '';

  const save = useCallback((fieldKey: string, value: string) => {
    const pageKey = selectedPage.key;
    setContentMap(prev => ({ ...prev, [pageKey]: { ...(prev[pageKey] || {}), [fieldKey]: value } }));
    const k = `${pageKey}:${fieldKey}`;
    setSaveStatus(prev => ({ ...prev, [k]: 'saving' }));
    clearTimeout(saveTimers.current[k]);
    saveTimers.current[k] = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/page-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageKey, fieldKey, value }),
        });
        const next = res.ok ? 'saved' : 'error';
        setSaveStatus(prev => ({ ...prev, [k]: next }));
        if (next === 'saved') setTimeout(() => setSaveStatus(prev => ({ ...prev, [k]: 'idle' })), 2500);
      } catch {
        setSaveStatus(prev => ({ ...prev, [k]: 'error' }));
      }
    }, 700);
  }, [selectedPage.key]);

  const uploadImage = useCallback(async (fieldKey: string, file: File) => {
    const k = `${selectedPage.key}:${fieldKey}`;
    setUploadingField(k);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pageKey', selectedPage.key);
      fd.append('fieldKey', fieldKey);
      const res = await fetch('/api/admin/page-builder/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      save(fieldKey, url);
    } catch {
      setSaveStatus(prev => ({ ...prev, [k]: 'error' }));
    } finally {
      setUploadingField(null);
    }
  }, [selectedPage.key, save]);

  // Group fields by section
  const sections = selectedPage.fields.reduce<Record<string, FieldDef[]>>((acc, f) => {
    const s = f.section || 'General';
    if (!acc[s]) acc[s] = [];
    acc[s].push(f);
    return acc;
  }, {});

  return (
    <div className="flex gap-0 h-[calc(100vh-7rem)] -mx-4 md:-mx-6">
      {/* Left sidebar: page list */}
      <div className="w-52 shrink-0 border-r border-white/[0.06] bg-[#060611] overflow-y-auto flex flex-col">
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">Pages</p>
        </div>
        {PAGES.map(page => {
          const Icon = page.icon;
          const active = selectedPage.key === page.key;
          return (
            <button
              key={page.key}
              onClick={() => setSelectedPage(page)}
              className={`mx-2 mb-0.5 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                active
                  ? 'bg-indigo-600/15 text-indigo-300 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate text-[13px]">{page.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto bg-[#080812]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Loading page content...
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 pb-16 space-y-8">
            {/* Page header banner */}
            <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600/20 rounded-xl">
                    <selectedPage.icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedPage.label}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">{selectedPage.description}</p>
                  </div>
                </div>
                <a
                  href={selectedPage.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg text-sm transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Visit Page
                </a>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <p className="text-xs text-slate-400">Changes save automatically. Visitors will see updates within a few seconds of saving.</p>
              </div>
            </div>

            {/* Sections */}
            {Object.entries(sections).map(([sectionName, fields]) => (
              <div key={sectionName}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">{sectionName}</h3>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="space-y-4">
                  {fields.map(field => {
                    const typeMeta = FIELD_TYPE_META[field.type];
                    const TypeIcon = typeMeta.icon;
                    const fieldVal = val(field.key);
                    const statusKey = `${selectedPage.key}:${field.key}`;
                    const status = saveStatus[statusKey] || 'idle';
                    const isUploading = uploadingField === statusKey;

                    return (
                      <div key={field.key} className="bg-slate-800/40 border border-white/[0.07] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors">
                        {/* Field header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-slate-900/30">
                          <div className={`p-1.5 rounded-lg ${typeMeta.bg}`}>
                            <TypeIcon className={`h-3.5 w-3.5 ${typeMeta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{field.label}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeMeta.bg} ${typeMeta.color}`}>{typeMeta.label}</span>
                            </div>
                          </div>
                          {/* Save status */}
                          <div className="shrink-0 text-xs">
                            {status === 'saving' && <span className="text-slate-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving</span>}
                            {status === 'saved' && <span className="text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" />Saved</span>}
                            {status === 'error' && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Error</span>}
                          </div>
                        </div>

                        {/* Hint */}
                        <div className="flex items-start gap-2 px-4 py-2.5 bg-blue-500/[0.04] border-b border-white/[0.05]">
                          <Info className="h-3.5 w-3.5 text-blue-400/60 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-400 leading-relaxed">{field.hint}</p>
                        </div>

                        {/* Input */}
                        <div className="p-4">
                          {field.type === 'text' && (
                            <div>
                              <input
                                type="text"
                                value={fieldVal}
                                onChange={e => save(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                              />
                              {field.maxLength && (
                                <p className="text-[11px] text-slate-500 mt-1.5 text-right">{fieldVal.length} / {field.maxLength}</p>
                              )}
                            </div>
                          )}

                          {field.type === 'textarea' && (
                            <div>
                              <textarea
                                value={fieldVal}
                                onChange={e => save(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                                rows={3}
                                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm resize-y"
                              />
                              {field.maxLength && (
                                <p className="text-[11px] text-slate-500 mt-1 text-right">{fieldVal.length} / {field.maxLength}</p>
                              )}
                            </div>
                          )}

                          {field.type === 'richtext' && (
                            <PageContentEditor
                              value={fieldVal}
                              onChange={v => save(field.key, v)}
                              placeholder={field.placeholder || `Write ${field.label.toLowerCase()} here...`}
                            />
                          )}

                          {field.type === 'image' && (
                            <div
                              onDragOver={e => { e.preventDefault(); setDragOver(statusKey); }}
                              onDragLeave={() => setDragOver(null)}
                              onDrop={e => {
                                e.preventDefault();
                                setDragOver(null);
                                const f = e.dataTransfer.files[0];
                                if (f?.type.startsWith('image/')) uploadImage(field.key, f);
                              }}
                              className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                                dragOver === statusKey
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-white/10 hover:border-white/20'
                              }`}
                            >
                              {fieldVal ? (
                                <div className="relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={fieldVal} alt="Current" className="w-full h-48 object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                                      <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(field.key, f); e.target.value = ''; }} disabled={isUploading} />
                                      <Upload className="h-4 w-4" />
                                      Replace Photo
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                                  <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(field.key, f); e.target.value = ''; }} disabled={isUploading} />
                                  {isUploading ? (
                                    <><Loader2 className="h-10 w-10 text-slate-500 animate-spin" /><p className="text-sm text-slate-400">Uploading...</p></>
                                  ) : (
                                    <>
                                      <div className="p-4 bg-slate-700/50 rounded-2xl"><ImageIcon className="h-8 w-8 text-slate-400" /></div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-300">Click to upload a photo</p>
                                        <p className="text-xs text-slate-500 mt-1">or drag and drop it here</p>
                                        <p className="text-xs text-slate-600 mt-1">JPG, PNG, WEBP — max 10MB</p>
                                      </div>
                                    </>
                                  )}
                                </label>
                              )}
                              {isUploading && fieldVal && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
