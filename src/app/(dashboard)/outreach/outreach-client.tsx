'use client';

import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Crown, 
  Shield, 
  User,
  Trash2,
  Send,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface CommitteeMember {
  id: string;
  userId: string;
  role: 'CHAIR' | 'VICE_CHAIR' | 'VOLUNTEER';
  joinedAt: string;
  notes: string | null;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
}

interface Props {
  initialMembers: CommitteeMember[];
  canManage: boolean;
  currentUserId: string;
}

const roleIcons = {
  CHAIR: Crown,
  VICE_CHAIR: Shield,
  VOLUNTEER: User,
};

const roleLabels = {
  CHAIR: 'Outreach Chair',
  VICE_CHAIR: 'Vice Chair',
  VOLUNTEER: 'Volunteer',
};

const roleColors = {
  CHAIR: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  VICE_CHAIR: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  VOLUNTEER: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
};

export default function OutreachCommitteeClient({ initialMembers, canManage, currentUserId }: Props) {
  const [members, setMembers] = useState<CommitteeMember[]>(initialMembers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Add member form state
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'VOLUNTEER' | 'VICE_CHAIR'>('VOLUNTEER');
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleAddMember = async () => {
    if (!newMemberEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/outreach/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
      }
      
      const newMember = await res.json();
      setMembers([...members, newMember]);
      setShowAddModal(false);
      setNewMemberEmail('');
      setNewMemberRole('VOLUNTEER');
      setSuccess('Member added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the committee?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/outreach/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove member');
      }
      
      setMembers(members.filter((m) => m.id !== memberId));
      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody || selectedMembers.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/outreach/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIds: selectedMembers,
          subject: emailSubject,
          body: emailBody,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to send email');
      }
      
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
      setSelectedMembers([]);
      setSuccess('Email sent successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => m.id));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Outreach Committee</h1>
          </div>
          <p className="text-slate-400">
            {members.length} active member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedMembers(members.map((m) => m.id));
              setShowEmailModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email Committee
          </button>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Members List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const RoleIcon = roleIcons[member.role];
          return (
            <div
              key={member.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-lg font-semibold text-white">
                  {member.user?.firstName?.[0] || '?'}
                  {member.user?.lastName?.[0] || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {member.user?.firstName} {member.user?.lastName}
                    </h3>
                    {member.userId === currentUserId && (
                      <span className="text-xs text-indigo-400">(you)</span>
                    )}
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[member.role]}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleLabels[member.role]}
                  </div>
                </div>
                {canManage && member.role !== 'CHAIR' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                {member.user?.email && (
                  <a
                    href={`mailto:${member.user.email}`}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{member.user.email}</span>
                  </a>
                )}
                {member.user?.phone && (
                  <a
                    href={`tel:${member.user.phone}`}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{member.user.phone}</span>
                  </a>
                )}
              </div>
              
              {member.notes && (
                <p className="mt-3 text-sm text-slate-500 line-clamp-2">{member.notes}</p>
              )}
              
              <p className="mt-3 text-xs text-slate-500">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No committee members yet.</p>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300"
            >
              Add the first member
            </button>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add Committee Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Member Email
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Must be an existing SPAC member</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as 'VOLUNTEER' | 'VICE_CHAIR')}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="VICE_CHAIR">Vice Chair</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={loading || !newMemberEmail}
                className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Email Committee Members</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Recipients</label>
                  <button
                    onClick={selectAllMembers}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-700/50 rounded-lg min-h-[60px]">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => toggleMemberSelection(member.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedMembers.includes(member.id)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {member.user?.firstName} {member.user?.lastName}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={8}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={loading || !emailSubject || !emailBody || selectedMembers.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : `Send to ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
