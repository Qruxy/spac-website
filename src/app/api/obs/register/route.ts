/**
 * OBS Registration API
 *
 * POST endpoint to create OBS registration and PayPal order.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPayPalOrder } from '@/lib/paypal';

interface RegistrationPayload {
  obsConfigId: string;
  registrationType: 'ATTENDEE' | 'SPEAKER' | 'VENDOR' | 'STAFF' | 'VOLUNTEER';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  campingRequested?: boolean;
  mealRequested?: boolean;
  tShirtSize?: string;
  dietaryRestrictions?: string;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = (await request.json()) as RegistrationPayload;

    const {
      obsConfigId,
      registrationType,
      firstName,
      lastName,
      email,
      phone,
      campingRequested = false,
      mealRequested = false,
      tShirtSize,
      dietaryRestrictions,
      notes,
    } = body;

    // Validate required fields
    if (!obsConfigId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Check capacity
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

    // Create registration with PENDING status
    const registration = await prisma.oBSRegistration.create({
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
