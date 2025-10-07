import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StorageService } from '../../storage/storage.service';
import { ApiKeyUsageDailyRepository } from '../repositories/api-key-usage-daily.repository';

interface ApiKeyMetadata {
  key: string;
  keyHash: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * ApiUsageArchivalService - Background job for archiving Redis daily usage to PostgreSQL
 *
 * Runs daily at 2 AM to archive yesterday's usage data before it expires from Redis (90 day TTL).
 * This preserves historical analytics beyond Redis retention period.
 *
 * Process:
 * 1. Find all active API keys from Redis pattern `api_key:*`
 * 2. For each key, get yesterday's daily usage data from Redis `api_key_usage:{key}:{YYYY-MM-DD}`
 * 3. Archive to PostgreSQL api_key_usage_daily table (upsert)
 * 4. Optionally clean up old data beyond retention period
 */
@Injectable()
export class ApiUsageArchivalService {
  private readonly logger = new Logger(ApiUsageArchivalService.name);
  private readonly RETENTION_DAYS = 365; // Keep 1 year of daily data

  constructor(
    private storageService: StorageService,
    private apiKeyUsageDailyRepository: ApiKeyUsageDailyRepository,
  ) {}

  /**
   * Runs daily at 2:00 AM to archive yesterday's usage data
   * Cron expression: "0 0 2 * * *" = At 2:00 AM every day
   */
  @Cron('0 0 2 * * *')
  async archiveDailyUsage() {
    this.logger.log('Starting daily usage archival job');

    try {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

      this.logger.log(`Archiving usage data for date: ${yesterdayStr}`);

      // Find all active API keys in Redis
      const apiKeyPattern = 'api_key:*';
      const apiKeyKeys = await this.storageService.keys(apiKeyPattern);

      if (apiKeyKeys.length === 0) {
        this.logger.log('No active API keys found, skipping archival');
        return;
      }

      this.logger.log(`Found ${apiKeyKeys.length} active API keys to archive`);

      let archivedCount = 0;
      let skippedCount = 0;

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
            skippedCount++;
            continue;
          }

          const metadata = JSON.parse(metaData) as ApiKeyMetadata;
          const keyHash = metadata.keyHash;

          if (!keyHash) {
            this.logger.warn(`No hash found in metadata for API key ${apiKey}`);
            skippedCount++;
            continue;
          }

          // Get yesterday's daily usage from Redis
          const dailyKey = `api_key_usage:${apiKey}:${yesterdayStr}`;
          const dailyUsage = await this.storageService.hgetall(dailyKey);

          if (!dailyUsage || !dailyUsage.requests) {
            // No usage data for yesterday, skip
            skippedCount++;
            continue;
          }

          const totalRequests = parseInt(dailyUsage.requests, 10);

          // Extract endpoint stats from daily usage
          const endpointStats: Record<string, number> = {};
          for (const [key, value] of Object.entries(dailyUsage)) {
            if (key.startsWith('endpoint:')) {
              const endpoint = key.replace('endpoint:', '');
              endpointStats[endpoint] = parseInt(value, 10);
            }
          }

          // Archive to PostgreSQL (upsert)
          await this.apiKeyUsageDailyRepository.upsert({
            keyHash,
            usageDate: yesterday,
            totalRequests,
            endpointStats,
          });

          archivedCount++;
        } catch (err) {
          this.logger.warn(
            `Failed to archive usage for API key ${keyRedisKey}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      this.logger.log(
        `Archival completed: ${archivedCount} archived, ${skippedCount} skipped`,
      );

      // Cleanup old records beyond retention period (optional)
      await this.cleanupOldRecords();
    } catch (error) {
      this.logger.error(
        `Daily usage archival job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Clean up records older than retention period
   */
  private async cleanupOldRecords() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      this.logger.log(
        `Cleaning up records older than ${cutoffDate.toISOString().split('T')[0]}`,
      );

      const deletedCount =
        await this.apiKeyUsageDailyRepository.deleteOlderThan(cutoffDate);

      if (deletedCount > 0) {
        this.logger.log(`Deleted ${deletedCount} old usage records`);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to cleanup old records: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerArchival() {
    this.logger.log('Manually triggering daily usage archival');
    await this.archiveDailyUsage();
  }
}
