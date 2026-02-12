'use client';

/**
 * Communications Page - Admin Dashboard
 *
 * Provides email and notification management for admins/moderators:
 * - Tab 1: Compose and send bulk emails with recipient filtering
 * - Tab 2: Manage email templates (CRUD operations)
 * - Tab 3: View sent email history with status tracking
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
}

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('compose');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-600/20 rounded-lg">
          <Mail className="h-8 w-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Communications</h1>
          <p className="text-slate-400">Send emails and manage communication templates</p>
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
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'compose' && <ComposeTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'history' && <HistoryTab />}
    </div>
  );
}

// ========== TAB 1: COMPOSE EMAIL ==========
function ComposeTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({});
  const [sendNotification, setSendNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Calculate recipient count when filter changes
  useEffect(() => {
    calculateRecipientCount();
  }, [recipientFilter]);

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

  const calculateRecipientCount = async () => {
    try {
      // For now, use a mock count. In production, you'd call an API endpoint
      // that returns the count based on the filter
      let count = 0;
      if (recipientFilter.all) {
        count = 150; // Mock total members
      } else {
        count = (recipientFilter.roles?.length || 0) * 20 +
                (recipientFilter.membershipTypes?.length || 0) * 15 +
                (recipientFilter.membershipStatuses?.length || 0) * 10;
      }
      setRecipientCount(Math.min(count, 150));
    } catch (error) {
      console.error('Failed to calculate recipient count:', error);
    }
  };

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
          recipientFilter,
          sendNotification,
        }),
      });

      if (res.ok) {
        setToast({ type: 'success', message: 'Email sent successfully!' });
        setSubject('');
        setBodyHtml('');
        setSelectedTemplate('');
        setRecipientFilter({});
        setSendNotification(false);
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.error || 'Failed to send email' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Network error occurred' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const toggleRole = (role: Role) => {
    const roles = recipientFilter.roles || [];
    const newRoles = roles.includes(role)
      ? roles.filter((r) => r !== role)
      : [...roles, role];
    setRecipientFilter({ ...recipientFilter, roles: newRoles, all: false });
  };

  const toggleMembershipType = (type: MembershipType) => {
    const types = recipientFilter.membershipTypes || [];
    const newTypes = types.includes(type)
      ? types.filter((t) => t !== type)
      : [...types, type];
    setRecipientFilter({ ...recipientFilter, membershipTypes: newTypes, all: false });
  };

  const toggleMembershipStatus = (status: MembershipStatus) => {
    const statuses = recipientFilter.membershipStatuses || [];
    const newStatuses = statuses.includes(status)
      ? statuses.filter((s) => s !== status)
      : [...statuses, status];
    setRecipientFilter({ ...recipientFilter, membershipStatuses: newStatuses, all: false });
  };

  const toggleAll = () => {
    if (recipientFilter.all) {
      setRecipientFilter({});
    } else {
      setRecipientFilter({ all: true, roles: [], membershipTypes: [], membershipStatuses: [] });
    }
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
          <span className="ml-auto text-sm text-slate-400">{recipientCount} members selected</span>
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
        <div>
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
          disabled={!subject || !bodyHtml || recipientCount === 0 || loading}
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
                Send to {recipientCount} members
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-white">
              You are about to send this email to <strong>{recipientCount} members</strong>.
            </p>
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <p className="text-sm text-slate-300">
                <strong>Subject:</strong> {subject}
              </p>
              {sendNotification && (
                <p className="text-sm text-slate-300 mt-2">
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
