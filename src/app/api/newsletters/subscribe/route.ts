/**
 * Newsletter Subscription API
 *
 * POST /api/newsletters/subscribe
 * Subscribe an email to the newsletter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 400 }
        );
      }

      // Reactivate unsubscribed user
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'ACTIVE', updatedAt: new Date() },
      });

      return NextResponse.json({ message: 'Welcome back! Your subscription has been reactivated.' });
    }

    // Create new subscriber
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        status: 'ACTIVE',
        source: 'website_footer',
      },
    });

    return NextResponse.json({ message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
