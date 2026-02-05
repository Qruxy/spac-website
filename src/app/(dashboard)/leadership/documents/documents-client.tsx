'use client';

import { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Newspaper, 
  Scale, 
  FileCheck, 
  FormInput,
  DollarSign,
  File,
  Trash2,
  Download,
  ExternalLink,
  Plus,
  X,
  AlertCircle,
  Check,
  ChevronDown,
  FolderOpen
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  year: number | null;
  month: number | null;
  isPublic: boolean;
  createdAt: string;
}

interface Props {
  documentsByCategory: Record<string, Document[]>;
  isAdmin: boolean;
}

const categoryInfo: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  NEWSLETTER: { icon: Newspaper, label: 'Newsletters', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  MEETING_MINUTES: { icon: FileText, label: 'Meeting Minutes', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  BYLAWS: { icon: Scale, label: 'Bylaws', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  POLICY: { icon: FileCheck, label: 'Policies', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  FORM: { icon: FormInput, label: 'Forms', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' },
  FINANCIAL: { icon: DollarSign, label: 'Financial Reports', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  OTHER: { icon: File, label: 'Other Documents', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
};

const categoryOrder = ['BYLAWS', 'POLICY', 'NEWSLETTER', 'MEETING_MINUTES', 'FINANCIAL', 'FORM', 'OTHER'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsClient({ documentsByCategory, isAdmin }: Props) {
  const [documents, setDocuments] = useState(documentsByCategory);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categoryOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Upload form state
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    isPublic: false,
    file: null as File | null,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('category', uploadData.category);
      formData.append('year', uploadData.year.toString());
      formData.append('month', uploadData.month.toString());
      formData.append('isPublic', uploadData.isPublic.toString());

      const res = await fetch('/api/leadership/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      const newDoc = await res.json();
      
      // Update local state
      setDocuments((prev) => ({
        ...prev,
        [newDoc.category]: [...(prev[newDoc.category] || []), newDoc],
      }));
      
      setShowUploadModal(false);
      setUploadData({
        title: '',
        description: '',
        category: 'OTHER',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        isPublic: false,
        file: null,
      });
      setSuccess('Document uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/leadership/documents/${doc.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete document');
      }

      // Update local state
      setDocuments((prev) => ({
        ...prev,
        [doc.category]: prev[doc.category].filter((d) => d.id !== doc.id),
      }));
      
      setSuccess('Document deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sortedCategories = categoryOrder.filter((cat) => documents[cat]?.length > 0);

  return (
    <div>
      {/* Actions */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
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

      {/* Documents by Category */}
      {sortedCategories.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category) => {
            const info = categoryInfo[category] || categoryInfo.OTHER;
            const Icon = info.icon;
            const docs = documents[category];
            
            return (
              <div key={category} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${info.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-semibold text-white">{info.label}</span>
                    <span className="text-sm text-slate-400">({docs.length})</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedCategories.includes(category) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedCategories.includes(category) && (
                  <div className="border-t border-slate-700/50">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-700/50">
                          <th className="px-4 py-3 font-medium">Document</th>
                          <th className="px-4 py-3 font-medium hidden md:table-cell">Size</th>
                          <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {docs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-700/20">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-white">{doc.title}</p>
                                {doc.description && (
                                  <p className="text-sm text-slate-400 line-clamp-1">{doc.description}</p>
                                )}
                                {doc.year && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {doc.month ? `${doc.month}/${doc.year}` : doc.year}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">
                              {formatFileSize(doc.size)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors"
                                  title="View"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <a
                                  href={doc.fileUrl}
                                  download={doc.filename}
                                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDelete(doc)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  File
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-500 file:text-white file:cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="Document title"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="MEETING_MINUTES">Meeting Minutes</option>
                  <option value="BYLAWS">Bylaws</option>
                  <option value="POLICY">Policy</option>
                  <option value="FORM">Form</option>
                  <option value="FINANCIAL">Financial Report</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={uploadData.year}
                    onChange={(e) => setUploadData({ ...uploadData, year: parseInt(e.target.value) })}
                    min="2000"
                    max="2099"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Month
                  </label>
                  <select
                    value={uploadData.month}
                    onChange={(e) => setUploadData({ ...uploadData, month: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadData.isPublic}
                  onChange={(e) => setUploadData({ ...uploadData, isPublic: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
                />
                <span className="text-slate-300">Make publicly accessible</span>
              </label>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !uploadData.file || !uploadData.title}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
