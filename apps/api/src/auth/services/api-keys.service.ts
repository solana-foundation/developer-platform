import { Injectable, UnauthorizedException } from '@nestjs/common';
import { StorageService } from '../../storage/storage.service';
import { ApiKeysRepository } from '../repositories/api-keys.repository';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface ApiKeyMetadata {
  key: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

export interface ApiKeyUsageStats {
  totalRequests: number;
  lastUsed: string | null;
  requestsByEndpoint: Record<string, number>;
}

export interface ApiKeyWithUsage {
  id: string;
  keyPreview: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  totalRequests: number;
}

/**
 * ApiKeysService - Redis-first API key management
 *
 * Performance Strategy:
 * - ALL hot paths (validation, usage tracking, rate limiting) use Redis ONLY
 * - PostgreSQL is used for:
 *   1. Audit trail (write-only, fire-and-forget with .catch())
 *   2. Async aggregation (background jobs, not in request path)
 *   3. Long-term analytics (optional, doesn't block operations)
 *
 * Redis Schema:
 * - api_key:{key} → userId (string, 30d TTL)
 * - api_key_meta:{key} → JSON {name, createdAt, expiresAt} (30d TTL)
 * - user_api_keys:{userId} → JSON array of keys (30d TTL)
 * - api_key_usage:{key}:total → hash {requests, last_used} (90d TTL, cumulative)
 * - api_key_usage:{key}:{YYYY-MM-DD} → hash {requests, endpoint:*} (90d TTL, daily)
 * - api_key_rate:{key}:{hour} → counter (1h TTL)
 */
@Injectable()
export class ApiKeysService {
  private readonly API_KEY_TTL = 30 * 24 * 60 * 60; // 30 days
  private readonly USAGE_TTL = 90 * 24 * 60 * 60; // 90 days

  constructor(
    private storageService: StorageService,
    private apiKeysRepository: ApiKeysRepository,
  ) {}

  /**
   * Generate a new API key for a user
   * Redis-first: All data stored in Redis immediately, PostgreSQL is fire-and-forget
   */
  async generateApiKey(
    userId: string,
    name: string = 'API Key',
  ): Promise<string> {
    // Generate a random API key with sk_ prefix
    const apiKey = `sk_${uuidv4().replace(/-/g, '')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.API_KEY_TTL * 1000);

    // Store in Redis for fast lookup (primary storage)
    await this.storageService.set(
      `api_key:${apiKey}`,
      userId,
      this.API_KEY_TTL,
    );

    // Store metadata in Redis
    const metadata: ApiKeyMetadata = {
      key: apiKey,
      name,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    await this.storageService.set(
      `api_key_meta:${apiKey}`,
      JSON.stringify(metadata),
      this.API_KEY_TTL,
    );

    // Add to user's key list
    const userKeysKey = `user_api_keys:${userId}`;
    const existingKeys = await this.storageService.get(userKeysKey);
    const keyList: string[] = existingKeys
      ? (JSON.parse(existingKeys) as string[])
      : [];
    keyList.push(apiKey);
    await this.storageService.set(
      userKeysKey,
      JSON.stringify(keyList),
      this.API_KEY_TTL,
    );

    // Initialize usage counters in Redis
    const usageTotalKey = `api_key_usage:${apiKey}:total`;
    await this.storageService.hset(usageTotalKey, 'requests', '0');
    await this.storageService.hset(usageTotalKey, 'created', now.toISOString());
    await this.storageService.expire(usageTotalKey, this.USAGE_TTL);

    // PostgreSQL: Fire-and-forget audit trail (doesn't block response)
    const keyHash = await bcrypt.hash(apiKey, 10);
    this.apiKeysRepository
      .create({
        userId,
        keyHash,
        name,
        expiresAt,
      })
      .catch((err) =>
        console.error(
          '[ApiKeysService] Failed to store key in PostgreSQL:',
          err,
        ),
      );

    // Return the plaintext key (only time it's ever shown)
    return apiKey;
  }

  /**
   * Validate an API key and return the associated user ID
   * Redis-only: Fast lookup, no database hit
   */
  async validateApiKey(apiKey: string): Promise<string | null> {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return null;
    }

    // Redis-only lookup - no PostgreSQL involved
    const userId = await this.storageService.get(`api_key:${apiKey}`);
    return userId;
  }

  /**
   * Track usage of an API key (called on each request)
   * Redis-only: Fast increment operations, no blocking
   *
   * This runs on EVERY API request, so it MUST be fast:
   * - Uses Redis hash increments (O(1) operations)
   * - No PostgreSQL writes in request path
   * - Background jobs can aggregate to PostgreSQL later
   */
  async trackUsage(apiKey: string, endpoint: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date().toISOString();

    // Track cumulative totals (never expires until key expires)
    const totalKey = `api_key_usage:${apiKey}:total`;
    await this.storageService.hincrby(totalKey, 'requests', 1);
    await this.storageService.hset(totalKey, 'last_used', now);
    await this.storageService.expire(totalKey, this.USAGE_TTL);

    // Track daily usage with per-endpoint breakdown
    const dailyKey = `api_key_usage:${apiKey}:${today}`;
    await this.storageService.hincrby(dailyKey, 'requests', 1);
    await this.storageService.hset(dailyKey, 'last_used', now);

    // Track per-endpoint usage for this day
    const endpointField = `endpoint:${endpoint}`;
    await this.storageService.hincrby(dailyKey, endpointField, 1);

    // Set TTL for historical data (90 days)
    await this.storageService.expire(dailyKey, this.USAGE_TTL);

    // Note: No PostgreSQL writes here - background job aggregates daily
  }

  /**
   * Get usage statistics for an API key
   * Redis-only: Read from cumulative totals (fast)
   */
  async getUsageStats(apiKey: string): Promise<ApiKeyUsageStats> {
    // Get cumulative stats from total key
    const totalKey = `api_key_usage:${apiKey}:total`;
    const totalUsage = await this.storageService.hgetall(totalKey);

    const totalRequests = parseInt(totalUsage.requests || '0', 10);
    const lastUsed = totalUsage.last_used || null;

    // Get today's endpoint breakdown
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `api_key_usage:${apiKey}:${today}`;
    const dailyUsage = await this.storageService.hgetall(dailyKey);

    // Extract endpoint stats from today
    const requestsByEndpoint: Record<string, number> = {};
    for (const [key, value] of Object.entries(dailyUsage)) {
      if (key.startsWith('endpoint:')) {
        const endpoint = key.replace('endpoint:', '');
        requestsByEndpoint[endpoint] = parseInt(value, 10);
      }
    }

    return {
      totalRequests,
      lastUsed,
      requestsByEndpoint,
    };
  }

  /**
   * List all API keys for a user with usage statistics
   * Redis-only: Fast reads from cached data
   */
  async listUserApiKeys(userId: string): Promise<ApiKeyWithUsage[]> {
    // Get keys from Redis
    const userKeysKey = `user_api_keys:${userId}`;
    const keysData = await this.storageService.get(userKeysKey);
    const keyList: string[] = keysData
      ? (JSON.parse(keysData) as string[])
      : [];

    const apiKeys: ApiKeyWithUsage[] = [];

    for (const key of keyList) {
      // Get metadata from Redis
      const metaData = await this.storageService.get(`api_key_meta:${key}`);
      if (!metaData) continue;

      const meta = JSON.parse(metaData) as ApiKeyMetadata;

      // Get cumulative usage stats from Redis
      const totalKey = `api_key_usage:${key}:total`;
      const totalUsage = await this.storageService.hgetall(totalKey);

      apiKeys.push({
        id: key, // Using the key itself as ID for now
        keyPreview: `${key.substring(0, 12)}...${key.substring(key.length - 4)}`,
        name: meta.name,
        createdAt: meta.createdAt,
        expiresAt: meta.expiresAt,
        lastUsedAt: totalUsage.last_used || null,
        totalRequests: parseInt(totalUsage.requests || '0', 10),
      });
    }

    return apiKeys;
  }

  /**
   * Revoke a specific API key
   * Redis-first: Immediate revocation, no blocking
   */
  async revokeApiKey(userId: string, apiKey: string): Promise<void> {
    // Verify the key belongs to the user (Redis check)
    const keyUserId = await this.storageService.get(`api_key:${apiKey}`);
    if (keyUserId !== userId) {
      throw new UnauthorizedException('API key not found or access denied');
    }

    // Remove from Redis immediately
    await this.storageService.del(`api_key:${apiKey}`);
    await this.storageService.del(`api_key_meta:${apiKey}`);

    // Remove from user's key list
    const userKeysKey = `user_api_keys:${userId}`;
    const keysData = await this.storageService.get(userKeysKey);
    if (keysData) {
      const keyList: string[] = JSON.parse(keysData) as string[];
      const updatedList = keyList.filter((k) => k !== apiKey);
      if (updatedList.length > 0) {
        await this.storageService.set(
          userKeysKey,
          JSON.stringify(updatedList),
          this.API_KEY_TTL,
        );
      } else {
        await this.storageService.del(userKeysKey);
      }
    }

    // Note: Usage data stays in Redis for historical purposes
    // PostgreSQL keeps hashed keys as audit trail (never deleted)
  }

  /**
   * Revoke all API keys for a user
   * Redis-first: Immediate revocation of all keys
   */
  async revokeAllApiKeys(userId: string): Promise<void> {
    // Get all keys for the user from Redis
    const userKeysKey = `user_api_keys:${userId}`;
    const keysData = await this.storageService.get(userKeysKey);
    if (!keysData) return;

    const keyList: string[] = JSON.parse(keysData) as string[];

    // Delete each key from Redis (makes them immediately invalid)
    for (const key of keyList) {
      await this.storageService.del(`api_key:${key}`);
      await this.storageService.del(`api_key_meta:${key}`);
    }

    // Delete the user's key list
    await this.storageService.del(userKeysKey);

    // PostgreSQL: Fire-and-forget (audit trail only)
    this.apiKeysRepository
      .revokeAllForUser(userId)
      .catch((err) =>
        console.error(
          '[ApiKeysService] Failed to revoke keys in PostgreSQL:',
          err,
        ),
      );
  }

  /**
   * Check rate limit for an API key
   * Redis-only: Fast counter increment
   *
   * @returns true if within limit, false if exceeded
   */
  async checkRateLimit(
    apiKey: string,
    maxRequestsPerHour: number = 1000,
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = Math.floor(now / (60 * 60 * 1000)); // Hour window
    const rateLimitKey = `api_key_rate:${apiKey}:${windowStart}`;

    // Increment counter (Redis atomic operation)
    const count = await this.storageService.incr(rateLimitKey);

    // Set TTL to 1 hour + buffer (only on first increment)
    if (count === 1) {
      await this.storageService.expire(rateLimitKey, 3600 + 60);
    }

    return count <= maxRequestsPerHour;
  }
}
