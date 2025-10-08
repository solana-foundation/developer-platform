'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createProgram } from '@/lib/api/programs';
import type { CreateProgramRequest } from '@/lib/types/program';

interface CreateProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProgramDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProgramDialogProps) {
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateProgramRequest>({
    name: '',
    description: '',
    programAddress: '',
    cluster: 'devnet',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.accessToken) {
      toast.error('You must be logged in to create a program');
      return;
    }

    if (!formData.name || !formData.programAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      await createProgram(formData, session.accessToken);
      toast.success(`Program "${formData.name}" created successfully!`);

      // Reset form
      setFormData({
        name: '',
        description: '',
        programAddress: '',
        cluster: 'devnet',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create program';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-mono">Create New Program</DialogTitle>
            <DialogDescription>
              Register a new Solana program deployment for tracking and
              management.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Program Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="my-solana-program"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="programAddress">
                Program Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="programAddress"
                placeholder="11111111111111111111111111111111"
                value={formData.programAddress}
                onChange={(e) =>
                  setFormData({ ...formData, programAddress: e.target.value })
                }
                required
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                The deployed program's public key on Solana
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cluster">Cluster</Label>
              <Select
                value={formData.cluster}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    cluster: value as 'devnet' | 'testnet' | 'mainnet-beta',
                  })
                }
              >
                <SelectTrigger id="cluster" className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devnet" className="font-mono">
                    Devnet
                  </SelectItem>
                  <SelectItem value="testnet" className="font-mono">
                    Testnet
                  </SelectItem>
                  <SelectItem value="mainnet-beta" className="font-mono">
                    Mainnet Beta
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what your program does..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating} className="font-mono">
              {isCreating ? 'Creating...' : 'Create Program'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
