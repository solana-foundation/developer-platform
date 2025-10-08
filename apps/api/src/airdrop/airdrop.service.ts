import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { AirdropResponseDto, CreateAirdropDto } from './airdrop.dto';
import { AirdropsRepository } from './repositories/airdrops.repository';
import {
  address,
  createSolanaClient,
  createKeyPairSignerFromBytes,
  LAMPORTS_PER_SOL,
  lamports,
  createTransaction,
} from 'gill';
import { getTransferSolInstruction } from '@solana-program/system';
import { randomUUID } from 'crypto';

export interface AirdropRateLimitInfo {
  allowed: boolean;
  dailyVolumeUsed: number;
  dailyVolumeLimit: number;
  dailyRequestsUsed: number;
  dailyRequestsLimit: number;
  requestedAmount: number;
  maxAmountPerRequest: number;
}

@Injectable()
export class AirdropService {
  private client: ReturnType<typeof createSolanaClient>;
  private payer: Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>;
  private initPromise: Promise<void>;

  // Rate limit configuration (read from env or use defaults)
  private readonly DAILY_VOLUME_LIMIT: number;
  private readonly DAILY_REQUEST_LIMIT: number;
  private readonly MAX_AMOUNT_PER_REQUEST: number;
  private readonly USAGE_TTL = 90 * 24 * 60 * 60; // 90 days

  constructor(
    private storageService: StorageService,
    private airdropsRepository: AirdropsRepository,
  ) {
    const rpcUrl = process.env.RPC_URL;
    const keypairSecret = process.env.KEYPAIR;

    if (!rpcUrl || !keypairSecret) {
      throw new Error('RPC_URL and KEYPAIR environment variables must be set');
    }

    // Load rate limits from environment variables
    this.DAILY_VOLUME_LIMIT = parseFloat(
      process.env.AIRDROP_DAILY_VOLUME_LIMIT || '10',
    );
    this.DAILY_REQUEST_LIMIT = parseInt(
      process.env.AIRDROP_DAILY_REQUEST_LIMIT || '50',
      10,
    );
    this.MAX_AMOUNT_PER_REQUEST = parseFloat(
      process.env.AIRDROP_MAX_AMOUNT_PER_REQUEST || '1',
    );

    this.client = createSolanaClient({ urlOrMoniker: rpcUrl });
    this.initPromise = this.initialize(keypairSecret);
  }

  private async initialize(keypairSecret: string) {
    this.payer = await createKeyPairSignerFromBytes(
      new Uint8Array(JSON.parse(keypairSecret)),
    );
  }

  async createAirdrop(
    userId: string,
    createAirdropDto: CreateAirdropDto,
    apiKey?: string,
  ): Promise<AirdropResponseDto> {
    await this.initPromise;

    const { address: recipientAddress, amount } = createAirdropDto;

    // Check rate limits before processing (Redis-only, fast)
    const rateLimitInfo = await this.checkAirdropRateLimit(userId, amount);
    if (!rateLimitInfo.allowed) {
      let errorMessage = 'Airdrop rate limit exceeded. ';

      if (amount > rateLimitInfo.maxAmountPerRequest) {
        errorMessage += `Maximum ${rateLimitInfo.maxAmountPerRequest} SOL per request. `;
      } else if (
        rateLimitInfo.dailyRequestsUsed >= rateLimitInfo.dailyRequestsLimit
      ) {
        errorMessage += `Daily request limit of ${rateLimitInfo.dailyRequestsLimit} reached. `;
      } else if (
        rateLimitInfo.dailyVolumeUsed + amount >
        rateLimitInfo.dailyVolumeLimit
      ) {
        const remaining =
          rateLimitInfo.dailyVolumeLimit - rateLimitInfo.dailyVolumeUsed;
        errorMessage += `Daily volume limit exceeded. ${remaining.toFixed(2)} SOL remaining today. `;
      }

      throw new HttpException(
        {
          message: errorMessage.trim(),
          rateLimitInfo,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      const { sendAndConfirmTransaction } = this.client;

      const transferInstruction = getTransferSolInstruction({
        source: this.payer,
        destination: address(recipientAddress),
        amount: lamports(BigInt(createAirdropDto.amount * LAMPORTS_PER_SOL)),
      });

      const transactionInput = createTransaction({
        feePayer: this.payer,
        instructions: [transferInstruction],
      });

      const signature = await sendAndConfirmTransaction(transactionInput);
      const transaction = await this.client.rpc
        .getTransaction(signature)
        .send();
      // TODO: Handle case where transaction is not found aka retries
      const slot = transaction?.slot ?? BigInt(0);

      const airdropId = randomUUID();
      const response = new AirdropResponseDto(signature, Number(slot));

      // PostgreSQL: Fire-and-forget write for permanent audit trail
      this.airdropsRepository
        .create({
          userId,
          signature,
          slot: Number(slot),
          recipient: recipientAddress,
          amount: createAirdropDto.amount,
          status: 'confirmed',
        })
        .catch((err) =>
          console.error(
            '[AirdropService] Failed to store airdrop in PostgreSQL:',
            err,
          ),
        );

      // Store in Redis cache with 24 hour TTL (86400 seconds)
      const ttl = parseInt(process.env.AIRDROP_TTL || '86400');
      await this.storageService.set(
        `airdrop:${airdropId}`,
        JSON.stringify(response),
        ttl,
      );

      // Track usage in Redis (fire-and-forget, non-blocking)
      this.trackAirdropUsage(userId, amount, apiKey).catch((err) =>
        console.error('[AirdropService] Failed to track airdrop usage:', err),
      );

      return response;
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('[AirdropService] Airdrop failed:', {
        error,
        recipient: recipientAddress,
        amount,
        userId,
      });

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to airdrop ${amount} SOL: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAirdrop(id: string): Promise<AirdropResponseDto | null> {
    const airdropJson = await this.storageService.get(`airdrop:${id}`);
    if (!airdropJson) return null;

    const airdrop = JSON.parse(airdropJson) as AirdropResponseDto;
    return airdrop;
  }

  /**
   * Check if user has exceeded airdrop rate limits
   * Redis-only: Fast lookup, no database hit
   */
  async checkAirdropRateLimit(
    userId: string,
    requestedAmount: number,
  ): Promise<AirdropRateLimitInfo> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check per-request maximum first
    if (requestedAmount > this.MAX_AMOUNT_PER_REQUEST) {
      return {
        allowed: false,
        dailyVolumeUsed: 0,
        dailyVolumeLimit: this.DAILY_VOLUME_LIMIT,
        dailyRequestsUsed: 0,
        dailyRequestsLimit: this.DAILY_REQUEST_LIMIT,
        requestedAmount,
        maxAmountPerRequest: this.MAX_AMOUNT_PER_REQUEST,
      };
    }

    // Get today's usage from Redis
    const dailyKey = `airdrop_user:${userId}:${today}`;
    const dailyUsage = await this.storageService.hgetall(dailyKey);

    const dailyRequestsUsed = parseInt(dailyUsage.count || '0', 10);
    const dailyVolumeUsed = parseFloat(dailyUsage.volume || '0');

    // Check daily request limit
    if (dailyRequestsUsed >= this.DAILY_REQUEST_LIMIT) {
      return {
        allowed: false,
        dailyVolumeUsed,
        dailyVolumeLimit: this.DAILY_VOLUME_LIMIT,
        dailyRequestsUsed,
        dailyRequestsLimit: this.DAILY_REQUEST_LIMIT,
        requestedAmount,
        maxAmountPerRequest: this.MAX_AMOUNT_PER_REQUEST,
      };
    }

    // Check daily volume limit
    if (dailyVolumeUsed + requestedAmount > this.DAILY_VOLUME_LIMIT) {
      return {
        allowed: false,
        dailyVolumeUsed,
        dailyVolumeLimit: this.DAILY_VOLUME_LIMIT,
        dailyRequestsUsed,
        dailyRequestsLimit: this.DAILY_REQUEST_LIMIT,
        requestedAmount,
        maxAmountPerRequest: this.MAX_AMOUNT_PER_REQUEST,
      };
    }

    // All checks passed
    return {
      allowed: true,
      dailyVolumeUsed,
      dailyVolumeLimit: this.DAILY_VOLUME_LIMIT,
      dailyRequestsUsed,
      dailyRequestsLimit: this.DAILY_REQUEST_LIMIT,
      requestedAmount,
      maxAmountPerRequest: this.MAX_AMOUNT_PER_REQUEST,
    };
  }

  /**
   * Track airdrop usage in Redis (hot path, fire-and-forget)
   * Runs asynchronously after successful airdrop
   */
  async trackAirdropUsage(
    userId: string,
    amount: number,
    apiKey?: string,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date().toISOString();

    try {
      // Track user cumulative totals
      const totalKey = `airdrop_user:${userId}:total`;
      await this.storageService.hincrby(totalKey, 'count', 1);
      await this.storageService.hincrbyfloat(totalKey, 'volume', amount);
      await this.storageService.hset(totalKey, 'last_used', now);
      await this.storageService.expire(totalKey, this.USAGE_TTL);

      // Track user daily usage
      const dailyKey = `airdrop_user:${userId}:${today}`;
      await this.storageService.hincrby(dailyKey, 'count', 1);
      await this.storageService.hincrbyfloat(dailyKey, 'volume', amount);
      await this.storageService.hset(dailyKey, 'last_used', now);
      await this.storageService.expire(dailyKey, this.USAGE_TTL);

      // Track API key usage if provided
      if (apiKey) {
        const keyTotalKey = `airdrop_key:${apiKey}:total`;
        await this.storageService.hincrby(keyTotalKey, 'count', 1);
        await this.storageService.hincrbyfloat(keyTotalKey, 'volume', amount);
        await this.storageService.hset(keyTotalKey, 'last_used', now);
        await this.storageService.expire(keyTotalKey, this.USAGE_TTL);

        const keyDailyKey = `airdrop_key:${apiKey}:${today}`;
        await this.storageService.hincrby(keyDailyKey, 'count', 1);
        await this.storageService.hincrbyfloat(keyDailyKey, 'volume', amount);
        await this.storageService.hset(keyDailyKey, 'last_used', now);
        await this.storageService.expire(keyDailyKey, this.USAGE_TTL);
      }
    } catch (error) {
      // Fire-and-forget: log but don't throw
      console.error('[AirdropService] Failed to track usage:', error);
    }
  }

  /**
   * Get usage statistics for a user from Redis (real-time)
   */
  async getUserUsageStats(userId: string): Promise<{
    today: { count: number; volume: number };
    total: { count: number; volume: number };
    limits: {
      dailyVolume: number;
      dailyRequests: number;
      maxPerRequest: number;
    };
  }> {
    const today = new Date().toISOString().split('T')[0];

    // Get today's usage
    const dailyKey = `airdrop_user:${userId}:${today}`;
    const dailyUsage = await this.storageService.hgetall(dailyKey);

    // Get cumulative usage
    const totalKey = `airdrop_user:${userId}:total`;
    const totalUsage = await this.storageService.hgetall(totalKey);

    return {
      today: {
        count: parseInt(dailyUsage.count || '0', 10),
        volume: parseFloat(dailyUsage.volume || '0'),
      },
      total: {
        count: parseInt(totalUsage.count || '0', 10),
        volume: parseFloat(totalUsage.volume || '0'),
      },
      limits: {
        dailyVolume: this.DAILY_VOLUME_LIMIT,
        dailyRequests: this.DAILY_REQUEST_LIMIT,
        maxPerRequest: this.MAX_AMOUNT_PER_REQUEST,
      },
    };
  }
}
