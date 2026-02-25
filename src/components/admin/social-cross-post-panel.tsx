'use client';

import { useState, useEffect } from 'react';
import { Share2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface SocialStatus {
  facebook: boolean;
  instagram: boolean;
}

interface SocialCrossPostPanelProps {
  bodyText: string;
  subject: string;
  onPost?: () => void;
}

export function SocialCrossPostPanel({ bodyText, subject, onPost }: SocialCrossPostPanelProps) {
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [instagramEnabled, setInstagramEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ posted: string[]; failed: string[]; errors: Record<string, string> } | null>(null);

  useEffect(() => {
    fetch('/api/admin/social/status')
      .then((r) => r.json())
      .then((d: SocialStatus) => setStatus(d))
      .catch(() => setStatus({ facebook: false, instagram: false }));
  }, []);

  const canPost =
    (facebookEnabled && status?.facebook) ||
    (instagramEnabled && status?.instagram);

  const handlePost = async () => {
    if (!canPost) return;
    setLoading(true);
    setResult(null);

    const platforms: ('facebook' | 'instagram')[] = [];
    if (facebookEnabled && status?.facebook) platforms.push('facebook');
    if (instagramEnabled && status?.instagram) platforms.push('instagram');

    const message = `${subject}\n\n${bodyText}`.slice(0, 2000);

    try {
      const res = await fetch('/api/admin/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, platforms }),
      });
      const data = await res.json();
      setResult(data);
      if (data.posted?.length > 0) onPost?.();
    } catch {
      setResult({ posted: [], failed: platforms, errors: { network: 'Network error' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500/[0.06] to-purple-500/[0.06] border border-blue-500/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-blue-400" />
        <p className="text-sm font-medium text-white/70">Also share to social media</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Facebook toggle */}
        <SocialToggle
          platform="facebook"
          label="Facebook"
          configured={status?.facebook ?? false}
          enabled={facebookEnabled}
          onToggle={() => setFacebookEnabled((v) => !v)}
          icon={
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          }
        />

        {/* Instagram toggle */}
        <SocialToggle
          platform="instagram"
          label="Instagram"
          configured={status?.instagram ?? false}
          enabled={instagramEnabled}
          onToggle={() => setInstagramEnabled((v) => !v)}
          icon={
            <svg className="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          }
        />
      </div>

      {/* Post button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePost}
          disabled={!canPost || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {loading ? 'Posting...' : 'Post to Social'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-1">
          {result.posted.map((p) => (
            <div key={p} className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Posted to {p}
            </div>
          ))}
          {result.failed.map((p) => (
            <div key={p} className="flex items-center gap-2 text-sm text-red-400">
              <XCircle className="h-4 w-4" />
              Failed: {p} — {result.errors[p] || 'Unknown error'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialToggle({
  platform,
  label,
  configured,
  enabled,
  onToggle,
  icon,
}: {
  platform: string;
  label: string;
  configured: boolean;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}) {
  const title = !configured ? 'Not configured — add API keys to enable' : undefined;

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer bg-white/[0.04] rounded-lg px-3 py-2 transition-opacity ${!configured ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={title}
    >
      <input
        type="checkbox"
        checked={enabled && configured}
        onChange={onToggle}
        disabled={!configured}
        className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
      />
      {icon}
      <span className="text-sm text-white/60">{label}</span>
      {!configured && (
        <span className="text-xs text-slate-500">(not configured)</span>
      )}
    </label>
  );
}
