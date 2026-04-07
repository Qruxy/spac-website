'use client';

/**
 * Communications Panel — Admin Dashboard (v2)
 * Redesigned with dark-terminal aesthetic (TYDE/Nexus-inspired).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mail, Send, Eye, Plus, Edit2, Trash2, Users, FileText, Clock,
  CheckCircle2, XCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  X, FolderPlus, UserPlus, UserMinus, Search, AtSign, Zap, ChevronDown,
  ChevronUp, ToggleLeft, ToggleRight, ImagePlus, BarChart2, Sparkles,
  Tag, RefreshCw, Paperclip,
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { SocialCrossPostPanel } from '@/components/admin/social-cross-post-panel';

// ── Types ────────────────────────────────────────────────────────────────────
type Category = 'GENERAL' | 'WELCOME' | 'MEMBERSHIP' | 'EVENT' | 'NEWSLETTER' | 'ADMIN' | 'SYSTEM';
type MembershipType = 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'PATRON' | 'BENEFACTOR' | 'LIFETIME';
type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
type Role = 'ADMIN' | 'MODERATOR' | 'MEMBER';
type EmailStatus = 'SENDING' | 'SENT' | 'FAILED';

interface Template {
  id: string; name: string; subject: string; bodyHtml: string;
  description?: string; category?: Category; variables?: string[];
  isActive: boolean; usageCount: number; createdAt: string; updatedAt: string;
}
interface EmailLog {
  id: string; recipient: string; recipientId: string; subject: string;
  status: EmailStatus; sentAt: string; templateId?: string; templateName?: string; error?: string;
}
interface RecipientFilter {
  all?: boolean; roles?: Role[]; membershipTypes?: MembershipType[];
  membershipStatuses?: MembershipStatus[]; groupIds?: string[];
}
interface MemberGroup {
  id: string; name: string; description: string | null; createdAt: string;
  createdBy: { firstName: string; lastName: string }; _count: { members: number };
}
interface GroupDetail extends MemberGroup {
  members: { userId: string; user: { id: string; firstName: string; lastName: string; email: string; role: string } }[];
}
interface UserSearchResult { id: string; firstName: string; lastName: string; email: string; role: string; }

// ── Category colours ─────────────────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  GENERAL:    { bg: 'bg-slate-700/60',    text: 'text-slate-300',   dot: 'bg-slate-400' },
  WELCOME:    { bg: 'bg-emerald-600/20',  text: 'text-emerald-300', dot: 'bg-emerald-400' },
  MEMBERSHIP: { bg: 'bg-indigo-600/20',   text: 'text-indigo-300',  dot: 'bg-indigo-400' },
  EVENT:      { bg: 'bg-amber-600/20',    text: 'text-amber-300',   dot: 'bg-amber-400' },
  NEWSLETTER: { bg: 'bg-blue-600/20',     text: 'text-blue-300',    dot: 'bg-blue-400' },
  ADMIN:      { bg: 'bg-purple-600/20',   text: 'text-purple-300',  dot: 'bg-purple-400' },
  SYSTEM:     { bg: 'bg-rose-600/20',     text: 'text-rose-300',    dot: 'bg-rose-400' },
};

// ── Shared atoms ─────────────────────────────────────────────────────────────
function Toast({ toast, onClose }: { toast: { type: 'success' | 'error'; message: string }; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${
      toast.type === 'success'
        ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
        : 'bg-red-950/90 border-red-500/30 text-red-200'
    } backdrop-blur-sm`}>
      {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-2">{children}</p>;
}

function fmtDate(val: string | null | undefined, includeTime = true): string {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

function FilterChip({ label, active, disabled, onClick }: { label: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-400/50'
          : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

// ── Root shell ────────────────────────────────────────────────────────────────
type Tab = 'compose' | 'templates' | 'history' | 'groups' | 'automations' | 'deliverability';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'compose',       label: 'Compose',       icon: <Send className="h-3.5 w-3.5" /> },
  { id: 'templates',     label: 'Templates',     icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'history',       label: 'History',       icon: <Clock className="h-3.5 w-3.5" /> },
  { id: 'groups',        label: 'Groups',        icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'automations',   label: 'Automations',   icon: <Zap className="h-3.5 w-3.5" /> },
  { id: 'deliverability',label: 'Deliverability',icon: <BarChart2 className="h-3.5 w-3.5" /> },
];

export function CommunicationsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('compose');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
            <Mail className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">Admin</p>
            <h1 className="text-xl font-black text-white tracking-tight leading-none mt-0.5">Communications</h1>
          </div>
        </div>
      </div>

      {/* Tab Nav — pill style */}
      <div className="flex gap-1.5 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === t.id
                ? 'bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/40 shadow-inner'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'compose'        && <ComposeTab />}
      {activeTab === 'templates'      && <TemplatesTab />}
      {activeTab === 'history'        && <HistoryTab />}
      {activeTab === 'groups'         && <GroupsTab />}
      {activeTab === 'automations'    && <AutomationsTab />}
      {activeTab === 'deliverability' && <DeliverabilityTab />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — COMPOSE
// ══════════════════════════════════════════════════════════════════════════════
function ComposeTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({});
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [insertingImage, setInsertingImage] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ filename: string; url: string; size: number }>>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Accordion open state for recipient sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    role: false, type: false, status: false, group: false, manual: false,
  });

  useEffect(() => { loadTemplates(); loadGroups(); }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/communications/templates');
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); }
    } catch {}
  };
  const loadGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups');
      if (res.ok) setGroups(await res.json());
    } catch {}
  };

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasRecipients =
    recipientFilter.all ||
    (recipientFilter.roles?.length ?? 0) > 0 ||
    (recipientFilter.membershipTypes?.length ?? 0) > 0 ||
    (recipientFilter.membershipStatuses?.length ?? 0) > 0 ||
    (recipientFilter.groupIds?.length ?? 0) > 0 ||
    manualEmails.length > 0;

  // Count active filter selections for badge
  const selectionCount =
    (recipientFilter.all ? 1 : 0) +
    (recipientFilter.roles?.length ?? 0) +
    (recipientFilter.membershipTypes?.length ?? 0) +
    (recipientFilter.membershipStatuses?.length ?? 0) +
    (recipientFilter.groupIds?.length ?? 0) +
    manualEmails.length;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const t = templates.find((t) => t.id === templateId);
    if (t) { setSubject(t.subject || ''); setBodyHtml(t.bodyHtml || ''); }
  };

  const handleAttachFile = useCallback(async (file: File) => {
    const MAX = 15 * 1024 * 1024;
    if (file.size > MAX) { setToast({ type: 'error', message: 'Attachment must be under 15 MB' }); return; }
    setUploadingAttachment(true);
    try {
      const { uploadFile } = await import('@/lib/upload-file');
      const url = await uploadFile(file, 'email-attachments', 'attach');
      setAttachments((a) => [...a, { filename: file.name, url, size: file.size }]);
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Attachment upload failed' });
    } finally {
      setUploadingAttachment(false);
    }
  }, []);

  const handleSendEmail = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, html: bodyHtml,
          templateId: selectedTemplate || undefined,
          recipientFilter: recipientFilter.all || recipientFilter.roles?.length || recipientFilter.membershipTypes?.length || recipientFilter.membershipStatuses?.length || recipientFilter.groupIds?.length
            ? recipientFilter : undefined,
          manualEmails: manualEmails.length > 0 ? manualEmails : undefined,
          attachments: attachments.length > 0 ? attachments.map(({ filename, url }) => ({ filename, url })) : undefined,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setToast({ type: 'success', message: `Sent to ${result.totalRecipients} recipient${result.totalRecipients !== 1 ? 's' : ''}` });
        setSubject(''); setBodyHtml(''); setSelectedTemplate('');
        setRecipientFilter({}); setManualEmails([]); setManualEmailInput('');
        setAttachments([]);
      } else {
        const e = await res.json();
        setToast({ type: 'error', message: e.error || 'Failed to send email' });
      }
    } catch { setToast({ type: 'error', message: 'Network error' }); }
    finally { setLoading(false); setTimeout(() => setToast(null), 5000); }
  };

  const handleInsertImage = async (file: File) => {
    setInsertingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('pageKey', 'email-composer'); fd.append('fieldKey', `inline-${Date.now()}`);
      const res = await fetch('/api/admin/page-builder/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setBodyHtml((prev) => prev + `<img src="${url}" alt="Inserted image" style="max-width:100%;height:auto;" />`);
    } catch { setToast({ type: 'error', message: 'Image upload failed' }); setTimeout(() => setToast(null), 4000); }
    finally { setInsertingImage(false); }
  };

  const toggleRole = (role: Role) => {
    const roles = recipientFilter.roles || [];
    setRecipientFilter({ ...recipientFilter, all: false, roles: roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role] });
  };
  const toggleMembershipType = (type: MembershipType) => {
    const types = recipientFilter.membershipTypes || [];
    setRecipientFilter({ ...recipientFilter, all: false, membershipTypes: types.includes(type) ? types.filter((t) => t !== type) : [...types, type] });
  };
  const toggleMembershipStatus = (status: MembershipStatus) => {
    const statuses = recipientFilter.membershipStatuses || [];
    setRecipientFilter({ ...recipientFilter, all: false, membershipStatuses: statuses.includes(status) ? statuses.filter((s) => s !== status) : [...statuses, status] });
  };
  const toggleGroup = (groupId: string) => {
    const gids = recipientFilter.groupIds || [];
    setRecipientFilter({ ...recipientFilter, all: false, groupIds: gids.includes(groupId) ? gids.filter((g) => g !== groupId) : [...gids, groupId] });
  };
  const toggleAll = () => setRecipientFilter(recipientFilter.all ? {} : { all: true, roles: [], membershipTypes: [], membershipStatuses: [], groupIds: [] });

  const addManualEmail = () => {
    const email = manualEmailInput.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !manualEmails.includes(email)) {
      setManualEmails([...manualEmails, email]); setManualEmailInput('');
    }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── LEFT: Recipients ──────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Recipients</span>
              </div>
              {selectionCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-400/30">
                  {selectionCount} selected
                </span>
              )}
            </div>

            <div className="p-4 space-y-1">
              {/* All Members */}
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-colors group">
                <input
                  type="checkbox" checked={recipientFilter.all || false} onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">All Members</span>
                <span className="ml-auto text-[10px] text-white/30">everyone</span>
              </label>

              {/* Accordion sections */}
              {[
                {
                  key: 'role', label: 'By Role',
                  count: recipientFilter.roles?.length ?? 0,
                  content: (
                    <div className="flex flex-wrap gap-1.5 pt-2 pb-1">
                      {(['ADMIN', 'MODERATOR', 'MEMBER'] as Role[]).map((r) => (
                        <FilterChip key={r} label={r} active={!!recipientFilter.roles?.includes(r)} disabled={recipientFilter.all} onClick={() => toggleRole(r)} />
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'type', label: 'By Membership',
                  count: recipientFilter.membershipTypes?.length ?? 0,
                  content: (
                    <div className="flex flex-wrap gap-1.5 pt-2 pb-1">
                      {(['INDIVIDUAL', 'FAMILY', 'STUDENT', 'PATRON', 'BENEFACTOR', 'LIFETIME'] as MembershipType[]).map((t) => (
                        <FilterChip key={t} label={t} active={!!recipientFilter.membershipTypes?.includes(t)} disabled={recipientFilter.all} onClick={() => toggleMembershipType(t)} />
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'status', label: 'By Status',
                  count: recipientFilter.membershipStatuses?.length ?? 0,
                  content: (
                    <div className="flex flex-wrap gap-1.5 pt-2 pb-1">
                      {(['ACTIVE', 'EXPIRED'] as MembershipStatus[]).map((s) => (
                        <FilterChip key={s} label={s} active={!!recipientFilter.membershipStatuses?.includes(s)} disabled={recipientFilter.all} onClick={() => toggleMembershipStatus(s)} />
                      ))}
                    </div>
                  ),
                },
                ...(groups.length > 0 ? [{
                  key: 'group', label: 'By Group',
                  count: recipientFilter.groupIds?.length ?? 0,
                  content: (
                    <div className="flex flex-wrap gap-1.5 pt-2 pb-1">
                      {groups.map((g) => (
                        <FilterChip key={g.id} label={`${g.name} (${g._count.members})`} active={!!recipientFilter.groupIds?.includes(g.id)} disabled={recipientFilter.all} onClick={() => toggleGroup(g.id)} />
                      ))}
                    </div>
                  ),
                }] : []),
                {
                  key: 'manual', label: 'Manual Addresses',
                  count: manualEmails.length,
                  content: (
                    <div className="pt-2 pb-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="email" value={manualEmailInput}
                          onChange={(e) => setManualEmailInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualEmail(); } }}
                          placeholder="email@example.com"
                          className="flex-1 px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:border-indigo-500/60 focus:outline-none"
                        />
                        <button onClick={addManualEmail} className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition-colors">
                          Add
                        </button>
                      </div>
                      {manualEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {manualEmails.map((email) => (
                            <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-xs ring-1 ring-indigo-400/20">
                              <AtSign className="h-2.5 w-2.5" />
                              {email}
                              <button onClick={() => setManualEmails(manualEmails.filter((e) => e !== email))} className="ml-0.5 opacity-60 hover:opacity-100">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
              ].map(({ key, label, count, content }) => (
                <div key={key} className="rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors rounded-xl ${
                      openSections[key] ? 'bg-white/[0.05] text-white' : 'hover:bg-white/[0.04] text-white/60 hover:text-white/80'
                    }`}
                  >
                    <span className="font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200">
                          {count}
                        </span>
                      )}
                      {openSections[key] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                  {openSections[key] && (
                    <div className="px-3">{content}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Compose ────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Email envelope card */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Envelope header */}
            <div className="border-b border-white/[0.06] divide-y divide-white/[0.06]">
              {/* From */}
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="text-[11px] font-semibold text-white/30 w-16 shrink-0">FROM</span>
                <span className="text-sm text-white/60 font-mono">SPAC &lt;noreply@stpeteastronomyclub.org&gt;</span>
              </div>
              {/* To */}
              <div className="flex items-start gap-3 px-5 py-3 min-h-[46px]">
                <span className="text-[11px] font-semibold text-white/30 w-16 shrink-0 mt-0.5">TO</span>
                <div className="flex-1">
                  {selectionCount === 0 ? (
                    <span className="text-sm text-white/25 italic">Select recipients on the left…</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {recipientFilter.all && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs ring-1 ring-indigo-400/20"><Users className="h-2.5 w-2.5" />All Members</span>}
                      {recipientFilter.roles?.map((r) => <span key={r} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs ring-1 ring-purple-400/20">{r}</span>)}
                      {recipientFilter.membershipTypes?.map((t) => <span key={t} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs ring-1 ring-blue-400/20">{t}</span>)}
                      {recipientFilter.membershipStatuses?.map((s) => <span key={s} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs ring-1 ring-emerald-400/20">{s}</span>)}
                      {recipientFilter.groupIds?.map((gid) => {
                        const g = groups.find((x) => x.id === gid);
                        return <span key={gid} className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs ring-1 ring-amber-400/20">{g?.name ?? gid}</span>;
                      })}
                      {manualEmails.map((e) => <span key={e} className="px-2 py-0.5 bg-slate-600/50 text-slate-300 rounded-full text-xs font-mono">{e}</span>)}
                    </div>
                  )}
                </div>
              </div>
              {/* Subject */}
              <div className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-[11px] font-semibold text-white/30 w-16 shrink-0">SUBJECT</span>
                <input
                  type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
                />
              </div>
              {/* Attachments row */}
              <div className="flex items-start gap-3 px-5 py-2.5 min-h-[40px]">
                <span className="text-[11px] font-semibold text-white/30 w-16 shrink-0 mt-0.5">ATTACH</span>
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  {attachments.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-white/70 max-w-[220px]">
                      <Paperclip className="h-3 w-3 text-white/40 shrink-0" />
                      <span className="truncate">{a.filename}</span>
                      <span className="text-white/30 text-[10px] shrink-0">{(a.size / 1024).toFixed(0)}KB</span>
                      <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} className="ml-0.5 text-white/30 hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                  <input ref={attachInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx" multiple className="sr-only"
                    onChange={(e) => { Array.from(e.target.files || []).forEach(handleAttachFile); e.target.value = ''; }}
                  />
                  <button type="button" onClick={() => attachInputRef.current?.click()} disabled={uploadingAttachment}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white/70 hover:border-white/20 transition-colors disabled:opacity-40">
                    {uploadingAttachment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                    {uploadingAttachment ? 'Uploading…' : 'Attach file'}
                  </button>
                </div>
              </div>
            </div>

            {/* Template picker strip */}
            {templates.filter((t) => t.isActive).length > 0 && (
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-semibold text-white/40 shrink-0">TEMPLATE</span>
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar flex-1">
                  {selectedTemplate && (
                    <button
                      onClick={() => { setSelectedTemplate(''); }}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-white/50 rounded-full text-xs transition-colors"
                    >
                      <X className="h-2.5 w-2.5" /> Clear
                    </button>
                  )}
                  {templates.filter((t) => t.isActive).map((t) => {
                    const cat = CATEGORY_STYLE[t.category || 'GENERAL'];
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleTemplateSelect(t.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedTemplate === t.id
                            ? 'bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-400/40'
                            : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Body editor */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Email Body</SectionLabel>
                <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/50 hover:text-white/80 rounded-lg text-xs transition-colors">
                  <input type="file" accept="image/*" className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInsertImage(f); e.target.value = ''; }}
                    disabled={insertingImage}
                  />
                  {insertingImage ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</> : <><ImagePlus className="h-3 w-3" /> Insert Image</>}
                </label>
              </div>
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} placeholder="Write your email…" />
            </div>
          </div>

          {/* Social cross-post */}
          <SocialCrossPostPanel subject={subject} bodyText={(bodyHtml || '').replace(/<[^>]+>/g, '').slice(0, 2000)} />

          {/* Actions bar */}
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!subject || !bodyHtml}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 hover:text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!subject || !bodyHtml || !hasRecipients || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? 'Sending…' : `Send Email${selectionCount > 0 ? '' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Modal onClose={() => setShowPreview(false)} title="Email Preview" size="large">
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-white/[0.04] rounded-xl">
              <span className="text-xs font-semibold text-white/40 w-16">SUBJECT</span>
              <span className="text-sm text-white">{subject}</span>
            </div>
            <div className="rounded-xl overflow-hidden ring-1 ring-white/10">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 bg-white/[0.04] px-4 py-2">Rendered Preview</div>
              <div className="bg-white text-black p-6 min-h-[200px]" dangerouslySetInnerHTML={{ __html: bodyHtml || '' }} />
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <Modal
          onClose={() => setShowConfirm(false)} title="Confirm Send"
          actions={
            <>
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-white/[0.07] hover:bg-white/[0.12] text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={handleSendEmail} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors">Confirm & Send</button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-white/70 text-sm">You&apos;re about to send this email. This cannot be undone.</p>
            <div className="p-4 bg-black/20 rounded-xl border border-white/[0.07] space-y-2 text-sm">
              <p className="text-white/80"><span className="text-white/40 font-medium">Subject:</span> {subject}</p>
              {recipientFilter.all && <p className="text-white/80"><span className="text-white/40 font-medium">To:</span> All members</p>}
              {(recipientFilter.roles?.length ?? 0) > 0 && <p className="text-white/80"><span className="text-white/40 font-medium">Roles:</span> {recipientFilter.roles?.join(', ')}</p>}
              {(recipientFilter.groupIds?.length ?? 0) > 0 && <p className="text-white/80"><span className="text-white/40 font-medium">Groups:</span> {recipientFilter.groupIds?.map((gid) => groups.find((g) => g.id === gid)?.name ?? gid).join(', ')}</p>}
              {manualEmails.length > 0 && <p className="text-white/80"><span className="text-white/40 font-medium">Manual:</span> {manualEmails.join(', ')}</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════
function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterCat, setFilterCat] = useState<string>('');

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/communications/templates');
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); }
    } catch {}
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const res = await fetch(`/api/admin/communications/templates/${id}`, { method: 'DELETE' });
    if (res.ok) { setToast({ type: 'success', message: 'Template deleted' }); loadTemplates(); }
    else setToast({ type: 'error', message: 'Delete failed' });
    setTimeout(() => setToast(null), 5000);
  };

  const categories = Array.from(new Set(templates.map((t) => t.category || 'GENERAL')));
  const visible = filterCat ? templates.filter((t) => (t.category || 'GENERAL') === filterCat) : templates;

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-4">
        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat('')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${!filterCat ? 'bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/40' : 'text-white/40 hover:text-white/70 bg-white/[0.04]'}`}>
            All ({templates.length})
          </button>
          {categories.map((cat) => {
            const s = CATEGORY_STYLE[cat] || CATEGORY_STYLE.GENERAL;
            const n = templates.filter((t) => (t.category || 'GENERAL') === cat).length;
            return (
              <button key={cat} onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterCat === cat ? `${s.bg} ${s.text} ring-1` : 'text-white/40 hover:text-white/60 bg-white/[0.03]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{cat} ({n})
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { setEditingTemplate(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-900/30 shrink-0"
        >
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/30"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <FileText className="h-10 w-10 mb-3 opacity-30" />
          <p>No templates yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((t) => {
            const cat = CATEGORY_STYLE[t.category || 'GENERAL'];
            return (
              <div key={t.id} className="group bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 flex flex-col gap-3 transition-all">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${cat.bg} ${cat.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                      {t.category || 'GENERAL'}
                    </span>
                    {!t.isActive && <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700/60 text-slate-400">Inactive</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTemplate(t); setShowForm(true); }} className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors" title="Edit">
                      <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors" title="Delete">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Name & subject */}
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">{t.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{t.subject}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/[0.06]">
                  <div className="flex items-center gap-1 text-[10px] text-white/30">
                    <Tag className="h-2.5 w-2.5" />
                    {t.usageCount || 0} use{t.usageCount !== 1 ? 's' : ''}
                  </div>
                  <span className="text-[10px] text-white/25">{fmtDate(t.updatedAt, false)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={() => { setShowForm(false); setEditingTemplate(null); loadTemplates(); }}
          onSuccess={(msg) => { setToast({ type: 'success', message: msg }); setTimeout(() => setToast(null), 5000); }}
        />
      )}
    </div>
  );
}

function TemplateFormModal({ template, onClose, onSuccess }: { template: Template | null; onClose: () => void; onSuccess: (msg: string) => void }) {
  const [form, setForm] = useState({
    name: template?.name || '', subject: template?.subject || '',
    bodyHtml: template?.bodyHtml || '', description: template?.description || '',
    category: template?.category || 'GENERAL', variables: template?.variables?.join(', ') || '',
    isActive: template?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const url = template ? `/api/admin/communications/templates/${template.id}` : '/api/admin/communications/templates';
      const method = template ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, subject: form.subject, bodyHtml: form.bodyHtml,
          description: form.description || undefined,
          category: form.category as Category,
          variables: form.variables ? form.variables.split(',').map((v) => v.trim()).filter(Boolean) : undefined,
          isActive: form.isActive,
        }),
      });
      if (res.ok) { onSuccess(template ? 'Template updated' : 'Template created'); onClose(); }
      else { const d = await res.json(); setError(d.error || 'Save failed'); }
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose} title={template ? 'Edit Template' : 'New Template'} size="large"
      actions={
        <>
          <button onClick={onClose} className="px-4 py-2 bg-white/[0.07] hover:bg-white/[0.12] text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.name || !form.subject || !form.bodyHtml}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40">
            {loading ? 'Saving…' : 'Save Template'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionLabel>Name *</SectionLabel>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none placeholder-white/25" />
          </div>
          <div>
            <SectionLabel>Category *</SectionLabel>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none">
              {Object.keys(CATEGORY_STYLE).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <SectionLabel>Subject *</SectionLabel>
          <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none placeholder-white/25" />
        </div>
        <div>
          <SectionLabel>Description</SectionLabel>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description…"
            className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none placeholder-white/25" />
        </div>
        <div>
          <SectionLabel>Variables (comma-separated)</SectionLabel>
          <input type="text" value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })}
            placeholder="e.g. firstName, lastName, email"
            className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none placeholder-white/25 font-mono" />
        </div>
        <div>
          <SectionLabel>Email Body *</SectionLabel>
          <RichTextEditor value={form.bodyHtml} onChange={(v) => setForm({ ...form, bodyHtml: v })} placeholder="Write the template body…" />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Active (appears in template picker)</span>
        </label>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — HISTORY
// ══════════════════════════════════════════════════════════════════════════════
function HistoryTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EmailStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => { loadHistory(); }, [currentPage, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(limit) });
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/admin/communications?${params}`);
      if (res.ok) { const d = await res.json(); setLogs(d.logs || []); setTotalPages(Math.ceil((d.total || 0) / limit)); }
    } catch {}
    finally { setLoading(false); }
  };

  const StatusBadge = ({ status }: { status: EmailStatus }) => {
    const map: Record<EmailStatus, string> = {
      SENT:    'bg-emerald-500/20 text-emerald-300 ring-emerald-400/20',
      SENDING: 'bg-blue-500/20 text-blue-300 ring-blue-400/20',
      FAILED:  'bg-red-500/20 text-red-300 ring-red-400/20',
    };
    const icons: Record<EmailStatus, React.ReactNode> = {
      SENT:    <CheckCircle2 className="h-3 w-3" />,
      SENDING: <Loader2 className="h-3 w-3 animate-spin" />,
      FAILED:  <XCircle className="h-3 w-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${map[status]}`}>
        {icons[status]} {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SectionLabel>Filter</SectionLabel>
        <div className="flex gap-1.5">
          {(['', 'SENT', 'SENDING', 'FAILED'] as (EmailStatus | '')[]).map((s) => (
            <button key={s || 'all'} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${statusFilter === s ? 'bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/40' : 'text-white/40 hover:text-white/60 bg-white/[0.04]'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <button onClick={loadHistory} className="ml-auto p-1.5 hover:bg-white/[0.07] rounded-lg transition-colors text-white/40 hover:text-white/70" title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/30"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <Clock className="h-8 w-8 mb-2 opacity-30" /><p className="text-sm">No email history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Recipient', 'Subject', 'Template', 'Status', 'Sent At'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-white/80 font-medium">{log.recipient}</td>
                    <td className="px-5 py-3.5 text-white/50 max-w-xs truncate">{log.subject}</td>
                    <td className="px-5 py-3.5 text-white/35 text-xs">{log.templateName || 'Custom'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                    <td className="px-5 py-3.5 text-white/30 text-xs">{fmtDate(log.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/30 text-xs">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-2 bg-white/[0.05] hover:bg-white/[0.09] rounded-xl transition-colors disabled:opacity-30"><ChevronLeft className="h-4 w-4 text-white" /></button>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-2 bg-white/[0.05] hover:bg-white/[0.09] rounded-xl transition-colors disabled:opacity-30"><ChevronRight className="h-4 w-4 text-white" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — GROUPS
// ══════════════════════════════════════════════════════════════════════════════
function GroupsTab() {
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MemberGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    try { const res = await fetch('/api/admin/groups'); if (res.ok) setGroups(await res.json()); }
    catch {} finally { setLoading(false); }
  };
  const loadGroupDetail = async (groupId: string) => {
    try { const res = await fetch(`/api/admin/groups/${groupId}`); if (res.ok) setSelectedGroup(await res.json()); }
    catch {}
  };
  const showToast = (t: { type: 'success' | 'error'; message: string }) => { setToast(t); setTimeout(() => setToast(null), 5000); };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDescription.trim() || undefined }) });
      if (res.ok) { showToast({ type: 'success', message: 'Group created' }); setNewGroupName(''); setNewGroupDescription(''); setShowCreateForm(false); loadGroups(); }
      else { const d = await res.json(); showToast({ type: 'error', message: d.error || 'Failed to create' }); }
    } catch { showToast({ type: 'error', message: 'Network error' }); }
    finally { setCreating(false); }
  };
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingGroup) return;
    try {
      const res = await fetch(`/api/admin/groups/${editingGroup.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || undefined }) });
      if (res.ok) { showToast({ type: 'success', message: 'Group updated' }); setEditingGroup(null); loadGroups(); if (selectedGroup?.id === editingGroup.id) loadGroupDetail(editingGroup.id); }
      else { const d = await res.json(); showToast({ type: 'error', message: d.error || 'Update failed' }); }
    } catch { showToast({ type: 'error', message: 'Network error' }); }
  };
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group?')) return;
    const res = await fetch(`/api/admin/groups/${groupId}`, { method: 'DELETE' });
    if (res.ok) { showToast({ type: 'success', message: 'Group deleted' }); if (selectedGroup?.id === groupId) setSelectedGroup(null); loadGroups(); }
    else showToast({ type: 'error', message: 'Delete failed' });
  };
  const searchMembers = async (query: string) => {
    setMemberSearch(query); if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/messages/user-search?q=${encodeURIComponent(query)}`);
      if (res.ok) { const d = await res.json(); const existing = new Set(selectedGroup?.members.map((m) => m.userId) || []); setSearchResults((d.users || []).filter((u: UserSearchResult) => !existing.has(u.id))); }
    } catch {} finally { setSearching(false); }
  };
  const handleAddMember = async (userId: string) => {
    if (!selectedGroup) return;
    const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: [userId] }) });
    if (res.ok) { loadGroupDetail(selectedGroup.id); loadGroups(); setSearchResults(searchResults.filter((u) => u.id !== userId)); }
  };
  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    if (res.ok) { loadGroupDetail(selectedGroup.id); loadGroups(); }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">Member Groups</p>
          <p className="text-xs text-white/30 mt-0.5">Organise members into segments for targeted emails</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-900/30">
          <FolderPlus className="h-4 w-4" /> New Group
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Group list */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-white/30"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : groups.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 text-center text-white/30">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No groups yet</p>
            </div>
          ) : groups.map((g) => (
            <button key={g.id} onClick={() => loadGroupDetail(g.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedGroup?.id === g.id ? 'bg-indigo-500/10 border-indigo-400/30' : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.12]'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">{g.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/40">{g._count.members}</span>
              </div>
              {g.description && <p className="text-xs text-white/35 mt-1 line-clamp-1">{g.description}</p>}
            </button>
          ))}
        </div>

        {/* Group detail */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{selectedGroup.name}</h3>
                    {selectedGroup.description && <p className="text-sm text-white/40 mt-0.5">{selectedGroup.description}</p>}
                    <p className="text-[10px] text-white/25 mt-1.5">Created by {selectedGroup.createdBy.firstName} {selectedGroup.createdBy.lastName} · {fmtDate(selectedGroup.createdAt, false)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingGroup(selectedGroup); setEditName(selectedGroup.name); setEditDescription(selectedGroup.description || ''); }} className="p-1.5 hover:bg-white/[0.07] rounded-lg transition-colors"><Edit2 className="h-3.5 w-3.5 text-indigo-400" /></button>
                    <button onClick={() => handleDeleteGroup(selectedGroup.id)} className="p-1.5 hover:bg-white/[0.07] rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                </div>
                <button onClick={() => { setShowAddMembers(!showAddMembers); setMemberSearch(''); setSearchResults([]); }}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 rounded-lg text-xs font-semibold transition-colors">
                  <UserPlus className="h-3.5 w-3.5" /> Add Members
                </button>
                {showAddMembers && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/30" />
                      <input type="text" value={memberSearch} onChange={(e) => searchMembers(e.target.value)}
                        placeholder="Search by name or email…"
                        className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:border-indigo-500/60 focus:outline-none" />
                    </div>
                    {searching && <p className="text-xs text-white/30 pl-1">Searching…</p>}
                    {searchResults.length > 0 && (
                      <div className="max-h-44 overflow-y-auto space-y-1">
                        {searchResults.map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-2.5 bg-black/20 rounded-xl">
                            <div><span className="text-sm text-white">{u.firstName} {u.lastName}</span><span className="text-xs text-white/35 ml-2">{u.email}</span></div>
                            <button onClick={() => handleAddMember(u.id)} className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition-colors">Add</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold mb-3">Members ({selectedGroup.members.length})</p>
                {selectedGroup.members.length === 0 ? (
                  <p className="text-sm text-white/30">No members yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {selectedGroup.members.map((m) => (
                      <div key={m.userId} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
                            {m.user.firstName[0]}{m.user.lastName[0]}
                          </div>
                          <div>
                            <span className="text-sm text-white">{m.user.firstName} {m.user.lastName}</span>
                            <span className="text-xs text-white/35 ml-1.5">{m.user.email}</span>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveMember(m.userId)} className="p-1.5 hover:bg-white/[0.07] rounded-lg transition-colors" title="Remove"><UserMinus className="h-3.5 w-3.5 text-red-400" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl flex flex-col items-center justify-center py-16 text-white/25">
              <Users className="h-10 w-10 mb-2 opacity-30" /><p className="text-sm">Select a group to manage it</p>
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)} title="Create Group"
          actions={<>
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-white/[0.07] hover:bg-white/[0.12] text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button onClick={handleCreateGroup} disabled={creating || !newGroupName.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40">{creating ? 'Creating…' : 'Create'}</button>
          </>}
        >
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div><SectionLabel>Name *</SectionLabel><input type="text" required value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Board Members, Volunteers" className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:border-indigo-500/60 focus:outline-none" /></div>
            <div><SectionLabel>Description</SectionLabel><textarea value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} rows={3} placeholder="Optional…" className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:border-indigo-500/60 focus:outline-none resize-none" /></div>
          </form>
        </Modal>
      )}
      {editingGroup && (
        <Modal onClose={() => setEditingGroup(null)} title="Edit Group"
          actions={<>
            <button onClick={() => setEditingGroup(null)} className="px-4 py-2 bg-white/[0.07] hover:bg-white/[0.12] text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button onClick={handleUpdateGroup} disabled={!editName.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40">Save</button>
          </>}
        >
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div><SectionLabel>Name *</SectionLabel><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none" /></div>
            <div><SectionLabel>Description</SectionLabel><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none resize-none" /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 5 — AUTOMATIONS
// ══════════════════════════════════════════════════════════════════════════════
interface AutomationConfig { id: string; type: string; enabled: boolean; subject: string; bodyHtml: string; updatedAt: string; }

const AUTOMATION_META: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  WELCOME_REGISTRATION:      { label: 'Welcome Email',             description: 'Sent when a new member creates an account',              icon: <Mail className="h-4 w-4" /> },
  MEMBERSHIP_ACTIVATED:      { label: 'Membership Activated',      description: "Sent when a member's subscription is activated via PayPal", icon: <CheckCircle2 className="h-4 w-4" /> },
  EVENT_REGISTRATION:        { label: 'Event Registration',        description: 'Sent after a member pays for and confirms an event',      icon: <Users className="h-4 w-4" /> },
  OBS_REGISTRATION:          { label: 'OBS Registration',          description: 'Sent after OBS event payment is captured',               icon: <Sparkles className="h-4 w-4" /> },
  MEMBERSHIP_RENEWAL_REMINDER:{ label: 'Renewal Reminder',        description: 'Sent automatically 7 days before membership expires',    icon: <Clock className="h-4 w-4" /> },
};

function AutomationsTab() {
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, { subject: string; bodyHtml: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email-automation');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
        const init: Record<string, { subject: string; bodyHtml: string }> = {};
        for (const c of data as AutomationConfig[]) init[c.type] = { subject: c.subject, bodyHtml: c.bodyHtml };
        setEditState(init);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleToggle = async (config: AutomationConfig) => {
    const next = !config.enabled;
    setConfigs((prev) => prev.map((c) => c.type === config.type ? { ...c, enabled: next } : c));
    const res = await fetch('/api/admin/email-automation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: config.type, enabled: next }) });
    if (!res.ok) {
      setConfigs((prev) => prev.map((c) => c.type === config.type ? { ...c, enabled: config.enabled } : c));
      setToast({ type: 'error', message: 'Update failed' }); setTimeout(() => setToast(null), 5000);
    }
  };

  const handleSave = async (type: string) => {
    const edit = editState[type]; if (!edit) return;
    setSaving(type);
    try {
      const res = await fetch('/api/admin/email-automation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, subject: edit.subject, bodyHtml: edit.bodyHtml }) });
      if (res.ok) { const updated = await res.json(); setConfigs((prev) => prev.map((c) => c.type === type ? updated : c)); setToast({ type: 'success', message: 'Saved' }); }
      else throw new Error();
    } catch { setToast({ type: 'error', message: 'Save failed' }); }
    finally { setSaving(null); setTimeout(() => setToast(null), 5000); }
  };

  return (
    <div className="space-y-4">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">Email Automations</p>
        <p className="text-xs text-white/30 mt-0.5">Configure automated emails triggered by member actions. Toggle to enable or expand to edit.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12 text-white/30"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => {
            const meta = AUTOMATION_META[config.type] || { label: config.type, description: '', icon: <Zap className="h-4 w-4" /> };
            const isOpen = expandedId === config.type;
            const edit = editState[config.type] || { subject: config.subject, bodyHtml: config.bodyHtml };

            return (
              <div key={config.type} className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-indigo-400/20' : 'border-white/[0.07]'}`}>
                <div className="flex items-center gap-4 p-5">
                  {/* Toggle */}
                  <button onClick={() => handleToggle(config)} title={config.enabled ? 'Disable' : 'Enable'}>
                    {config.enabled ? <ToggleRight className="h-7 w-7 text-indigo-400" /> : <ToggleLeft className="h-7 w-7 text-white/25" />}
                  </button>

                  <div className={`p-2 rounded-lg ${config.enabled ? 'bg-indigo-500/15 text-indigo-400' : 'bg-white/[0.05] text-white/30'}`}>
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm">{meta.label}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.07] text-white/35'}`}>
                        {config.enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">{meta.description}</p>
                    {!isOpen && <p className="text-[11px] text-white/25 mt-1 truncate max-w-lg">Subject: {config.subject}</p>}
                  </div>

                  <button onClick={() => setExpandedId(isOpen ? null : config.type)} className="p-2 hover:bg-white/[0.07] rounded-xl transition-colors">
                    {isOpen ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-white/[0.06] p-5 space-y-4">
                    <div>
                      <SectionLabel>Subject</SectionLabel>
                      <input type="text" value={edit.subject} onChange={(e) => setEditState((prev) => ({ ...prev, [config.type]: { ...edit, subject: e.target.value } }))}
                        className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:border-indigo-500/60 focus:outline-none" />
                    </div>
                    <div>
                      <SectionLabel>Email Body</SectionLabel>
                      <RichTextEditor value={edit.bodyHtml} onChange={(html) => setEditState((prev) => ({ ...prev, [config.type]: { ...edit, bodyHtml: html } }))} placeholder="Edit the email body…" />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => handleSave(config.type)} disabled={saving === config.type}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 shadow-lg shadow-indigo-900/30">
                        {saving === config.type ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {saving === config.type ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 6 — DELIVERABILITY
// ══════════════════════════════════════════════════════════════════════════════
function DeliverabilityTab() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/ses-stats').then((r) => r.json()).then((d) => {
      if (d.error) setError(d.error); else setData(d);
    }).catch(() => setError('Failed to load SES stats')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16 text-white/30"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading SES stats…</div>;
  if (error) return (
    <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
      <p className="text-red-300 text-sm">{error}</p>
      <p className="text-white/30 text-xs mt-2">Ensure SES credentials have ses:GetSendStatistics and ses:GetSendQuota permissions.</p>
    </div>
  );

  if (!data) return null;

  type Totals = { sent: number; bounced: number; complaints: number; bounceRate: string; complaintRate: string };
  type Quota = { sentLast24Hours: number; max24HourSend: number; maxSendRate: number };
  type DayStat = { date: string; sent: number; bounced: number; complaints: number; bounceRate: number; complaintRate: number };

  const totals = data.totals as Totals | undefined;
  const quota = data.quota as Quota | undefined;
  const dailyStats = data.dailyStats as DayStat[] | undefined;

  const bounceRate = parseFloat(totals?.bounceRate || '0');
  const complaintRate = parseFloat(totals?.complaintRate || '0');
  const bounceColor = bounceRate > 5 ? 'text-red-400' : bounceRate > 2 ? 'text-amber-400' : 'text-emerald-400';
  const complaintColor = complaintRate > 0.1 ? 'text-red-400' : complaintRate > 0.05 ? 'text-amber-400' : 'text-emerald-400';
  const bounceStatus = bounceRate > 5 ? '🔴 Critical' : bounceRate > 2 ? '🟡 Warning' : '🟢 Healthy';
  const complaintStatus = complaintRate > 0.1 ? '🔴 Critical' : complaintRate > 0.05 ? '🟡 Warning' : '🟢 Healthy';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">SES Deliverability</p>
        <p className="text-xs text-white/30 mt-0.5">Amazon SES stats for the last 14 days. Keep bounce &lt; 5% and complaint &lt; 0.1% to avoid suspension.</p>
      </div>

      {quota && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold mb-4">24-Hour Quota</p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Sent (24h)', value: quota.sentLast24Hours?.toLocaleString() || '0' },
              { label: 'Daily Limit', value: quota.max24HourSend?.toLocaleString() || '—' },
              { label: 'Send Rate', value: `${quota.maxSendRate || '—'}/sec` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[10px] text-white/35 mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
          {quota.max24HourSend > 0 && (
            <div>
              <div className="flex justify-between text-[10px] text-white/30 mb-1">
                <span>Quota used</span>
                <span>{((quota.sentLast24Hours / quota.max24HourSend) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (quota.sentLast24Hours / quota.max24HourSend) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40 font-semibold">Bounce Rate</p>
            <span className="text-[10px] text-white/40">{bounceStatus}</span>
          </div>
          <p className={`text-4xl font-black ${bounceColor}`}>{bounceRate.toFixed(2)}%</p>
          <p className="text-xs text-white/30 mt-2">{totals?.bounced || 0} bounces / {totals?.sent || 0} sent</p>
          <p className="text-[10px] text-white/20 mt-3 leading-relaxed">AWS limit: &lt; 5% — exceeding risks account suspension</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40 font-semibold">Complaint Rate</p>
            <span className="text-[10px] text-white/40">{complaintStatus}</span>
          </div>
          <p className={`text-4xl font-black ${complaintColor}`}>{complaintRate.toFixed(3)}%</p>
          <p className="text-xs text-white/30 mt-2">{totals?.complaints || 0} complaints / {totals?.sent || 0} sent</p>
          <p className="text-[10px] text-white/20 mt-3 leading-relaxed">AWS limit: &lt; 0.1% — spam complaints from recipients</p>
        </div>
      </div>

      {dailyStats && dailyStats.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">Daily Breakdown — Last 14 Days</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Date', 'Sent', 'Bounced', 'Bounce %', 'Complaints', 'Complaint %'].map((h) => (
                    <th key={h} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 ${h === 'Date' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[...dailyStats].reverse().map((day) => (
                  <tr key={day.date} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-white/60 text-sm">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-3 text-right text-white/80 font-medium">{day.sent.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-white/50">{day.bounced}</td>
                    <td className={`px-5 py-3 text-right font-bold ${day.bounceRate > 5 ? 'text-red-400' : day.bounceRate > 2 ? 'text-amber-400' : 'text-white/40'}`}>{day.bounceRate.toFixed(2)}%</td>
                    <td className="px-5 py-3 text-right text-white/50">{day.complaints}</td>
                    <td className={`px-5 py-3 text-right font-bold ${day.complaintRate > 0.1 ? 'text-red-400' : day.complaintRate > 0.05 ? 'text-amber-400' : 'text-white/40'}`}>{day.complaintRate.toFixed(3)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED MODAL
// ══════════════════════════════════════════════════════════════════════════════
function Modal({ children, onClose, title, size = 'medium', actions }: {
  children: React.ReactNode; onClose: () => void; title: string; size?: 'medium' | 'large'; actions?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-[#0e1119] border border-white/[0.09] rounded-2xl shadow-2xl flex flex-col ${size === 'large' ? 'max-w-4xl w-full' : 'max-w-xl w-full'} max-h-[92vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.07] rounded-lg transition-colors"><X className="h-4 w-4 text-white/50" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/[0.07]">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
