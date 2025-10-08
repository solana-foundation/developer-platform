'use client';

import { Button } from '@/components/ui/button';
import { Rocket, Plus, Upload } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" className="font-mono gap-2 bg-transparent">
        <Upload className="w-4 h-4" />
        Import Program
      </Button>
      <Button variant="outline" className="font-mono gap-2 bg-transparent">
        <Plus className="w-4 h-4" />
        New Program
      </Button>
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono gap-2">
        <Rocket className="w-4 h-4" />
        Deploy
      </Button>
    </div>
  );
}
