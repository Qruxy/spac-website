export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../utils';
import { prisma } from '@/lib/db';

interface PostBody {
  message: string;
  platforms: ('facebook' | 'instagram')[];
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error!;

  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!pageId || !accessToken) {
    return NextResponse.json(
      { error: 'Facebook not configured. Add FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN to environment variables.' },
      { status: 503 },
    );
  }

  const body = (await request.json()) as PostBody;
  const { message, platforms } = body;

  const posted: string[] = [];
  const failed: string[] = [];
  const errors: Record<string, string> = {};

  for (const platform of platforms) {
    try {
      if (platform === 'facebook') {
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, access_token: accessToken }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: { message?: string } }).error?.message || `HTTP ${res.status}`);
        }
        posted.push(platform);
      } else if (platform === 'instagram') {
        if (!igAccountId) {
          throw new Error('INSTAGRAM_BUSINESS_ACCOUNT_ID not configured');
        }
        // Step 1: Create media container
        const createRes = await fetch(
          `https://graph.facebook.com/v19.0/${igAccountId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caption: message, media_type: 'TEXT', access_token: accessToken }),
          },
        );
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error((err as { error?: { message?: string } }).error?.message || `HTTP ${createRes.status}`);
        }
        const { id: creationId } = (await createRes.json()) as { id: string };

        // Step 2: Publish
        const publishRes = await fetch(
          `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
          },
        );
        if (!publishRes.ok) {
          const err = await publishRes.json().catch(() => ({}));
          throw new Error((err as { error?: { message?: string } }).error?.message || `HTTP ${publishRes.status}`);
        }
        posted.push(platform);
      }
    } catch (e) {
      failed.push(platform);
      errors[platform] = e instanceof Error ? e.message : 'Unknown error';
    }
  }

  // Audit log for any successful posts
  if (posted.length > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: auth.userId!,
        action: 'CREATE',
        entityType: 'SocialPost',
        entityId: posted.join(','),
        metadata: { platforms, messagePreview: message.slice(0, 100) },
      },
    }).catch(() => { /* non-fatal */ });
  }

  return NextResponse.json({ posted, failed, errors });
}
