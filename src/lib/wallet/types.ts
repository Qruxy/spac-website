/**
 * Wallet Pass Types
 *
 * Types for Apple and Google wallet pass generation.
 */

export interface MemberPassData {
  memberId: string;
  memberName: string;
  memberType: 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'FREE';
  memberSince: Date;
  expirationDate?: Date;
  qrCodeUrl: string;
  qrUuid: string;
  isActive: boolean;
}

export interface ApplePassConfig {
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  serialNumber: string;
  description: string;
  logoText?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  labelColor?: string;
}

export interface GooglePassConfig {
  issuerId: string;
  classId: string;
  objectId: string;
}
