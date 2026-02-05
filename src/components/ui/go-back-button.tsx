'use client';

import { ArrowLeft } from 'lucide-react';

interface GoBackButtonProps {
  className?: string;
}

export function GoBackButton({ className }: GoBackButtonProps) {
  return (
    <button
      onClick={() => window.history.back()}
      className={className ?? "inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors"}
    >
      <ArrowLeft className="h-4 w-4" />
      Go Back
    </button>
  );
}
