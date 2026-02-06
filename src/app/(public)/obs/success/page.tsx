/**
 * OBS Registration Success Page
 *
 * Displayed after successful payment for OBS registration.
 * Payment capture happens via /api/obs/capture before redirecting here.
 */

import { Metadata } from 'next';

export const dynamic = 'force-static';
import Link from 'next/link';
import { CheckCircle, Calendar, Mail, ArrowRight, Home, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Registration Complete | OBS',
  description: 'Your Orange Blossom Special registration is confirmed.',
};

interface Props {
  searchParams: Promise<{
    registration_id?: string;
  }>;
}

export default async function OBSSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const { registration_id } = params;

  let registration = null;
  let obsConfig = null;

  if (registration_id) {
    registration = await prisma.oBSRegistration.findUnique({
      where: { id: registration_id },
      include: { obsConfig: true },
    });
    
    obsConfig = registration?.obsConfig;
  }

  // If no registration found or payment not completed
  if (!registration || registration.paymentStatus !== 'PAID') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/20 rounded-full mb-4">
              <AlertCircle className="w-12 h-12 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Registration Pending
            </h1>
            <p className="text-slate-400">
              We couldn&apos;t verify your registration. If you completed payment,
              please check your email for confirmation or contact support.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/obs"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Registration Complete!
          </h1>
          <p className="text-slate-400">
            You&apos;re all set for the Orange Blossom Special
          </p>
        </div>

        {/* Registration Details */}
        {registration && obsConfig && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-white mb-4">Registration Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Event</span>
                <span className="text-white font-medium">{obsConfig.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Name</span>
                <span className="text-white">{registration.firstName} {registration.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email</span>
                <span className="text-white">{registration.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type</span>
                <span className="text-white capitalize">{registration.registrationType.toLowerCase()}</span>
              </div>
              {registration.campingRequested && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Camping</span>
                  <span className="text-green-400">Included</span>
                </div>
              )}
              {registration.mealRequested && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Meals</span>
                  <span className="text-green-400">Included</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid</span>
                  <span className="text-amber-400 font-semibold">
                    ${Number(registration.amountPaid).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">What&apos;s Next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Check Your Email</p>
                <p className="text-sm text-slate-400">
                  You&apos;ll receive a confirmation email with event details and directions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Add to Calendar</p>
                <p className="text-sm text-slate-400">
                  Mark your calendar! More details will be sent closer to the event.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          <Link
            href="/events"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-lg transition-colors"
          >
            View All Events
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
