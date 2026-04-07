import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getS3Bucket, getPublicUrl } from '@/lib/s3';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const pageKey = (formData.get('pageKey') as string) || 'page-builder';
  const fieldKey = (formData.get('fieldKey') as string) || 'upload';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const isEmailAttachment = pageKey === 'email-attachments';
  const allowedTypes = isEmailAttachment
    ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = isEmailAttachment ? 15 * 1024 * 1024 : 20 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({
      error: isEmailAttachment
        ? 'File type not allowed. Use PDF, JPG, PNG, or DOCX.'
        : 'File type not allowed. Use JPG, PNG, WEBP, or GIF.',
    }, { status: 400 });
  }
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large. Max ${maxSize / 1024 / 1024} MB.` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `page-builder/${pageKey}/${fieldKey}/${Date.now()}-${safe}`;

  const s3 = getS3Client();
  const bucket = getS3Bucket();

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }));

  return NextResponse.json({ url: getPublicUrl(key) });
}
