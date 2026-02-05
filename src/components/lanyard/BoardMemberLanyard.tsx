'use client';

/**
 * Board Member Lanyard Component
 *
 * Displays a board member's info with an interactive 3D lanyard.
 */

import dynamic from 'next/dynamic';
import { Mail, User } from 'lucide-react';
import './Lanyard.css';

// Dynamically import Lanyard to avoid SSR issues with Three.js
const Lanyard = dynamic(() => import('./Lanyard'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
      <div className="animate-pulse text-muted-foreground">Loading 3D...</div>
    </div>
  ),
});

interface BoardMember {
  name: string;
  title: string;
  email?: string;
  imageUrl?: string | null;
}

interface BoardMemberLanyardProps {
  member: BoardMember;
}

export function BoardMemberLanyard({ member }: BoardMemberLanyardProps) {
  return (
    <div className="board-member-lanyard group">
      <div className="relative h-[400px] rounded-lg overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-950/80 border border-border">
        <Lanyard
          memberName={member.name}
          memberTitle={member.title}
          memberImage={member.imageUrl || undefined}
        />

        {/* Member info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-white">{member.title}</h3>
          </div>
          <p className="text-sm text-slate-300 mb-2">{member.name}</p>
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Mail className="h-3 w-3" />
              Contact
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface BoardMemberGridProps {
  members: BoardMember[];
}

export function BoardMemberGrid({ members }: BoardMemberGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <BoardMemberLanyard key={member.title} member={member} />
      ))}
    </div>
  );
}

export default BoardMemberLanyard;
