/**
 * Club Documents Management Page
 *
 * Manage bylaws, policies, newsletters, and other club documents.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import DocumentsClient from './documents-client';

export const metadata: Metadata = {
  title: 'Club Documents | SPAC Leadership',
  description: 'Manage SPAC club documents, bylaws, and newsletters.',
};

async function getDocuments() {
  return prisma.clubDocument.findMany({
    orderBy: [{ category: 'asc' }, { year: 'desc' }, { createdAt: 'desc' }],
  });
}

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const documents = await getDocuments();

  // Group by category (serialize dates for client component)
  const serialized = documents.map(doc => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));
  const documentsByCategory = serialized.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof serialized>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          href="/leadership"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leadership
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <FolderOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Club Documents</h1>
        </div>
        <p className="text-slate-400 mb-8">
          {documents.length} document{documents.length !== 1 ? 's' : ''} in the library
        </p>

        <DocumentsClient 
          documentsByCategory={documentsByCategory} 
          isAdmin={session.user.role === 'ADMIN'} 
        />
      </div>
    </div>
  );
}
