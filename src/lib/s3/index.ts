/**
 * S3 Client Configuration
 *
 * Lazy-loaded S3 client for AWS operations.
 */

import { S3Client } from '@aws-sdk/client-s3';

let _s3Client: S3Client | null = null;

/**
 * Get the S3 client instance.
 * Lazily initializes on first call to avoid build-time issues.
 */
export function getS3Client(): S3Client {
  if (!_s3Client) {
    const region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';

    _s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _s3Client;
}

/**
 * Get S3 bucket name from environment
 */
export function getS3Bucket(): string {
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET or S3_BUCKET is not set in environment variables');
  }
  return bucket;
}

/**
 * Get CloudFront domain for CDN URLs
 */
export function getCloudFrontDomain(): string | null {
  return process.env.CLOUDFRONT_DOMAIN || null;
}

/**
 * Generate the public URL for an S3 object
 */
export function getPublicUrl(key: string): string {
  const cloudFrontDomain = getCloudFrontDomain();

  if (cloudFrontDomain) {
    return `https://${cloudFrontDomain}/${key}`;
  }

  const bucket = getS3Bucket();
  const region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
