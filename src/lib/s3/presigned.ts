/**
 * S3 Presigned URL Generation
 *
 * Generates presigned URLs for direct client-side uploads to S3.
 */

import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Bucket, getPublicUrl } from './index';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  fields?: Record<string, string>;
}

export interface PresignedUploadOptions {
  filename: string;
  contentType: string;
  folder?: string;
  maxSize?: number; // bytes
  expiresIn?: number; // seconds
}

/**
 * Allowed MIME types for uploads
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Validate file type and size
 */
export function validateUpload(
  contentType: string,
  size: number,
  allowedTypes: string[] = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(contentType)) {
    return {
      valid: false,
      error: `File type ${contentType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  const maxSize = ALLOWED_IMAGE_TYPES.includes(contentType)
    ? MAX_IMAGE_SIZE
    : MAX_DOCUMENT_SIZE;

  if (size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique S3 key for an upload
 */
export function generateS3Key(
  filename: string,
  folder: string = 'uploads'
): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const uniqueId = uuidv4();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Format: folder/year/month/uuid.ext
  return `${folder}/${year}/${month}/${uniqueId}.${ext}`;
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function createPresignedUploadUrl({
  filename,
  contentType,
  folder = 'uploads',
  expiresIn = 3600, // 1 hour default
}: PresignedUploadOptions): Promise<PresignedUploadResult> {
  const s3Client = getS3Client();
  const bucket = getS3Bucket();
  const key = generateS3Key(filename, folder);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = getPublicUrl(key);

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

/**
 * Generate a presigned URL for downloading/viewing a file from S3
 */
export async function createPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const s3Client = getS3Client();
  const bucket = getS3Bucket();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete an object from S3
 */
export async function deleteS3Object(key: string): Promise<void> {
  const s3Client = getS3Client();
  const bucket = getS3Bucket();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a user-scoped S3 key for avatar uploads
 * Industry standard: users/{userId}/avatar.{ext}
 */
export function generateUserAvatarKey(userId: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return `users/${userId}/avatar.${ext}`;
}

/**
 * Generate a user-scoped S3 key for user-owned content
 * Industry standard: users/{userId}/{folder}/{uuid}.{ext}
 */
export function generateUserScopedKey(
  userId: string,
  filename: string,
  folder: string = 'uploads'
): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const uniqueId = uuidv4();
  return `users/${userId}/${folder}/${uniqueId}.${ext}`;
}

/**
 * Generate thumbnail key from original key
 */
export function getThumbnailKey(originalKey: string): string {
  const parts = originalKey.split('/');
  const filename = parts.pop();
  const thumbnailFilename = `thumb_${filename}`;
  return [...parts, 'thumbnails', thumbnailFilename].join('/');
}
