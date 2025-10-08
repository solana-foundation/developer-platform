import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface AirdropUsageDailyRecord {
  id: string;
  userId: string;
  usageDate: Date;
  totalAirdrops: number;
  totalVolume: string;
  apiKeyStats: Record<string, { count: number; volume: number }>;
  createdAt: Date;
}

export interface CreateAirdropUsageDailyData {
  userId: string;
  usageDate: Date;
  totalAirdrops: number;
  totalVolume: number;
  apiKeyStats: Record<string, { count: number; volume: number }>;
}

@Injectable()
export class AirdropUsageDailyRepository {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create or update daily usage record (upsert)
   * If record for this user+date exists, update the stats
   */
  async upsert(
    data: CreateAirdropUsageDailyData,
  ): Promise<AirdropUsageDailyRecord> {
    const result = await this.databaseService.query<AirdropUsageDailyRecord>(
      `
      INSERT INTO airdrop_usage_daily (user_id, usage_date, total_airdrops, total_volume, api_key_stats)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, usage_date)
      DO UPDATE SET
        total_airdrops = EXCLUDED.total_airdrops,
        total_volume = EXCLUDED.total_volume,
        api_key_stats = EXCLUDED.api_key_stats
      RETURNING
        id,
        user_id as "userId",
        usage_date as "usageDate",
        total_airdrops as "totalAirdrops",
        total_volume as "totalVolume",
        api_key_stats as "apiKeyStats",
        created_at as "createdAt"
    `,
      [
        data.userId,
        data.usageDate,
        data.totalAirdrops,
        data.totalVolume,
        JSON.stringify(data.apiKeyStats),
      ],
    );
    return result.rows[0];
  }

  /**
   * Get daily usage for a specific user and date range
   */
  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AirdropUsageDailyRecord[]> {
    const result = await this.databaseService.query<AirdropUsageDailyRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        usage_date as "usageDate",
        total_airdrops as "totalAirdrops",
        total_volume as "totalVolume",
        api_key_stats as "apiKeyStats",
        created_at as "createdAt"
      FROM airdrop_usage_daily
      WHERE user_id = $1
        AND usage_date >= $2
        AND usage_date <= $3
      ORDER BY usage_date DESC
    `,
      [userId, startDate, endDate],
    );
    return result.rows;
  }

  /**
   * Get aggregated stats for a user across a date range
   */
  async getAggregatedStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalAirdrops: number;
    totalVolume: string;
  }> {
    const result = await this.databaseService.query<{
      totalAirdrops: string;
      totalVolume: string;
    }>(
      `
      SELECT
        COALESCE(SUM(total_airdrops), 0) as "totalAirdrops",
        COALESCE(SUM(total_volume), 0) as "totalVolume"
      FROM airdrop_usage_daily
      WHERE user_id = $1
        AND usage_date >= $2
        AND usage_date <= $3
    `,
      [userId, startDate, endDate],
    );

    if (result.rows.length === 0) {
      return { totalAirdrops: 0, totalVolume: '0' };
    }

    return {
      totalAirdrops: parseInt(result.rows[0].totalAirdrops || '0', 10),
      totalVolume: result.rows[0].totalVolume || '0',
    };
  }

  /**
   * Delete old records beyond retention period
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.databaseService.query(
      `
      DELETE FROM airdrop_usage_daily
      WHERE usage_date < $1
    `,
      [date],
    );
    return result.rowCount || 0;
  }
}
