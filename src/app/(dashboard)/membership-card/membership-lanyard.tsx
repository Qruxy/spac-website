'use client';

/**
 * Membership Lanyard 3D Component with Flip
 *
 * Displays a 3D lanyard on the front, flips to show QR code on back.
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import QRCode from 'qrcode';
import { RotateCcw, QrCode, Loader2 } from 'lucide-react';

// Dynamically import Lanyard to avoid SSR issues with Three.js
const Lanyard = dynamic(() => import('@/components/lanyard/Lanyard'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="animate-pulse text-white/60">Loading 3D Card...</div>
    </div>
  ),
});

interface MembershipLanyardProps {
  verificationUrl: string;
  memberName: string;
  memberId?: string;
}

export function MembershipLanyard({
  verificationUrl,
  memberName,
  memberId,
}: MembershipLanyardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        const dataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    }
    generateQR();
  }, [verificationUrl]);

  return (
    <div className="space-y-4">
      {/* Flip Card Container */}
      <div
        className="relative h-[400px] w-full"
        style={{ perspective: '1000px' }}
      >
        <div
          className={`relative w-full h-full transition-transform duration-700`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front - 3D Lanyard */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-950 border border-white/10"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Lanyard />
          </div>

          {/* Back - QR Code Card */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/10"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="h-full flex flex-col items-center justify-center p-6">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">🔭</span>
                  <span className="text-xl font-bold text-white">SPAC</span>
                </div>
                <p className="text-sm text-white/60">
                  St. Pete Astronomy Club
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-xl p-4 shadow-lg">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={`Membership QR code for ${memberName}`}
                    width={280}
                    height={280}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-[280px] h-[280px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold text-white">{memberName}</p>
                <p className="text-xs text-white/40 mt-1">
                  Scan to verify membership
                </p>
                {memberId && (
                  <p className="text-xs text-white/30 mt-1">ID: {memberId}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flip Button */}
      <button
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-3 text-sm font-medium text-white transition-colors border border-white/10"
      >
        {isFlipped ? (
          <>
            <RotateCcw className="h-4 w-4" />
            View Interactive Card
          </>
        ) : (
          <>
            <QrCode className="h-4 w-4" />
            View QR Code
          </>
        )}
      </button>
    </div>
  );
}

export default MembershipLanyard;
