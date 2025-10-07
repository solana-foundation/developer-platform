import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../../storage/storage.service';
import { ApiKeysRepository } from '../repositories/api-keys.repository';

interface ApiKeyMetadata {
  key: string;
  keyHash: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * ApiUsageAggregationService - Background job for syncing Redis usage stats to PostgreSQL
 *
 * Runs every 15 minutes to aggregate API key usage data from Redis into PostgreSQL.
 * This provides long-term analytics while keeping hot path operations Redis-only.
 *
 * Process:
 * 1. Find all active API keys from Redis pattern `api_key:*`
 * 2. Read cumulative usage stats from Redis `api_key_usage:{key}:total`
 * 3. Bulk update PostgreSQL with total_requests and last_used_at
 * 4. Fire-and-forget pattern - logs errors but doesn't block
 */
@Injectable()
export class ApiUsageAggregationService {
  private readonly logger = new Logger(ApiUsageAggregationService.name);

  constructor(
    private storageService: StorageService,
    private apiKeysRepository: ApiKeysRepository,
  ) {}

  /**
   * Runs every 10 minutes to sync usage stats from Redis to PostgreSQL
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async aggregateApiUsageStats() {
    this.logger.log('Starting API usage aggregation job');

    try {
      // Find all active API keys in Redis
      const apiKeyPattern = 'api_key:*';
      const apiKeyKeys = await this.storageService.keys(apiKeyPattern);

      if (apiKeyKeys.length === 0) {
        this.logger.log('No active API keys found, skipping aggregation');
        return;
      }

      this.logger.log(`Found ${apiKeyKeys.length} active API keys`);

      // Collect updates to batch
      const updates: Array<{
        keyHash: string;
        totalRequests: number;
        lastUsedAt: Date;
      }> = [];

      // Process each API key
      for (const keyRedisKey of apiKeyKeys) {
        try {
          // Extract the actual API key from Redis key (format: "api_key:{key}")
          const apiKey = keyRedisKey.replace('api_key:', '');

          // Get metadata from Redis (includes the hash)
          const metaData = await this.storageService.get(
            `api_key_meta:${apiKey}`,
          );
          if (!metaData) {
            this.logger.warn(`No metadata found for API key ${apiKey}`);
            continue;
          }

          const metadata = JSON.parse(metaData) as ApiKeyMetadata;
          const keyHash = metadata.keyHash;

          if (!keyHash) {
            this.logger.warn(`No hash found in metadata for API key ${apiKey}`);
            continue;
          }

          // Get usage stats from Redis
          const usageTotalKey = `api_key_usage:${apiKey}:total`;
          const usageData = await this.storageService.hgetall(usageTotalKey);

          if (!usageData || !usageData.requests) {
            continue; // Skip if no usage data
          }

          const totalRequests = parseInt(usageData.requests, 10);
          const lastUsed = usageData.last_used
            ? new Date(usageData.last_used)
            : new Date();

          updates.push({
            keyHash,
            totalRequests,
            lastUsedAt: lastUsed,
          });
        } catch (err) {
          this.logger.warn(
            `Failed to process API key ${keyRedisKey}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      if (updates.length === 0) {
        this.logger.log('No usage updates to sync');
        return;
      }

      // Bulk update PostgreSQL (fire-and-forget pattern)
      this.logger.log(`Syncing ${updates.length} API key usage stats`);
      await this.apiKeysRepository
        .bulkUpdateUsageStats(updates)
        .catch((err) => {
          this.logger.error(
            `Failed to bulk update usage stats: ${err instanceof Error ? err.message : String(err)}`,
          );
        });

      this.logger.log('API usage aggregation completed successfully');
    } catch (error) {
      this.logger.error(
        `API usage aggregation job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerAggregation() {
    this.logger.log('Manually triggering API usage aggregation');
    await this.aggregateApiUsageStats();
  }
}
