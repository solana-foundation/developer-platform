'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface QuickActionsProps {
  onCreateClick?: () => void;
}

export function QuickActions({ onCreateClick }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onCreateClick}
        className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono gap-2"
      >
        <Plus className="w-4 h-4" />
        New Program
      </Button>
    </div>
  );
}
