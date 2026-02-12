/**
 * Notifications Page
 *
 * Full-page view of all user notifications with filtering and pagination.
 */

import { Metadata } from 'next';
import NotificationsClient from './notifications-client';

export const metadata: Metadata = {
  title: 'Notifications | SPAC',
  description: 'View and manage your SPAC notifications',
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
