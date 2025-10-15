'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { requestAirdrop } from '@/lib/api/airdrop';
import { ExternalLink } from 'lucide-react';
import { SOLANA_EXPLORER_URL } from '@/lib/config/env';

const airdropSchema = z.object({
  address: z
    .string()
    .min(32, 'Invalid Solana address')
    .max(44, 'Invalid Solana address')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid Solana address format'),
  amount: z
    .number()
    .min(0.001, 'Minimum amount is 0.001 SOL')
    .max(10, 'Maximum amount is 10 SOL'),
});

type AirdropFormData = z.infer<typeof airdropSchema>;

interface AirdropFormProps {
  accessToken: string;
}

export function AirdropForm({ accessToken }: AirdropFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSignature, setLastSignature] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AirdropFormData>({
    resolver: zodResolver(airdropSchema),
    defaultValues: {
      address: '',
      amount: 0.1,
    },
  });

  const onSubmit = async (data: AirdropFormData) => {
    setIsLoading(true);
    setLastSignature(null);

    try {
      const response = await requestAirdrop(
        data.address,
        data.amount,
        accessToken,
      );
      setLastSignature(response.signature);
      toast.success(`Successfully airdropped ${data.amount} SOL!`);
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to process airdrop',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Devnet Airdrop</CardTitle>
          <CardDescription>
            Get test SOL on Solana devnet for development purposes. Maximum 10
            SOL per request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Solana Address</Label>
              <Input
                id="address"
                placeholder="e.g., 9cjSk5dhJpjxgckZ3q2KJqmXr2cCv7XgSm4e4YMrVJ1s"
                {...register('address')}
                aria-invalid={!!errors.address}
                autoComplete="off"
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (SOL)</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                placeholder="0.1"
                {...register('amount', { valueAsNumber: true })}
                aria-invalid={!!errors.amount}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Processing...' : 'Request Airdrop'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {lastSignature && (
        <Card className="border-success/50 bg-success/5">
          <CardHeader>
            <CardTitle className="text-success">Airdrop Successful!</CardTitle>
            <CardDescription>
              Your transaction has been confirmed on Solana devnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Transaction Signature</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted p-3 text-sm font-mono break-all">
                  {lastSignature}
                </code>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${SOLANA_EXPLORER_URL}/tx/${lastSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
