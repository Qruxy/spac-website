'use client';

/**
 * Communications Panel - Admin Dashboard
 *
 * Provides email and notification management for admins:
 * - Tab 1: Compose and send bulk emails with recipient filtering
 * - Tab 2: Manage email templates (CRUD operations)
 * - Tab 3: View sent email history with status tracking
 * - Tab 4: Create and manage member groups
 */

import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FolderPlus,
  UserPlus,
  UserMinus,
  Search,
  AtSign,
  ArrowLeft,
} from 'lucide-react';

// Types
type Category = 'GENERAL' | 'WELCOME' | 'MEMBERSHIP' | 'EVENT' | 'NEWSLETTER' | 'ADMIN' | 'SYSTEM';
type MembershipType = 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'LIFETIME';
type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
type Role = 'ADMIN' | 'MODERATOR' | 'MEMBER';
type EmailStatus = 'SENDING' | 'SENT' | 'FAILED';

interface Template {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  description?: string;
  category?: Category;
  variables?: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface EmailLog {
  id: string;
  recipient: string;
  recipientId: string;
  subject: string;
  status: EmailStatus;
  sentAt: string;
  templateId?: string;
  templateName?: string;
  error?: string;
}

interface RecipientFilter {
  all?: boolean;
  roles?: Role[];
  membershipTypes?: MembershipType[];
  membershipStatuses?: MembershipStatus[];
  groupIds?: string[];
}

interface MemberGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  _count: { members: number };
}

interface GroupDetail extends MemberGroup {
  members: {
    userId: string;
    user: { id: string; firstName: string; lastName: string; email: string; role: string };
  }[];
}

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function CommunicationsPanel() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'groups'>('compose');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600/20 rounded-lg">
          <Mail className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white/90">Communications</h1>
          <p className="text-sm text-white/50">Send emails and manage communication templates</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'compose'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              <span className="font-medium">Compose Email</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">Email Templates</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Sent History</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'groups'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Groups</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'compose' && <ComposeTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'groups' && <GroupsTab />}
    </div>
  );
}

// ========== TAB 1: COMPOSE EMAIL ==========
function ComposeTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({});
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadTemplates();
    loadGroups();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/communications/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups');
      if (res.ok) {
        setGroups(await res.json());
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const hasRecipients = recipientFilter.all ||
    (recipientFilter.roles?.length || 0) > 0 ||
    (recipientFilter.membershipTypes?.length || 0) > 0 ||
    (recipientFilter.membershipStatuses?.length || 0) > 0 ||
    (recipientFilter.groupIds?.length || 0) > 0 ||
    manualEmails.length > 0;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBodyHtml(template.bodyHtml);
    }
  };

  const handleSendEmail = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          html: bodyHtml,
          templateId: selectedTemplate || undefined,
          recipientFilter: recipientFilter.all || recipientFilter.roles?.length || recipientFilter.membershipTypes?.length || recipientFilter.membershipStatuses?.length || recipientFilter.groupIds?.length
            ? recipientFilter
            : undefined,
          manualEmails: manualEmails.length > 0 ? manualEmails : undefined,
          sendNotification,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setToast({ type: 'success', message: `Email sent to ${result.totalRecipients} recipients!` });
        setSubject('');
        setBodyHtml('');
        setSelectedTemplate('');
        setRecipientFilter({});
        setManualEmails([]);
        setManualEmailInput('');
        setSendNotification(false);
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.error || 'Failed to send email' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error occurred' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const toggleRole = (role: Role) => {
    const roles = recipientFilter.roles || [];
    const newRoles = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
    setRecipientFilter({ ...recipientFilter, roles: newRoles, all: false });
  };

  const toggleMembershipType = (type: MembershipType) => {
    const types = recipientFilter.membershipTypes || [];
    const newTypes = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
    setRecipientFilter({ ...recipientFilter, membershipTypes: newTypes, all: false });
  };

  const toggleMembershipStatus = (status: MembershipStatus) => {
    const statuses = recipientFilter.membershipStatuses || [];
    const newStatuses = statuses.includes(status) ? statuses.filter((s) => s !== status) : [...statuses, status];
    setRecipientFilter({ ...recipientFilter, membershipStatuses: newStatuses, all: false });
  };

  const toggleGroup = (groupId: string) => {
    const gids = recipientFilter.groupIds || [];
    const newGids = gids.includes(groupId) ? gids.filter((g) => g !== groupId) : [...gids, groupId];
    setRecipientFilter({ ...recipientFilter, groupIds: newGids, all: false });
  };

  const toggleAll = () => {
    if (recipientFilter.all) {
      setRecipientFilter({});
    } else {
      setRecipientFilter({ all: true, roles: [], membershipTypes: [], membershipStatuses: [], groupIds: [] });
    }
  };

  const addManualEmail = () => {
    const email = manualEmailInput.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !manualEmails.includes(email)) {
      setManualEmails([...manualEmails, email]);
      setManualEmailInput('');
    }
  };

  const removeManualEmail = (email: string) => {
    setManualEmails(manualEmails.filter((e) => e !== email));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-white" />
          ) : (
            <XCircle className="h-5 w-5 text-white" />
          )}
          <span className="text-white">{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* Recipients */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Recipients</h3>
        </div>

        {/* All Members Toggle */}
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={recipientFilter.all || false}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-white font-medium">All Members</span>
        </label>

        {/* Role Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">By Role</label>
          <div className="flex flex-wrap gap-2">
            {(['ADMIN', 'MODERATOR', 'MEMBER'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => toggleRole(role)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  recipientFilter.roles?.includes(role)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/50 text-slate-300 border border-white/10 hover:border-indigo-500'
                }`}
                disabled={recipientFilter.all}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Membership Type Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">By Membership Type</label>
          <div className="flex flex-wrap gap-2">
            {(['INDIVIDUAL', 'FAMILY', 'STUDENT', 'LIFETIME'] as MembershipType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleMembershipType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  recipientFilter.membershipTypes?.includes(type)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/50 text-slate-300 border border-white/10 hover:border-indigo-500'
                }`}
                disabled={recipientFilter.all}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Membership Status Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">By Membership Status</label>
          <div className="flex flex-wrap gap-2">
            {(['ACTIVE', 'EXPIRED'] as MembershipStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => toggleMembershipStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  recipientFilter.membershipStatuses?.includes(status)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/50 text-slate-300 border border-white/10 hover:border-indigo-500'
                }`}
                disabled={recipientFilter.all}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Group Filters */}
        {groups.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">By Group</label>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    recipientFilter.groupIds?.includes(group.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900/50 text-slate-300 border border-white/10 hover:border-indigo-500'
                  }`}
                  disabled={recipientFilter.all}
                >
                  {group.name} ({group._count.members})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Email Entry */}
        <div className="pt-4 border-t border-white/10">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <AtSign className="h-4 w-4 inline mr-1" />
            Manual Email Addresses
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={manualEmailInput}
              onChange={(e) => setManualEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualEmail(); } }}
              placeholder="Enter an email address..."
              className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={addManualEmail}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          {manualEmails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {manualEmails.map((email) => (
                <span key={email} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm">
                  {email}
                  <button onClick={() => removeManualEmail(email)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Selector */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Use Template (Optional)
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="">-- Select a template --</option>
          {templates.filter((t) => t.isActive).map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.category}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject..."
          className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Body */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Email Body (HTML)</label>
        <p className="text-xs text-slate-400 mb-2">
          Available placeholders: {'{'}{'{'} firstName {'}'}{'}'}, {'{'}{'{'} lastName {'}'}{'}'}, {'{'}{'{'} name {'}'}{'}'}, {'{'}{'{'} email {'}'}{'}'}
        </p>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          placeholder="Enter email body HTML..."
          rows={12}
          className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono text-sm"
        />
      </div>

      {/* Send Notification */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
            className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-white">Also send as in-app notification</span>
        </label>
      </div>

      {/* Social Media Sharing */}
      <div className="bg-gradient-to-r from-blue-500/[0.06] to-purple-500/[0.06] border border-blue-500/20 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-white/70">Also share to social media</p>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white/[0.04] rounded-lg px-3 py-2">
            <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-white/60">Post to Facebook</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-white/[0.04] rounded-lg px-3 py-2">
            <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-pink-600 focus:ring-pink-500" />
            <span className="text-sm text-white/60">Post to Instagram</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowPreview(true)}
          disabled={!subject || !bodyHtml}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="h-5 w-5" />
          Preview
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!subject || !bodyHtml || !hasRecipients || loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Modal onClose={() => setShowPreview(false)} title="Email Preview">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
              <p className="text-white">{subject}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Body</label>
              {/* Safe to use dangerouslySetInnerHTML here - content is from trusted admin input */}
              <div
                className="bg-white text-black p-4 rounded-lg"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <Modal
          onClose={() => setShowConfirm(false)}
          title="Confirm Send"
          actions={
            <>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Confirm & Send
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-white">Are you sure you want to send this email?</p>
            <div className="bg-slate-900/50 p-3 rounded-lg space-y-2">
              <p className="text-sm text-slate-300"><strong>Subject:</strong> {subject}</p>
              {recipientFilter.all && <p className="text-sm text-slate-300">To: All members</p>}
              {recipientFilter.roles?.length ? <p className="text-sm text-slate-300">Roles: {recipientFilter.roles.join(', ')}</p> : null}
              {recipientFilter.groupIds?.length ? (
                <p className="text-sm text-slate-300">
                  Groups: {recipientFilter.groupIds.map((gid) => groups.find((g) => g.id === gid)?.name || gid).join(', ')}
                </p>
              ) : null}
              {manualEmails.length > 0 && <p className="text-sm text-slate-300">Manual emails: {manualEmails.join(', ')}</p>}
              {sendNotification && (
                <p className="text-sm text-slate-300">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  An in-app notification will also be sent.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ========== TAB 2: EMAIL TEMPLATES ==========
function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/communications/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/admin/communications/templates/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setToast({ type: 'success', message: 'Template deleted successfully' });
        loadTemplates();
      } else {
        setToast({ type: 'error', message: 'Failed to delete template' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Network error occurred' });
    } finally {
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-white" />
          ) : (
            <XCircle className="h-5 w-5 text-white" />
          )}
          <span className="text-white">{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Email Templates</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Template
        </button>
      </div>

      {/* Templates Table */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No templates found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Uses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{template.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded text-xs">
                      {template.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                    {template.subject}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{template.usageCount || 0}</td>
                  <td className="px-6 py-4 text-sm">
                    {template.isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-slate-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-indigo-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <TemplateFormModal
          template={editingTemplate}
          onClose={handleFormClose}
          onSuccess={() => {
            setToast({
              type: 'success',
              message: editingTemplate ? 'Template updated successfully' : 'Template created successfully',
            });
            setTimeout(() => setToast(null), 5000);
          }}
        />
      )}
    </div>
  );
}

// Template Form Modal Component
function TemplateFormModal({
  template,
  onClose,
  onSuccess,
}: {
  template: Template | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    bodyHtml: template?.bodyHtml || '',
    description: template?.description || '',
    category: template?.category || 'GENERAL',
    variables: template?.variables?.join(', ') || '',
    isActive: template?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = template
        ? `/api/admin/communications/templates/${template.id}`
        : '/api/admin/communications/templates';
      const method = template ? 'PUT' : 'POST';

      const body = {
        name: formData.name,
        subject: formData.subject,
        bodyHtml: formData.bodyHtml,
        description: formData.description || undefined,
        category: formData.category as Category,
        variables: formData.variables
          ? formData.variables.split(',').map((v) => v.trim()).filter(Boolean)
          : undefined,
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save template');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={template ? 'Edit Template' : 'Create Template'}
      size="large"
      actions={
        <>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="GENERAL">General</option>
            <option value="WELCOME">Welcome</option>
            <option value="MEMBERSHIP">Membership</option>
            <option value="EVENT">Event</option>
            <option value="NEWSLETTER">Newsletter</option>
            <option value="ADMIN">Admin</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Subject *</label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Body HTML *</label>
          <textarea
            required
            rows={8}
            value={formData.bodyHtml}
            onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Variables (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g., firstName, lastName, email"
            value={formData.variables}
            onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-white">Active</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

// ========== TAB 3: SENT HISTORY ==========
function HistoryTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EmailStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [currentPage, statusFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
      });
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/admin/communications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EmailStatus) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </span>
        );
      case 'SENDING':
        return (
          <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sending
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-1 bg-red-600/20 text-red-300 rounded text-xs flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as EmailStatus | '');
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All</option>
          <option value="SENT">Sent</option>
          <option value="SENDING">Sending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading history...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No emails found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{log.recipient}</td>
                  <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">{log.subject}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {log.templateName || 'Custom'}
                  </td>
                  <td className="px-6 py-4 text-sm">{getStatusBadge(log.status)}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(log.sentAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== TAB 4: GROUPS MANAGEMENT ==========
function GroupsTab() {
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingGroup, setEditingGroup] = useState<MemberGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Add members state
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/groups');
      if (res.ok) setGroups(await res.json());
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetail = async (groupId: string) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`);
      if (res.ok) setSelectedGroup(await res.json());
    } catch (error) {
      console.error('Failed to load group detail:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDescription.trim() || undefined }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Group created successfully' });
        setNewGroupName('');
        setNewGroupDescription('');
        setShowCreateForm(false);
        loadGroups();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || 'Failed to create group' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error' });
    } finally {
      setCreating(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      const res = await fetch(`/api/admin/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || undefined }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Group updated' });
        setEditingGroup(null);
        loadGroups();
        if (selectedGroup?.id === editingGroup.id) loadGroupDetail(editingGroup.id);
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || 'Failed to update group' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error' });
    } finally {
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ type: 'success', message: 'Group deleted' });
        if (selectedGroup?.id === groupId) setSelectedGroup(null);
        loadGroups();
      } else {
        setToast({ type: 'error', message: 'Failed to delete group' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error' });
    } finally {
      setTimeout(() => setToast(null), 5000);
    }
  };

  const searchMembers = async (query: string) => {
    setMemberSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/messages/user-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out users already in the group
        const existingIds = new Set(selectedGroup?.members.map((m) => m.userId) || []);
        setSearchResults((data.users || []).filter((u: UserSearchResult) => !existingIds.has(u.id)));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [userId] }),
      });
      if (res.ok) {
        loadGroupDetail(selectedGroup.id);
        loadGroups();
        setSearchResults(searchResults.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error('Add member error:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        loadGroupDetail(selectedGroup.id);
        loadGroups();
      }
    } catch (error) {
      console.error('Remove member error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-white" /> : <XCircle className="h-5 w-5 text-white" />}
          <span className="text-white">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="h-4 w-4 text-white" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Member Groups</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <FolderPlus className="h-5 w-5" />
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-8 text-center text-slate-400">
              No groups yet. Create one to get started.
            </div>
          ) : (
            groups.map((group) => (
              <button
                key={group.id}
                onClick={() => loadGroupDetail(group.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selectedGroup?.id === group.id
                    ? 'bg-indigo-600/20 border-indigo-500'
                    : 'bg-slate-800/50 border-white/10 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{group.name}</h3>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                    {group._count.members} members
                  </span>
                </div>
                {group.description && (
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{group.description}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Group Detail Panel */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl">
              {/* Group Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedGroup.name}</h3>
                    {selectedGroup.description && (
                      <p className="text-sm text-slate-400 mt-1">{selectedGroup.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Created by {selectedGroup.createdBy.firstName} {selectedGroup.createdBy.lastName} on{' '}
                      {new Date(selectedGroup.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingGroup(selectedGroup); setEditName(selectedGroup.name); setEditDescription(selectedGroup.description || ''); }}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(selectedGroup.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Add Members Button */}
                <button
                  onClick={() => { setShowAddMembers(!showAddMembers); setMemberSearch(''); setSearchResults([]); }}
                  className="mt-4 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Members
                </button>

                {/* Add Members Search */}
                {showAddMembers && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => searchMembers(e.target.value)}
                        placeholder="Search members by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                      />
                    </div>
                    {searching && <p className="text-xs text-slate-400">Searching...</p>}
                    {searchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchResults.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                            <div>
                              <span className="text-sm text-white">{user.firstName} {user.lastName}</span>
                              <span className="text-xs text-slate-400 ml-2">{user.email}</span>
                            </div>
                            <button
                              onClick={() => handleAddMember(user.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-3">
                  Members ({selectedGroup.members.length})
                </h4>
                {selectedGroup.members.length === 0 ? (
                  <p className="text-sm text-slate-400">No members yet. Use the button above to add members.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedGroup.members.map((m) => (
                      <div key={m.userId} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                        <div>
                          <span className="text-sm text-white">{m.user.firstName} {m.user.lastName}</span>
                          <span className="text-xs text-slate-400 ml-2">{m.user.email}</span>
                          <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-2">{m.user.role}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          title="Remove from group"
                        >
                          <UserMinus className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-12 text-center text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a group to view and manage its members</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)} title="Create Group" actions={
          <>
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={handleCreateGroup} disabled={creating || !newGroupName.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </>
        }>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Group Name *</label>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Board Members, Volunteers, OBS Committee"
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Optional description for this group..."
                rows={3}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <Modal onClose={() => setEditingGroup(null)} title="Edit Group" actions={
          <>
            <button onClick={() => setEditingGroup(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={handleUpdateGroup} disabled={!editName.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50">
              Save Changes
            </button>
          </>
        }>
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Group Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ========== MODAL COMPONENT ==========
function Modal({
  children,
  onClose,
  title,
  size = 'medium',
  actions,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  size?: 'medium' | 'large';
  actions?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-slate-800 border border-white/10 rounded-xl shadow-xl ${
          size === 'large' ? 'max-w-4xl w-full' : 'max-w-2xl w-full'
        } max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
