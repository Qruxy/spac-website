/**
 * Messages Page
 *
 * Dashboard page for viewing and managing conversations.
 */

import type { Metadata } from 'next';
import { MessagesClient } from './messages-client';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'View and manage your messages',
};

export default function MessagesPage() {
  return <MessagesClient />;
}
