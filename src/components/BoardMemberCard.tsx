'use client';

import React from 'react';
import { Users, Mail } from 'lucide-react';
import SpotlightCard from './SpotlightCard';

interface BoardMember {
  name: string;
  title: string;
  email?: string | null;
  imageUrl?: string | null;
}

interface BoardMemberCardProps {
  member: BoardMember;
}

export function BoardMemberCard({ member }: BoardMemberCardProps) {
  return (
    <SpotlightCard
      className="h-full flex flex-col items-center text-center"
      spotlightColor="rgba(59, 130, 246, 0.15)"
    >
      {/* Photo or Avatar */}
      <div className="relative w-32 h-32 mb-6 rounded-full overflow-hidden border-2 border-primary/30 bg-neutral-800">
        {member.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.imageUrl}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-16 h-16 text-neutral-600" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-xl font-semibold text-white mb-1">
        {member.name}
      </h3>

      {/* Title */}
      <p className="text-primary text-sm font-medium mb-4">
        {member.title}
      </p>

      {/* Email Contact */}
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-primary transition-colors"
        >
          <Mail className="w-4 h-4" />
          Contact
        </a>
      )}
    </SpotlightCard>
  );
}

interface BoardMemberGridProps {
  members: BoardMember[];
}

export function BoardMemberGrid({ members }: BoardMemberGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member, index) => (
        <BoardMemberCard key={`${member.name}-${index}`} member={member} />
      ))}
    </div>
  );
}

export default BoardMemberCard;
