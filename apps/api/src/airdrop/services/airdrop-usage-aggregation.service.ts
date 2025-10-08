import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StorageService } from '../../storage/storage.service';
import { AirdropUsageDailyRepository } from '../repositories/airdrop-usage-daily.repository';

/**
 * AirdropUsageAggregationService - Background job for archiving Redis airdrop usage to PostgreSQL
 *
 * Runs daily at 3:00 AM to archive yesterday's usage data before it expires from Redis (90 day TTL).
 * This preserves historical analytics beyond Redis retention period.
 *
 * Process:
 * 1. Find all users with airdrop activity from Redis pattern `airdrop_user:*:{YYYY-MM-DD}`
 * 2. For each user, get yesterday's daily usage data (count + volume)
 * 3. Aggregate per-API-key breakdown from Redis `airdrop_key:*:{YYYY-MM-DD}`
 * 4. Archive to PostgreSQL airdrop_usage_daily table (upsert)
 * 5. Optionally clean up old data beyond retention period
 */
@Injectable()
export class AirdropUsageAggregationService {
  private readonly logger = new Logger(AirdropUsageAggregationService.name);
  private readonly RETENTION_DAYS = 365; // Keep 1 year of daily data

  constructor(
    private storageService: StorageService,
    private airdropUsageDailyRepository: AirdropUsageDailyRepository,
  ) {}

  /**
   * Runs daily at 3:00 AM to archive yesterday's airdrop usage data
   * Cron expression: "0 0 3 * * *" = At 3:00 AM every day
   */
  @Cron('0 0 3 * * *')
  async archiveDailyUsage() {
    this.logger.log('Starting daily airdrop usage archival job');

    try {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

      this.logger.log(`Archiving airdrop usage data for date: ${yesterdayStr}`);

      // Find all user airdrop usage keys for yesterday
      const userDailyPattern = `airdrop_user:*:${yesterdayStr}`;
      const userDailyKeys = await this.storageService.keys(userDailyPattern);

      if (userDailyKeys.length === 0) {
        this.logger.log('No airdrop usage data found for yesterday');
        return;
      }

      this.logger.log(
        `Found ${userDailyKeys.length} users with airdrop activity`,
      );

      let archivedCount = 0;
      let skippedCount = 0;

      // Process each user's usage
      for (const userDailyKey of userDailyKeys) {
        try {
          // Extract userId from Redis key (format: "airdrop_user:{userId}:{YYYY-MM-DD}")
          const parts = userDailyKey.split(':');
          if (parts.length !== 3) {
            this.logger.warn(`Invalid key format: ${userDailyKey}`);
            skippedCount++;
            continue;
          }

          const userId = parts[1];

          // Get user's daily usage from Redis
          const dailyUsage = await this.storageService.hgetall(userDailyKey);

          if (!dailyUsage || !dailyUsage.count) {
            this.logger.warn(`No usage data in Redis for key: ${userDailyKey}`);
            skippedCount++;
            continue;
          }

          const totalAirdrops = parseInt(dailyUsage.count, 10);
          const totalVolume = parseFloat(dailyUsage.volume || '0');

          // Get per-API-key breakdown for this user on this date
          const apiKeyStats = await this.aggregateApiKeyUsage(yesterdayStr);

          // Archive to PostgreSQL (upsert)
          await this.airdropUsageDailyRepository.upsert({
            userId,
            usageDate: yesterday,
            totalAirdrops,
            totalVolume,
            apiKeyStats,
          });

          archivedCount++;
        } catch (err) {
          this.logger.warn(
            `Failed to archive usage for key ${userDailyKey}: ${err instanceof Error ? err.message : String(err)}`,
          );
          skippedCount++;
        }
      }

      this.logger.log(
        `Archival completed: ${archivedCount} archived, ${skippedCount} skipped`,
      );

      // Cleanup old records beyond retention period
      await this.cleanupOldRecords();
    } catch (error) {
      this.logger.error(
        `Daily airdrop usage archival job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Aggregate per-API-key usage for a specific date
   */
  private async aggregateApiKeyUsage(
    date: string,
  ): Promise<Record<string, { count: number; volume: number }>> {
    const apiKeyStats: Record<string, { count: number; volume: number }> = {};

    try {
      // Find all API key usage for this date
      const apiKeyPattern = `airdrop_key:*:${date}`;
      const apiKeyKeys = await this.storageService.keys(apiKeyPattern);

      for (const apiKeyKey of apiKeyKeys) {
        try {
          // Extract API key from Redis key (format: "airdrop_key:{apiKey}:{YYYY-MM-DD}")
          const parts = apiKeyKey.split(':');
          if (parts.length !== 3) continue;

          const apiKey = parts[1];

          // Get usage data
          const usage = await this.storageService.hgetall(apiKeyKey);
          if (!usage || !usage.count) continue;

          const count = parseInt(usage.count, 10);
          const volume = parseFloat(usage.volume || '0');

          // Use key hash or truncated key as identifier (don't store full key)
          const keyIdentifier = `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`;
          apiKeyStats[keyIdentifier] = { count, volume };
        } catch (err) {
          this.logger.warn(
            `Failed to process API key usage: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to aggregate API key usage: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return apiKeyStats;
  }

  /**
   * Clean up records older than retention period
   */
  private async cleanupOldRecords() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      this.logger.log(
        `Cleaning up airdrop usage records older than ${cutoffDate.toISOString().split('T')[0]}`,
      );

      const deletedCount =
        await this.airdropUsageDailyRepository.deleteOlderThan(cutoffDate);

      if (deletedCount > 0) {
        this.logger.log(`Deleted ${deletedCount} old airdrop usage records`);
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
    this.logger.log('Manually triggering daily airdrop usage archival');
    await this.archiveDailyUsage();
  }
}
