/**
 * Apple Wallet Pass Generator
 *
 * Generates Apple Wallet passes for membership cards.
 * Uses the passkit-generator library.
 *
 * Setup required:
 * 1. Apple Developer account ($99/year)
 * 2. Create Pass Type ID in Certificates, Identifiers & Profiles
 * 3. Generate pass certificate (.p12 file)
 * 4. Download Apple WWDR certificate
 */

import { PKPass } from 'passkit-generator';
import type { MemberPassData } from './types';

const PASS_TYPE_IDENTIFIER = process.env.APPLE_PASS_TYPE_IDENTIFIER || '';
const TEAM_IDENTIFIER = process.env.APPLE_TEAM_IDENTIFIER || '';

interface AppleWalletCredentials {
  signerCert: string;
  signerKey: string;
  wwdr: string;
  signerKeyPassphrase?: string;
}

/**
 * Get Apple Wallet credentials from environment
 */
function getCredentials(): AppleWalletCredentials | null {
  const signerCert = process.env.APPLE_PASS_CERTIFICATE;
  const signerKey = process.env.APPLE_PASS_PRIVATE_KEY;
  const wwdr = process.env.APPLE_WWDR_CERTIFICATE;
  const signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSPHRASE;

  if (!signerCert || !signerKey || !wwdr) {
    return null;
  }

  return {
    signerCert: signerCert.replace(/\\n/g, '\n'),
    signerKey: signerKey.replace(/\\n/g, '\n'),
    wwdr: wwdr.replace(/\\n/g, '\n'),
    signerKeyPassphrase,
  };
}

/**
 * Generate an Apple Wallet pass for a member
 */
export async function generateAppleWalletPass(
  memberData: MemberPassData
): Promise<Buffer> {
  const credentials = getCredentials();
  if (!credentials || !PASS_TYPE_IDENTIFIER || !TEAM_IDENTIFIER) {
    throw new Error('Apple Wallet not configured');
  }

  const memberTypeLabels: Record<string, string> = {
    INDIVIDUAL: 'Individual',
    FAMILY: 'Family',
    STUDENT: 'Student',
    FREE: 'Free',
  };

  const memberTypeColors: Record<string, string> = {
    INDIVIDUAL: 'rgb(30, 27, 75)', // Purple dark
    FAMILY: 'rgb(30, 58, 138)',    // Blue dark
    STUDENT: 'rgb(20, 83, 45)',    // Green dark
    FREE: 'rgb(55, 65, 81)',       // Gray dark
  };

  // Create the pass
  const pass = new PKPass(
    {},
    {
      signerCert: credentials.signerCert,
      signerKey: credentials.signerKey,
      wwdr: credentials.wwdr,
      signerKeyPassphrase: credentials.signerKeyPassphrase,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: PASS_TYPE_IDENTIFIER,
      teamIdentifier: TEAM_IDENTIFIER,
      serialNumber: memberData.memberId,
      organizationName: 'St. Petersburg Astronomy Club',
      description: 'SPAC Membership Card',
      logoText: 'SPAC',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: memberTypeColors[memberData.memberType] || 'rgb(30, 27, 75)',
      labelColor: 'rgb(200, 200, 200)',
      sharingProhibited: false,
    }
  );

  // Set pass type to generic
  pass.type = 'generic';

  // Primary fields (shown prominently)
  pass.primaryFields.push({
    key: 'member_name',
    label: 'MEMBER',
    value: memberData.memberName,
  });

  // Secondary fields
  pass.secondaryFields.push(
    {
      key: 'member_type',
      label: 'MEMBERSHIP TYPE',
      value: memberTypeLabels[memberData.memberType] || 'Member',
    },
    {
      key: 'status',
      label: 'STATUS',
      value: memberData.isActive ? 'Active' : 'Inactive',
    }
  );

  // Auxiliary fields
  pass.auxiliaryFields.push({
    key: 'member_since',
    label: 'MEMBER SINCE',
    value: memberData.memberSince.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  });

  if (memberData.expirationDate) {
    pass.auxiliaryFields.push({
      key: 'expires',
      label: 'EXPIRES',
      value: memberData.expirationDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    });
  }

  // Back fields (shown when pass is flipped)
  pass.backFields.push(
    {
      key: 'member_id',
      label: 'Member ID',
      value: memberData.memberId,
    },
    {
      key: 'qr_uuid',
      label: 'QR Code ID',
      value: memberData.qrUuid,
    },
    {
      key: 'website',
      label: 'Website',
      value: 'https://spac.org',
    },
    {
      key: 'contact',
      label: 'Contact',
      value: 'info@spac.org',
    }
  );

  // Barcode/QR code
  pass.setBarcodes({
    format: 'PKBarcodeFormatQR',
    message: memberData.qrCodeUrl,
    messageEncoding: 'iso-8859-1',
    altText: memberData.qrUuid.slice(0, 8),
  });

  // Relevance - show pass at club location
  pass.setLocations({
    latitude: 27.7676,
    longitude: -82.6403,
    relevantText: 'Welcome to SPAC!',
  });

  // Web service for updates (optional - for live updates)
  // pass.setWebService({
  //   webServiceURL: 'https://spac.org/api/wallet/apple/update',
  //   authenticationToken: memberData.qrUuid,
  // });

  // Generate the .pkpass file
  const buffer = pass.getAsBuffer();

  return buffer;
}

/**
 * Check if Apple Wallet is configured
 */
export function isAppleWalletConfigured(): boolean {
  return !!(getCredentials() && PASS_TYPE_IDENTIFIER && TEAM_IDENTIFIER);
}

/**
 * Get pass MIME type
 */
export function getApplePassMimeType(): string {
  return 'application/vnd.apple.pkpass';
}
