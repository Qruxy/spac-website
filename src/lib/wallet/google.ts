/**
 * Google Wallet Pass Generator
 *
 * Generates Google Wallet passes for membership cards.
 * Uses the Google Wallet API with JWT-based approach.
 *
 * Setup required:
 * 1. Create Google Cloud project
 * 2. Enable Google Wallet API
 * 3. Create service account and download JSON key
 * 4. Create issuer account in Google Wallet Console
 */

import { GoogleAuth } from 'google-auth-library';
import type { MemberPassData } from './types';

const GOOGLE_WALLET_ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID || '';
const GOOGLE_WALLET_CLASS_SUFFIX = 'spac_membership';

interface GoogleWalletCredentials {
  client_email: string;
  private_key: string;
}

/**
 * Get Google Wallet credentials from environment
 */
function getCredentials(): GoogleWalletCredentials | null {
  const credentials = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
  if (!credentials) {
    return null;
  }

  try {
    return JSON.parse(credentials);
  } catch {
    return null;
  }
}

/**
 * Create the Generic Pass class (done once, usually via admin)
 */
export async function createPassClass() {
  const credentials = getCredentials();
  if (!credentials || !GOOGLE_WALLET_ISSUER_ID) {
    throw new Error('Google Wallet not configured');
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });

  const client = await auth.getClient();
  const classId = `${GOOGLE_WALLET_ISSUER_ID}.${GOOGLE_WALLET_CLASS_SUFFIX}`;

  const genericClass = {
    id: classId,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['member_type']",
                    },
                  ],
                },
              },
              endItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['member_since']",
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
    imageModulesData: [
      {
        mainImage: {
          sourceUri: {
            uri: 'https://spac.org/logo.png', // Club logo
          },
          contentDescription: {
            defaultValue: {
              language: 'en-US',
              value: 'SPAC Logo',
            },
          },
        },
        id: 'logo',
      },
    ],
  };

  const response = await client.request({
    url: 'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
    method: 'POST',
    data: genericClass,
  });

  return response.data;
}

/**
 * Generate a "Save to Google Wallet" link for a member
 */
export async function generateGoogleWalletLink(
  memberData: MemberPassData
): Promise<string> {
  const credentials = getCredentials();
  if (!credentials || !GOOGLE_WALLET_ISSUER_ID) {
    throw new Error('Google Wallet not configured');
  }

  const classId = `${GOOGLE_WALLET_ISSUER_ID}.${GOOGLE_WALLET_CLASS_SUFFIX}`;
  const objectId = `${GOOGLE_WALLET_ISSUER_ID}.${memberData.memberId}`;

  const memberTypeLabels: Record<string, string> = {
    INDIVIDUAL: 'Individual',
    FAMILY: 'Family',
    STUDENT: 'Student',
    FREE: 'Free',
  };

  // Create the pass object
  const genericObject = {
    id: objectId,
    classId: classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#1e1b4b', // Purple dark
    logo: {
      sourceUri: {
        uri: 'https://spac.org/logo-white.png',
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'SPAC',
        },
      },
    },
    cardTitle: {
      defaultValue: {
        language: 'en-US',
        value: 'SPAC Membership',
      },
    },
    subheader: {
      defaultValue: {
        language: 'en-US',
        value: memberTypeLabels[memberData.memberType] || 'Member',
      },
    },
    header: {
      defaultValue: {
        language: 'en-US',
        value: memberData.memberName,
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: memberData.qrCodeUrl,
      alternateText: memberData.qrUuid.slice(0, 8),
    },
    textModulesData: [
      {
        id: 'member_type',
        header: 'MEMBERSHIP TYPE',
        body: memberTypeLabels[memberData.memberType] || 'Member',
      },
      {
        id: 'member_since',
        header: 'MEMBER SINCE',
        body: memberData.memberSince.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      },
      {
        id: 'status',
        header: 'STATUS',
        body: memberData.isActive ? 'Active' : 'Inactive',
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: 'https://spac.org',
          description: 'Visit SPAC Website',
          id: 'website',
        },
        {
          uri: 'https://spac.org/events',
          description: 'View Events',
          id: 'events',
        },
      ],
    },
    state: memberData.isActive ? 'ACTIVE' : 'INACTIVE',
  };

  // Create JWT for "Save to Google Wallet" link
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });

  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    typ: 'savetowallet',
    origins: ['https://spac.org'],
    payload: {
      genericObjects: [genericObject],
    },
  };

  const client = await auth.getClient();
  const token = await client.credentials.access_token;

  // Sign the JWT
  const jwt = await signJwt(claims, credentials.private_key);

  return `https://pay.google.com/gp/v/save/${jwt}`;
}

/**
 * Sign JWT for Google Wallet
 */
async function signJwt(
  payload: object,
  privateKey: string
): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const claimsB64 = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Use Node.js crypto to sign
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(privateKey, 'base64url');

  return `${unsignedToken}.${signature}`;
}

/**
 * Check if Google Wallet is configured
 */
export function isGoogleWalletConfigured(): boolean {
  return !!(getCredentials() && GOOGLE_WALLET_ISSUER_ID);
}
