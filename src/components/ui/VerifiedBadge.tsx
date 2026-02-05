/**
 * Verified Badge Component
 *
 * Displays a shield icon badge next to validated users' names.
 * Shown for Admins and users with isValidated=true.
 */

import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  isAdmin?: boolean;
  isValidated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function VerifiedBadge({
  isAdmin = false,
  isValidated = false,
  size = 'sm',
  showTooltip = true,
  className = '',
}: VerifiedBadgeProps) {
  // Only show badge for admins or validated users
  if (!isAdmin && !isValidated) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const label = isAdmin ? 'Admin' : 'Verified Member';
  const colorClass = isAdmin
    ? 'text-amber-500'
    : 'text-blue-500';

  return (
    <span
      className={`inline-flex items-center ${className}`}
      title={showTooltip ? label : undefined}
      aria-label={label}
    >
      <ShieldCheck
        className={`${sizeClasses[size]} ${colorClass}`}
        aria-hidden="true"
      />
    </span>
  );
}
