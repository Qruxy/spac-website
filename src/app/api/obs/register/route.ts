/**
 * OBS Registration API
 *
 * POST endpoint to create OBS registration and PayPal order.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPayPalOrder } from '@/lib/paypal';
import { rateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

// Zod schema for OBS registration validation
const obsRegistrationSchema = z.object({
  obsConfigId: z.string().min(1, 'OBS config ID is required'),
  registrationType: z.enum(['ATTENDEE', 'SPEAKER', 'VENDOR', 'STAFF', 'VOLUNTEER']).default('ATTENDEE'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .transform(v => v.trim()),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long')
    .transform(v => v.trim()),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .transform(v => v.trim()),
  phone: z.string().max(20).optional().transform(v => v?.trim() || null),
  campingRequested: z.boolean().optional().default(false),
  mealRequested: z.boolean().optional().default(false),
  tShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']).optional(),
  dietaryRestrictions: z.string().max(500).optional().transform(v => v?.trim() || null),
  notes: z.string().max(1000).optional().transform(v => v?.trim() || null),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = getRateLimitKey('obs_register', ip);
    
    if (!rateLimit(key, RATE_LIMITS.API_WRITE.limit, RATE_LIMITS.API_WRITE.windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const session = await getSession();
    const body = await request.json();

    // Validate with Zod
    const parseResult = obsRegistrationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const {
      obsConfigId,
      registrationType,
      firstName,
      lastName,
      email,
      phone,
      campingRequested,
      mealRequested,
      tShirtSize,
      dietaryRestrictions,
      notes,
    } = parseResult.data;

    // Get OBS config
    const obsConfig = await prisma.oBSConfig.findUnique({
      where: { id: obsConfigId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!obsConfig) {
      return NextResponse.json(
        { error: 'OBS event not found' },
        { status: 404 }
      );
    }

    if (!obsConfig.isActive) {
      return NextResponse.json(
        { error: 'This OBS event is not currently active' },
        { status: 400 }
      );
    }

    // Check registration window
    const now = new Date();
    if (now < new Date(obsConfig.registrationOpens)) {
      return NextResponse.json(
        { error: 'Registration has not opened yet' },
        { status: 400 }
      );
    }

    if (now > new Date(obsConfig.registrationCloses)) {
      return NextResponse.json(
        { error: 'Registration has closed' },
        { status: 400 }
      );
    }

    // Fast-path pre-check (non-transactional, avoids lock overhead in the common case)
    if (obsConfig._count.registrations >= obsConfig.capacity) {
      return NextResponse.json(
        { error: 'This event is at full capacity' },
        { status: 400 }
      );
    }

    // Check for existing registration with same email for this event
    const existingRegistration = await prisma.oBSRegistration.findFirst({
      where: {
        obsConfigId,
        email: email.toLowerCase(),
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You have already registered for this event' },
        { status: 400 }
      );
    }

    // Determine if user is a member
    let isMember = false;
    let userId: string | undefined;

    if (session?.user?.id) {
      userId = session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { membership: true },
      });
      isMember = user?.membership?.status === 'ACTIVE';
    }

    // Calculate pricing
    const isEarlyBird = obsConfig.earlyBirdDeadline
      ? now < new Date(obsConfig.earlyBirdDeadline)
      : false;

    const basePrice = isMember
      ? Number(obsConfig.memberPrice)
      : Number(obsConfig.nonMemberPrice);
    const discount = isEarlyBird ? Number(obsConfig.earlyBirdDiscount) : 0;
    const registrationPrice = Math.max(0, basePrice - discount);
    const campingTotal = campingRequested ? Number(obsConfig.campingPrice) : 0;
    const mealTotal = mealRequested ? Number(obsConfig.mealPrice) : 0;
    const totalAmount = registrationPrice + campingTotal + mealTotal;

    // Atomically re-check capacity and create registration inside a transaction.
    // Lock the obs_config row (SELECT FOR UPDATE) so concurrent requests queue up
    // rather than racing past the capacity check simultaneously.
    let registration: Awaited<ReturnType<typeof prisma.oBSRegistration.create>>;
    try {
      registration = await prisma.$transaction(async (tx) => {
        // Lock obs_config row and get fresh count
        await tx.$queryRaw`SELECT id FROM obs_configs WHERE id = ${obsConfigId} FOR UPDATE`;
        const count = await tx.oBSRegistration.count({
          where: { obsConfigId },
        });
        if (count >= obsConfig.capacity) {
          throw Object.assign(new Error('AT_CAPACITY'), { code: 'AT_CAPACITY' });
        }
        return tx.oBSRegistration.create({
          data: {
            obsConfigId,
            registrationType,
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: phone || null,
            isMember,
            userId: userId || null,
            campingRequested,
            mealRequested,
            dietaryRestrictions: dietaryRestrictions || null,
            tShirtSize: tShirtSize || null,
            notes: notes || null,
            amountPaid: 0,
            paymentStatus: 'PENDING',
          },
        });
      });
    } catch (txErr) {
      if ((txErr as { code?: string }).code === 'AT_CAPACITY') {
        return NextResponse.json(
          { error: 'This event is at full capacity' },
          { status: 400 }
        );
      }
      throw txErr;
    }

    // If free registration, mark as paid immediately
    if (totalAmount === 0) {
      await prisma.oBSRegistration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: 'PAID',
          paymentDate: new Date(),
          amountPaid: 0,
        },
      });

      return NextResponse.json({
        success: true,
        registrationId: registration.id,
        message: 'Registration complete!',
      });
    }

    // Build description for PayPal
    const descriptionParts = [`${obsConfig.eventName} Registration`];
    if (isMember) descriptionParts.push('(Member)');
    if (isEarlyBird) descriptionParts.push('- Early Bird');
    if (campingRequested) descriptionParts.push('+ Camping');
    if (mealRequested) descriptionParts.push('+ Meals');

    // Create PayPal order
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const order = await createPayPalOrder({
      amount: totalAmount,
      description: descriptionParts.join(' '),
      returnUrl: `${baseUrl}/api/obs/capture?registration_id=${registration.id}`,
      cancelUrl: `${baseUrl}/obs?canceled=true`,
      metadata: {
        type: 'obs_registration',
        obsConfigId,
        registrationId: registration.id,
        userId: userId || '',
      },
    });

    // Find the approval URL
    const approvalLink = order.links.find(link => link.rel === 'approve');

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      checkoutUrl: approvalLink?.href,
      orderId: order.id,
    });
  } catch (error) {
    console.error('OBS registration error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration' },
      { status: 500 }
    );
  }
}
