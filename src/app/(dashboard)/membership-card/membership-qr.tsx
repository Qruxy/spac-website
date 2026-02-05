'use client';

/**
 * Membership Card QR Code Component
 *
 * Generates and displays the QR code for membership verification.
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';

interface MembershipCardQRProps {
  verificationUrl: string;
  memberName: string;
}

export function MembershipCardQR({
  verificationUrl,
  memberName,
}: MembershipCardQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        const dataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 200,
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
        setError('Failed to generate QR code');
      }
    }

    generateQR();
  }, [verificationUrl]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px] text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (!qrDataUrl) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`Membership QR code for ${memberName}`}
        width={200}
        height={200}
        className="rounded-lg"
      />
      <p className="mt-2 text-xs text-gray-500 text-center">
        Scan to verify membership
      </p>
    </div>
  );
}
