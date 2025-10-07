import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ApiKeyUsageDailyRecord {
  id: string;
  keyHash: string;
  usageDate: Date;
  totalRequests: number;
  endpointStats: Record<string, number>;
  createdAt: Date;
}

export interface CreateApiKeyUsageDailyData {
  keyHash: string;
  usageDate: Date;
  totalRequests: number;
  endpointStats: Record<string, number>;
}

@Injectable()
export class ApiKeyUsageDailyRepository {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Create or update daily usage record (upsert)
   * If record for this key+date exists, update the stats
   */
  async upsert(
    data: CreateApiKeyUsageDailyData,
  ): Promise<ApiKeyUsageDailyRecord> {
    const result = await this.databaseService.query<ApiKeyUsageDailyRecord>(
      `
      INSERT INTO api_key_usage_daily (key_hash, usage_date, total_requests, endpoint_stats)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key_hash, usage_date)
      DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        endpoint_stats = EXCLUDED.endpoint_stats
      RETURNING
        id,
        key_hash as "keyHash",
        usage_date as "usageDate",
        total_requests as "totalRequests",
        endpoint_stats as "endpointStats",
        created_at as "createdAt"
    `,
      [
        data.keyHash,
        data.usageDate,
        data.totalRequests,
        JSON.stringify(data.endpointStats),
      ],
    );
    return result.rows[0];
  }

  /**
   * Get daily usage for a specific key and date range
   */
  async findByKeyAndDateRange(
    keyHash: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ApiKeyUsageDailyRecord[]> {
    const result = await this.databaseService.query<ApiKeyUsageDailyRecord>(
      `
      SELECT
        id,
        key_hash as "keyHash",
        usage_date as "usageDate",
        total_requests as "totalRequests",
        endpoint_stats as "endpointStats",
        created_at as "createdAt"
      FROM api_key_usage_daily
      WHERE key_hash = $1
        AND usage_date >= $2
        AND usage_date <= $3
      ORDER BY usage_date DESC
    `,
      [keyHash, startDate, endDate],
    );
    return result.rows;
  }

  /**
   * Get aggregated stats for a key across a date range
   */
  async getAggregatedStats(
    keyHash: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalRequests: number;
    endpointStats: Record<string, number>;
  }> {
    const result = await this.databaseService.query<{
      totalRequests: string;
      endpointStats: Record<string, number>;
    }>(
      `
      SELECT
        SUM(total_requests) as "totalRequests",
        jsonb_object_agg(endpoint, requests) as "endpointStats"
      FROM (
        SELECT
          key,
          SUM(value::bigint) as requests
        FROM api_key_usage_daily,
        jsonb_each_text(endpoint_stats)
        WHERE key_hash = $1
          AND usage_date >= $2
          AND usage_date <= $3
        GROUP BY key
      ) aggregated
    `,
      [keyHash, startDate, endDate],
    );

    if (result.rows.length === 0) {
      return { totalRequests: 0, endpointStats: {} };
    }

    return {
      totalRequests: parseInt(result.rows[0].totalRequests || '0', 10),
      endpointStats: result.rows[0].endpointStats || {},
    };
  }

  /**
   * Delete old records beyond retention period
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.databaseService.query(
      `
      DELETE FROM api_key_usage_daily
      WHERE usage_date < $1
    `,
      [date],
    );
    return result.rowCount || 0;
  }
}
