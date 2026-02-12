/**
 * Admin Communications Page
 *
 * Communications panel embedded within the admin dashboard.
 * Auth is handled by the admin layout's requireAdmin() check.
 */

import type { Metadata } from 'next';
import { CommunicationsPanel } from './communications-panel';

export const metadata: Metadata = {
  title: 'Communications | Admin | SPAC',
  description: 'Send emails, manage templates, and organize member groups',
};

export const dynamic = 'force-dynamic';

export default function AdminCommunicationsPage() {
  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CommunicationsPanel />
      </div>
    </div>
  );
}
