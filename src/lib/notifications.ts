/**
 * Notification Helpers
 *
 * Create in-app notifications for various system events.
 */

import { prisma } from '@/lib/db';
import type { NotificationType } from '@prisma/client';

interface CreateNotificationOpts {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(opts: CreateNotificationOpts) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link,
      metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
    },
  });
}

export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  conversationId: string,
  preview: string,
) {
  return createNotification({
    userId: recipientId,
    type: 'MESSAGE',
    title: `New message from ${senderName}`,
    body: preview.length > 100 ? preview.slice(0, 100) + '...' : preview,
    link: `/messages?c=${conversationId}`,
  });
}

export async function notifyOfferReceived(
  sellerId: string,
  buyerName: string,
  listingTitle: string,
  amount: string,
  offerId: string,
) {
  return createNotification({
    userId: sellerId,
    type: 'OFFER_RECEIVED',
    title: `New offer on "${listingTitle}"`,
    body: `${buyerName} offered $${amount}`,
    link: `/my-offers?offer=${offerId}`,
  });
}

export async function notifyOfferResponse(
  buyerId: string,
  status: 'ACCEPTED' | 'REJECTED',
  listingTitle: string,
  listingSlug: string,
) {
  return createNotification({
    userId: buyerId,
    type: status === 'ACCEPTED' ? 'OFFER_ACCEPTED' : 'OFFER_REJECTED',
    title: `Offer ${status.toLowerCase()} on "${listingTitle}"`,
    body: status === 'ACCEPTED'
      ? 'Your offer was accepted! Contact the seller to arrange the transaction.'
      : 'Your offer was not accepted. You can submit a new offer.',
    link: `/classifieds/${listingSlug}`,
  });
}

export async function notifyListingStatus(
  sellerId: string,
  status: 'APPROVED' | 'REJECTED',
  listingTitle: string,
  listingSlug: string,
) {
  return createNotification({
    userId: sellerId,
    type: status === 'APPROVED' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
    title: `Listing ${status.toLowerCase()}: "${listingTitle}"`,
    body: status === 'APPROVED'
      ? 'Your listing is now live on the classifieds.'
      : 'Your listing was not approved. Please review and resubmit.',
    link: status === 'APPROVED' ? `/classifieds/${listingSlug}` : '/my-listings',
  });
}

export async function notifyAdminAnnouncement(
  userIds: string[],
  title: string,
  body: string,
  link?: string,
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: 'ADMIN_ANNOUNCEMENT' as NotificationType,
      title,
      body,
      link,
    })),
  });
}
