'use client';

/**
 * Communications Panel — Admin Dashboard
 * Redesigned with dark terminal aesthetic (TYDE/Nexus-inspired)
 */

import { useState, useEffect } from 'react';
import {
  Mail, Send, Eye, Plus, Edit2, Trash2, Users, FileText, Clock,
  CheckCircle2, XCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  X, FolderPlus, UserPlus, UserMinus, Search, AtSign, Zap, ChevronDown,
  ChevronUp, ToggleLeft, ToggleRight, ImagePlus, BarChart2, ChevronRight as Arrow,
  Sparkles, Filter,
} from 'lucide-react';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { SocialCrossPostPanel } from '@/components/admin/social-cross-post-panel';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function Toast({ toast, onClose }: { toast: { type: 'success' | 'error'; message: string }; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border ${
      toast.type === 'success'
        ? 'bg-green-500/10 border-green-500/30 text-green-300'
        : 'bg-red-500/10 border-red-500/30 text-red-300'
    }`}>
      {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
      <span className="text-sm">{toast.message}</span>
      <button onClick={onClose} className="ml-1 hover:opacity-70 transition-opacity"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function FilterPill({ label, active, onClick, disabled }: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
        active
          ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
          : 'bg-slate-800 border-white/10 text-slate-400 hover:border-indigo-500/40 hover:text-slate-200'
      } disabled:opacity-40 disabled:cursor-not-allowed`}>
      {label}
    </button>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export function CommunicationsPanel() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'groups' | 'automations' | 'deliverability'>('compose');

  const tabs = [
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'history', label: 'Sent History', icon: Clock },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'deliverability', label: 'Deliverability', icon: BarChart2 },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
          <Mail className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
            Communications
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Email campaigns, templates, and automation</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-white/5 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}>
            <Icon className="h-4 w-4" />
            {label}
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

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — COMPOSE
// ═══════════════════════════════════════════════════════════════════════════════
function ComposeTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({});
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [insertingImage, setInsertingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('role');

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

  const recipientSummary = () => {
    const parts: string[] = [];
    if (recipientFilter.all) return ['All Members'];
    if (recipientFilter.roles?.length) parts.push(...recipientFilter.roles);
    if (recipientFilter.membershipTypes?.length) parts.push(...recipientFilter.membershipTypes);
    if (recipientFilter.membershipStatuses?.length) parts.push(...recipientFilter.membershipStatuses);
    if (recipientFilter.groupIds?.length) {
      recipientFilter.groupIds.forEach(gid => {
        const g = groups.find(g => g.id === gid);
        if (g) parts.push(g.name);
      });
    }
    if (manualEmails.length) parts.push(`${manualEmails.length} manual`);
    return parts;
  };

  const hasRecipients = recipientFilter.all ||
    (recipientFilter.roles?.length || 0) > 0 ||
    (recipientFilter.membershipTypes?.length || 0) > 0 ||
    (recipientFilter.membershipStatuses?.length || 0) > 0 ||
    (recipientFilter.groupIds?.length || 0) > 0 ||
    manualEmails.length > 0;

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id);
    const t = templates.find(t => t.id === id);
    if (t) { setSubject(t.subject || ''); setBodyHtml(t.bodyHtml || ''); }
  };

  const handleSend = async () => {
    setShowConfirm(false); setLoading(true);
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, html: bodyHtml,
          templateId: selectedTemplate || undefined,
          recipientFilter: hasRecipients ? recipientFilter : undefined,
          manualEmails: manualEmails.length > 0 ? manualEmails : undefined,
        }),
      });
      if (res.ok) {
        const r = await res.json();
        setToast({ type: 'success', message: `Sent to ${r.totalRecipients} recipients!` });
        setSubject(''); setBodyHtml(''); setSelectedTemplate('');
        setRecipientFilter({}); setManualEmails([]); setManualInput('');
      } else {
        const e = await res.json();
        setToast({ type: 'error', message: e.error || 'Send failed' });
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
      setBodyHtml(prev => prev + `<img src="${url}" alt="Inserted image" style="max-width:100%;height:auto;" />`);
    } catch { setToast({ type: 'error', message: 'Image upload failed' }); setTimeout(() => setToast(null), 4000); }
    finally { setInsertingImage(false); }
  };

  const toggle = (key: 'roles' | 'membershipTypes' | 'membershipStatuses', val: string) => {
    const arr = (recipientFilter[key] as string[] | undefined) || [];
    const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
    setRecipientFilter({ ...recipientFilter, [key]: next, all: false });
  };
  const toggleGroup = (gid: string) => {
    const arr = recipientFilter.groupIds || [];
    setRecipientFilter({ ...recipientFilter, groupIds: arr.includes(gid) ? arr.filter(g => g !== gid) : [...arr, gid], all: false });
  };
  const toggleAll = () => setRecipientFilter(recipientFilter.all ? {} : { all: true, roles: [], membershipTypes: [], membershipStatuses: [], groupIds: [] });
  const addEmail = () => {
    const e = manualInput.trim().toLowerCase();
    if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !manualEmails.includes(e)) {
      setManualEmails([...manualEmails, e]); setManualInput('');
    }
  };

  const summary = recipientSummary();

  return (
    <div className="grid grid-cols-5 gap-6 items-start">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* ── Left: Recipient Targeting ───────────────────────────────────── */}
      <div className="col-span-2 space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Target Audience</span>
        </div>

        {/* All Members */}
        <div className={`rounded-xl border p-4 cursor-pointer transition-all ${
          recipientFilter.all
            ? 'bg-indigo-500/10 border-indigo-500/40'
            : 'bg-slate-800/50 border-white/8 hover:border-white/20'
        }`} onClick={toggleAll}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                recipientFilter.all ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'
              }`}>
                {recipientFilter.all && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <span className="font-medium text-white text-sm">All Members</span>
            </div>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
        </div>

        {/* Accordion sections */}
        {[
          { key: 'role', label: 'By Role', items: ['ADMIN','MODERATOR','MEMBER'] as Role[], field: 'roles' as const },
          { key: 'type', label: 'By Membership Type', items: ['INDIVIDUAL','FAMILY','STUDENT','PATRON','BENEFACTOR','LIFETIME'] as MembershipType[], field: 'membershipTypes' as const },
          { key: 'status', label: 'By Status', items: ['ACTIVE','EXPIRED'] as MembershipStatus[], field: 'membershipStatuses' as const },
        ].map(({ key, label, items, field }) => (
          <div key={key} className="bg-slate-800/50 border border-white/8 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              onClick={() => setExpandedSection(expandedSection === key ? null : key)}
              disabled={recipientFilter.all}
            >
              {label}
              {expandedSection === key ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {expandedSection === key && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                {(items as string[]).map(item => (
                  <FilterPill key={item} label={item}
                    active={!!((recipientFilter[field] as string[] | undefined)?.includes(item))}
                    onClick={() => toggle(field, item)}
                    disabled={recipientFilter.all}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Groups */}
        {groups.length > 0 && (
          <div className="bg-slate-800/50 border border-white/8 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              onClick={() => setExpandedSection(expandedSection === 'groups' ? null : 'groups')}
              disabled={recipientFilter.all}
            >
              By Group
              {expandedSection === 'groups' ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {expandedSection === 'groups' && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                {groups.map(g => (
                  <FilterPill key={g.id} label={`${g.name} (${g._count.members})`}
                    active={!!recipientFilter.groupIds?.includes(g.id)}
                    onClick={() => toggleGroup(g.id)}
                    disabled={recipientFilter.all}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual emails */}
        <div className="bg-slate-800/50 border border-white/8 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            onClick={() => setExpandedSection(expandedSection === 'manual' ? null : 'manual')}
          >
            <span className="flex items-center gap-2"><AtSign className="h-4 w-4" />Manual Addresses {manualEmails.length > 0 && <span className="px-1.5 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full">{manualEmails.length}</span>}</span>
            {expandedSection === 'manual' ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {expandedSection === 'manual' && (
            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
              <div className="flex gap-2">
                <input type="email" value={manualInput} onChange={e => setManualInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-1.5 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:border-indigo-500/60 focus:outline-none" />
                <button onClick={addEmail} className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm transition-colors">Add</button>
              </div>
              {manualEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {manualEmails.map(e => (
                    <span key={e} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs">
                      {e}
                      <button onClick={() => setManualEmails(manualEmails.filter(m => m !== e))} className="hover:text-white transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recipient summary pill */}
        {hasRecipients && (
          <div className="flex flex-wrap gap-2 px-1">
            {summary.map(s => (
              <span key={s} className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 rounded-full text-xs font-medium">{s}</span>
            ))}
          </div>
        )}
        {!hasRecipients && (
          <p className="text-xs text-slate-500 px-1">No recipients selected. Choose filters above.</p>
        )}
      </div>

      {/* ── Right: Compose Area ─────────────────────────────────────────── */}
      <div className="col-span-3 space-y-0">
        {/* Compose Card */}
        <div className="bg-slate-800/40 border border-white/10 rounded-xl overflow-hidden shadow-xl">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-white/8 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">New Email</span>
            </div>
            {/* Template picker */}
            <select value={selectedTemplate} onChange={e => handleTemplateSelect(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-slate-300 focus:border-indigo-500/60 focus:outline-none cursor-pointer hover:border-white/20 transition-colors">
              <option value="">Start from template…</option>
              {templates.filter(t => t.isActive).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* From / To / Subject fields */}
          <div className="divide-y divide-white/5">
            {/* From */}
            <div className="flex items-center gap-4 px-5 py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 shrink-0">From</span>
              <span className="text-sm text-slate-300">SPAC &lt;onboarding@resend.dev&gt;</span>
              <span className="ml-auto text-xs text-amber-400/70 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded-full">Verify domain to use @stpeteastronomyclub.org</span>
            </div>

            {/* To */}
            <div className="flex items-start gap-4 px-5 py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 shrink-0 mt-1">To</span>
              <div className="flex-1 flex flex-wrap gap-1.5 min-h-[1.75rem]">
                {!hasRecipients && <span className="text-sm text-slate-500 italic">Select recipients on the left…</span>}
                {summary.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-md text-xs">{s}</span>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-4 px-5 py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 shrink-0">Subject</span>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Email subject line…"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none" />
            </div>
          </div>

          {/* Body editor */}
          <div className="border-t border-white/8">
            {/* Toolbar row */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/20 border-b border-white/5">
              <span className="text-xs text-slate-500">Rich Text Editor</span>
              <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors">
                <input type="file" accept="image/*" className="sr-only"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleInsertImage(f); e.target.value = ''; }}
                  disabled={insertingImage} />
                {insertingImage ? <><Loader2 className="h-3 w-3 animate-spin" />Uploading…</> : <><ImagePlus className="h-3 w-3" />Insert Image</>}
              </label>
            </div>
            <div className="p-4">
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} placeholder="Compose your email…" />
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/8 bg-slate-900/30">
            <div className="flex items-center gap-2">
              {hasRecipients ? (
                <span className="text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Recipients selected
                </span>
              ) : (
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> No recipients
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPreview(true)} disabled={!subject || !bodyHtml}
                className="px-4 py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border border-white/8 hover:border-white/20">
                <Eye className="h-4 w-4" /> Preview
              </button>
              <button onClick={() => setShowConfirm(true)}
                disabled={!subject || !bodyHtml || !hasRecipients || loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {loading ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>

        {/* Social Cross-Post */}
        <div className="mt-4">
          <SocialCrossPostPanel
            subject={subject}
            bodyText={(bodyHtml || '').replace(/<[^>]+>/g, '').slice(0, 2000)}
          />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Modal onClose={() => setShowPreview(false)} title="Email Preview" size="large">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Subject</span>
              <span className="text-white text-sm">{subject}</span>
            </div>
            <div className="bg-white text-black p-6 rounded-xl shadow-inner" dangerouslySetInnerHTML={{ __html: bodyHtml || '' }} />
          </div>
        </Modal>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)} title="Confirm Send"
          actions={
            <>
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleSend} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20">
                Confirm &amp; Send
              </button>
            </>
          }>
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">You&apos;re about to send this email. This cannot be undone.</p>
            <div className="bg-slate-900/50 border border-white/8 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex gap-3"><span className="text-slate-400 w-20 shrink-0">Subject</span><span className="text-white">{subject}</span></div>
              {recipientFilter.all && <div className="flex gap-3"><span className="text-slate-400 w-20 shrink-0">To</span><span className="text-white">All members</span></div>}
              {summary.length > 0 && !recipientFilter.all && (
                <div className="flex gap-3"><span className="text-slate-400 w-20 shrink-0">Filters</span><span className="text-white">{summary.join(', ')}</span></div>
              )}
              {manualEmails.length > 0 && <div className="flex gap-3"><span className="text-slate-400 w-20 shrink-0">Manual</span><span className="text-white">{manualEmails.join(', ')}</span></div>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════
function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/communications/templates');
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); }
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const res = await fetch(`/api/admin/communications/templates/${id}`, { method: 'DELETE' });
    setToast(res.ok ? { type: 'success', message: 'Template deleted' } : { type: 'error', message: 'Delete failed' });
    setTimeout(() => setToast(null), 4000);
    if (res.ok) load();
  };

  const CATEGORY_COLORS: Record<string, string> = {
    GENERAL: 'text-slate-300 bg-slate-700/60',
    WELCOME: 'text-green-300 bg-green-500/15',
    MEMBERSHIP: 'text-blue-300 bg-blue-500/15',
    EVENT: 'text-violet-300 bg-violet-500/15',
    NEWSLETTER: 'text-indigo-300 bg-indigo-500/15',
    ADMIN: 'text-orange-300 bg-orange-500/15',
    SYSTEM: 'text-red-300 bg-red-500/15',
  };

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-white">Email Templates</h2>
          <p className="text-xs text-slate-500 mt-0.5">{templates.length} templates · {templates.filter(t => t.isActive).length} active</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      <div className="bg-slate-800/40 border border-white/8 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin mx-auto mb-2" /><p className="text-sm">Loading…</p></div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No templates yet. Create one to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-white/8">
              <tr>
                {['Name', 'Category', 'Subject', 'Updated', 'Uses', 'Active', ''].map(h => (
                  <th key={h} className={`px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-slate-900/30 transition-colors group">
                  <td className="px-5 py-3.5 text-white font-medium">{t.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${CATEGORY_COLORS[t.category || 'GENERAL']}`}>{t.category || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">{t.subject}</td>
                  <td className="px-5 py-3.5 text-slate-500">{new Date(t.updatedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-slate-400">{t.usageCount || 0}</td>
                  <td className="px-5 py-3.5">
                    {t.isActive
                      ? <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
                      : <span className="w-2 h-2 bg-slate-600 rounded-full inline-block" />}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(t); setShowForm(true); }} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><Edit2 className="h-3.5 w-3.5 text-indigo-400" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <TemplateFormModal template={editing} onClose={() => { setShowForm(false); setEditing(null); load(); }}
          onSuccess={msg => { setToast({ type: 'success', message: msg }); setTimeout(() => setToast(null), 4000); }} />
      )}
    </div>
  );
}

function TemplateFormModal({ template, onClose, onSuccess }: { template: Template | null; onClose: () => void; onSuccess: (msg: string) => void }) {
  const [form, setForm] = useState({
    name: template?.name || '', subject: template?.subject || '',
    bodyHtml: template?.bodyHtml || '', description: template?.description || '',
    category: template?.category || 'GENERAL' as Category,
    variables: template?.variables?.join(', ') || '',
    isActive: template?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const url = template ? `/api/admin/communications/templates/${template.id}` : '/api/admin/communications/templates';
      const res = await fetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          variables: form.variables ? form.variables.split(',').map(v => v.trim()).filter(Boolean) : undefined,
          description: form.description || undefined,
          category: form.category as Category,
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
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Template'}
          </button>
        </>
      }>
      <form onSubmit={save} className="space-y-4">
        {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
            <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Category })}
              className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none">
              {['GENERAL','WELCOME','MEMBERSHIP','EVENT','NEWSLETTER','ADMIN','SYSTEM'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject *</label>
          <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Body *</label>
          <RichTextEditor value={form.bodyHtml} onChange={html => setForm({ ...form, bodyHtml: html })} placeholder="Email body…" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Optional internal note…"
              className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none placeholder-slate-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Variables</label>
            <input value={form.variables} onChange={e => setForm({ ...form, variables: e.target.value })}
              placeholder="firstName, lastName, email…"
              className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none placeholder-slate-600" />
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-white/20 bg-slate-900/60 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-sm text-slate-300">Active</span>
        </label>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — HISTORY
// ═══════════════════════════════════════════════════════════════════════════════
function HistoryTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EmailStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => { load(); }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/admin/communications?${params}`);
      if (res.ok) { const d = await res.json(); setLogs(d.logs || []); setTotalPages(Math.ceil((d.total || 0) / limit)); }
    } finally { setLoading(false); }
  };

  const StatusBadge = ({ status }: { status: EmailStatus }) => {
    const cfg = {
      SENT: { cls: 'text-green-300 bg-green-500/10 border-green-500/20', icon: CheckCircle2 },
      SENDING: { cls: 'text-blue-300 bg-blue-500/10 border-blue-500/20', icon: Loader2 },
      FAILED: { cls: 'text-red-300 bg-red-500/10 border-red-500/20', icon: XCircle },
    }[status];
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
        <Icon className={`h-3 w-3 ${status === 'SENDING' ? 'animate-spin' : ''}`} />{status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Sent History</h2>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as EmailStatus | ''); setPage(1); }}
          className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-slate-300 focus:border-indigo-500/60 focus:outline-none">
          <option value="">All Status</option>
          <option value="SENT">Sent</option>
          <option value="SENDING">Sending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="bg-slate-800/40 border border-white/8 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin mx-auto mb-2" /><p className="text-sm">Loading…</p></div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500"><Mail className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No emails found</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-white/8">
              <tr>
                {['Recipient', 'Subject', 'Template', 'Status', 'Sent At'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-5 py-3.5 text-slate-200">{log.recipient}</td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">{log.subject}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{log.templateName || 'Custom'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{new Date(log.sentAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 bg-slate-700/60 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40">
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 bg-slate-700/60 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-40">
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — GROUPS
// ═══════════════════════════════════════════════════════════════════════════════
function GroupsTab() {
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<GroupDetail | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newName, setNewName] = useState(''); const [newDesc, setNewDesc] = useState(''); const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MemberGroup | null>(null); const [editName, setEditName] = useState(''); const [editDesc, setEditDesc] = useState('');
  const [memberSearch, setMemberSearch] = useState(''); const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]); const [searching, setSearching] = useState(false);

  useEffect(() => { loadGroups(); }, []);
  const loadGroups = async () => { setLoading(true); try { const r = await fetch('/api/admin/groups'); if (r.ok) setGroups(await r.json()); } finally { setLoading(false); } };
  const loadDetail = async (id: string) => { const r = await fetch(`/api/admin/groups/${id}`); if (r.ok) setSelected(await r.json()); };
  const toast5 = (t: { type: 'success' | 'error'; message: string }) => { setToast(t); setTimeout(() => setToast(null), 5000); };

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newName.trim()) return; setCreating(true);
    const r = await fetch('/api/admin/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }) });
    toast5(r.ok ? { type: 'success', message: 'Group created' } : { type: 'error', message: 'Failed' });
    if (r.ok) { setNewName(''); setNewDesc(''); setShowCreate(false); loadGroups(); }
    setCreating(false);
  };
  const update = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingGroup) return;
    const r = await fetch(`/api/admin/groups/${editingGroup.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || undefined }) });
    toast5(r.ok ? { type: 'success', message: 'Group updated' } : { type: 'error', message: 'Failed' });
    if (r.ok) { setEditingGroup(null); loadGroups(); if (selected?.id === editingGroup.id) loadDetail(editingGroup.id); }
  };
  const del = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    const r = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
    toast5(r.ok ? { type: 'success', message: 'Group deleted' } : { type: 'error', message: 'Failed' });
    if (r.ok) { if (selected?.id === id) setSelected(null); loadGroups(); }
  };
  const search = async (q: string) => {
    setMemberSearch(q); if (q.length < 2) { setSearchResults([]); return; } setSearching(true);
    const r = await fetch(`/api/messages/user-search?q=${encodeURIComponent(q)}`);
    if (r.ok) { const d = await r.json(); const ids = new Set(selected?.members.map(m => m.userId) || []); setSearchResults((d.users || []).filter((u: UserSearchResult) => !ids.has(u.id))); }
    setSearching(false);
  };
  const addMember = async (uid: string) => {
    if (!selected) return;
    const r = await fetch(`/api/admin/groups/${selected.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: [uid] }) });
    if (r.ok) { loadDetail(selected.id); loadGroups(); setSearchResults(searchResults.filter(u => u.id !== uid)); }
  };
  const removeMember = async (uid: string) => {
    if (!selected) return;
    const r = await fetch(`/api/admin/groups/${selected.id}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid }) });
    if (r.ok) { loadDetail(selected.id); loadGroups(); }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Member Groups</h2>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          <FolderPlus className="h-4 w-4" /> New Group
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-2">
          {loading ? <div className="p-8 text-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
            : groups.length === 0 ? <div className="bg-slate-800/40 border border-white/8 rounded-xl p-8 text-center text-slate-500 text-sm">No groups yet</div>
            : groups.map(g => (
              <button key={g.id} onClick={() => loadDetail(g.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === g.id ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800/40 border-white/8 hover:border-indigo-500/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{g.name}</span>
                  <span className="text-xs text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-full">{g._count.members}</span>
                </div>
                {g.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{g.description}</p>}
              </button>
            ))}
        </div>

        <div className="col-span-2">
          {selected ? (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/8">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{selected.name}</h3>
                    {selected.description && <p className="text-sm text-slate-400 mt-0.5">{selected.description}</p>}
                    <p className="text-xs text-slate-500 mt-2">Created by {selected.createdBy.firstName} {selected.createdBy.lastName} · {new Date(selected.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingGroup(selected); setEditName(selected.name); setEditDesc(selected.description || ''); }} className="p-2 hover:bg-slate-700 rounded-lg transition-colors"><Edit2 className="h-3.5 w-3.5 text-indigo-400" /></button>
                    <button onClick={() => del(selected.id)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                </div>
                <button onClick={() => { setShowAddMembers(!showAddMembers); setMemberSearch(''); setSearchResults([]); }}
                  className="mt-3 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Add Members
                </button>
                {showAddMembers && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input value={memberSearch} onChange={e => search(e.target.value)} placeholder="Search by name or email…"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:border-indigo-500/60 focus:outline-none" />
                    </div>
                    {searching && <p className="text-xs text-slate-400">Searching…</p>}
                    {searchResults.length > 0 && (
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {searchResults.map(u => (
                          <div key={u.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                            <div><span className="text-sm text-white">{u.firstName} {u.lastName}</span><span className="text-xs text-slate-400 ml-2">{u.email}</span></div>
                            <button onClick={() => addMember(u.id)} className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded text-xs transition-colors">Add</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Members ({selected.members.length})</p>
                {selected.members.length === 0
                  ? <p className="text-sm text-slate-500">No members yet.</p>
                  : <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {selected.members.map(m => (
                      <div key={m.userId} className="flex items-center justify-between p-2.5 bg-slate-900/30 rounded-lg">
                        <div>
                          <span className="text-sm text-white">{m.user.firstName} {m.user.lastName}</span>
                          <span className="text-xs text-slate-400 ml-2">{m.user.email}</span>
                          <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-2">{m.user.role}</span>
                        </div>
                        <button onClick={() => removeMember(m.userId)} className="p-1.5 hover:bg-slate-700 rounded transition-colors"><UserMinus className="h-3.5 w-3.5 text-red-400" /></button>
                      </div>
                    ))}
                  </div>}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl p-12 text-center text-slate-500">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a group to manage members</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="New Group"
          actions={<>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">Cancel</button>
            <button onClick={create} disabled={creating || !newName.trim()} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">{creating ? 'Creating…' : 'Create'}</button>
          </>}>
          <form onSubmit={create} className="space-y-4">
            <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name *</label><input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Board Members" className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none placeholder-slate-600" /></div>
            <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label><textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} placeholder="Optional…" className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none placeholder-slate-600" /></div>
          </form>
        </Modal>
      )}
      {editingGroup && (
        <Modal onClose={() => setEditingGroup(null)} title="Edit Group"
          actions={<>
            <button onClick={() => setEditingGroup(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">Cancel</button>
            <button onClick={update} disabled={!editName.trim()} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">Save</button>
          </>}>
          <form onSubmit={update} className="space-y-4">
            <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name *</label><input required value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none" /></div>
            <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label><textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none" /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — AUTOMATIONS
// ═══════════════════════════════════════════════════════════════════════════════
interface AutomationConfig { id: string; type: string; enabled: boolean; subject: string; bodyHtml: string; updatedAt: string; }
const AUTOMATION_META: Record<string, { label: string; description: string; icon: string }> = {
  WELCOME_REGISTRATION:      { label: 'Welcome Email',                  description: 'Triggered on new member registration',            icon: '👋' },
  MEMBERSHIP_ACTIVATED:      { label: 'Membership Activated',           description: 'Triggered when PayPal subscription activates',     icon: '✅' },
  EVENT_REGISTRATION:        { label: 'Event Registration Confirmation', description: 'Triggered after event payment confirmation',       icon: '📅' },
  OBS_REGISTRATION:          { label: 'OBS Registration Confirmation',  description: 'Triggered after OBS event payment captured',       icon: '🔭' },
  MEMBERSHIP_RENEWAL_REMINDER:{ label: 'Renewal Reminder',              description: 'Sent automatically 7 days before expiry',          icon: '⏰' },
};

function AutomationsTab() {
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, { subject: string; bodyHtml: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/email-automation');
      if (r.ok) { const d = await r.json(); setConfigs(d); const init: Record<string, { subject: string; bodyHtml: string }> = {}; for (const c of d as AutomationConfig[]) init[c.type] = { subject: c.subject, bodyHtml: c.bodyHtml }; setEditState(init); }
    } finally { setLoading(false); }
  };
  const toggle = async (c: AutomationConfig) => {
    const next = !c.enabled;
    setConfigs(prev => prev.map(x => x.type === c.type ? { ...x, enabled: next } : x));
    const r = await fetch('/api/admin/email-automation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: c.type, enabled: next }) });
    if (!r.ok) { setConfigs(prev => prev.map(x => x.type === c.type ? { ...x, enabled: c.enabled } : x)); setToast({ type: 'error', message: 'Update failed' }); setTimeout(() => setToast(null), 4000); }
  };
  const save = async (type: string) => {
    const edit = editState[type]; if (!edit) return; setSaving(type);
    try {
      const r = await fetch('/api/admin/email-automation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, ...edit }) });
      if (r.ok) { setConfigs(prev => prev.map(c => c.type === type ? { ...c, ...edit } : c)); setToast({ type: 'success', message: 'Saved' }); }
      else throw new Error();
    } catch { setToast({ type: 'error', message: 'Save failed' }); }
    finally { setSaving(null); setTimeout(() => setToast(null), 4000); }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <div>
        <h2 className="text-lg font-semibold text-white">Email Automations</h2>
        <p className="text-sm text-slate-500 mt-0.5">Automated emails triggered by membership events. Toggle or expand to edit.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin mx-auto mb-2" /></div>
      ) : (
        <div className="space-y-3">
          {configs.map(c => {
            const meta = AUTOMATION_META[c.type] || { label: c.type, description: '', icon: '📧' };
            const isOpen = expandedId === c.type;
            const edit = editState[c.type] || { subject: c.subject, bodyHtml: c.bodyHtml };
            return (
              <div key={c.type} className={`bg-slate-800/40 border rounded-xl overflow-hidden transition-colors ${isOpen ? 'border-indigo-500/30' : 'border-white/8'}`}>
                <div className="flex items-center gap-4 p-5">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-white text-sm">{meta.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.enabled ? 'bg-green-500/15 text-green-300 border border-green-500/20' : 'bg-slate-700/60 text-slate-400 border border-white/5'}`}>
                        {c.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                    {!isOpen && <p className="text-xs text-slate-600 mt-1 truncate max-w-lg">Subject: {c.subject}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(c)} title={c.enabled ? 'Disable' : 'Enable'}>
                      {c.enabled ? <ToggleRight className="h-6 w-6 text-indigo-400" /> : <ToggleLeft className="h-6 w-6 text-slate-500" />}
                    </button>
                    <button onClick={() => setExpandedId(isOpen ? null : c.type)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                      {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-white/8 p-5 space-y-4 bg-slate-900/20">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                      <input value={edit.subject} onChange={e => setEditState(prev => ({ ...prev, [c.type]: { ...edit, subject: e.target.value } }))}
                        className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/60 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Body</label>
                      <RichTextEditor value={edit.bodyHtml} onChange={html => setEditState(prev => ({ ...prev, [c.type]: { ...edit, bodyHtml: html } }))} placeholder="Edit email body…" />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => save(c.type)} disabled={saving === c.type}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                        {saving === c.type && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {saving === c.type ? 'Saving…' : 'Save Changes'}
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

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — DELIVERABILITY
// ═══════════════════════════════════════════════════════════════════════════════
function DeliverabilityTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/ses-stats')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load SES stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="h-7 w-7 animate-spin mr-3" />Loading…</div>;
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
      <p className="text-red-300 text-sm">{error}</p>
      <p className="text-slate-500 text-xs mt-2">Ensure SES credentials have ses:GetSendStatistics and ses:GetSendQuota permissions.</p>
    </div>
  );

  const bounceRate = parseFloat(data?.totals?.bounceRate || '0');
  const complaintRate = parseFloat(data?.totals?.complaintRate || '0');
  const B = (r: number) => r > 5 ? 'text-red-400' : r > 2 ? 'text-yellow-400' : 'text-green-400';
  const C = (r: number) => r > 0.1 ? 'text-red-400' : r > 0.05 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">SES Deliverability</h2>
        <p className="text-sm text-slate-500 mt-0.5">Amazon SES metrics for the last 14 days. Keep bounce &lt;5% and complaints &lt;0.1%.</p>
      </div>

      {data?.quota && (
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Sending Quota (24h)</p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Sent (last 24h)', value: data.quota.sentLast24Hours?.toLocaleString() || '0' },
              { label: 'Daily Limit', value: data.quota.max24HourSend?.toLocaleString() || '—' },
              { label: 'Send Rate', value: `${data.quota.maxSendRate || '—'}/s` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          {data.quota.max24HourSend && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Quota used</span><span>{((data.quota.sentLast24Hours / data.quota.max24HourSend) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (data.quota.sentLast24Hours / data.quota.max24HourSend) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Bounce Rate', rate: bounceRate, color: B(bounceRate), limit: '< 5%', count: data?.totals?.bounced || 0, total: data?.totals?.sent || 0, format: (n: number) => `${n.toFixed(2)}%` },
          { label: 'Complaint Rate', rate: complaintRate, color: C(complaintRate), limit: '< 0.1%', count: data?.totals?.complaints || 0, total: data?.totals?.sent || 0, format: (n: number) => `${n.toFixed(3)}%` },
        ].map(({ label, rate, color, limit, count, total, format }) => (
          <div key={label} className="bg-slate-800/40 border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${rate > 5 || (label.includes('Complaint') && rate > 0.1) ? 'bg-red-500/10 border-red-500/20 text-red-300' : rate > 2 || (label.includes('Complaint') && rate > 0.05) ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-green-500/10 border-green-500/20 text-green-300'}`}>
                {rate > 5 || (label.includes('Complaint') && rate > 0.1) ? 'Critical' : rate > 2 || (label.includes('Complaint') && rate > 0.05) ? 'Warning' : 'Healthy'}
              </span>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{format(rate)}</p>
            <p className="text-xs text-slate-500 mt-1">{count} of {total} emails</p>
            <p className="text-xs text-slate-600 mt-2">AWS limit: {limit}</p>
          </div>
        ))}
      </div>

      {data?.dailyStats?.length > 0 && (
        <div className="bg-slate-800/40 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/40">
                <tr>{['Date','Sent','Bounced','Bounce %','Complaints','Complaint %'].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left last:text-right">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.dailyStats.slice().reverse().map((day: any) => (
                  <tr key={day.date} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-3 text-slate-300">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-3 text-slate-200">{day.sent.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-400">{day.bounced}</td>
                    <td className={`px-5 py-3 font-medium ${B(day.bounceRate)}`}>{day.bounceRate.toFixed(2)}%</td>
                    <td className="px-5 py-3 text-slate-400">{day.complaints}</td>
                    <td className={`px-5 py-3 font-medium text-right ${C(day.complaintRate)}`}>{day.complaintRate.toFixed(3)}%</td>
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

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function Modal({ children, onClose, title, size = 'medium', actions }: {
  children: React.ReactNode; onClose: () => void; title: string;
  size?: 'medium' | 'large'; actions?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-slate-800 border border-white/10 rounded-2xl shadow-2xl flex flex-col ${size === 'large' ? 'max-w-4xl w-full' : 'max-w-xl w-full'} max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {actions && <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">{actions}</div>}
      </div>
    </div>
  );
}
