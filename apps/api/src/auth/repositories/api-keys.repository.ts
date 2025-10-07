import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ApiKeyRecord {
  id: string;
  userId: string;
  keyHash: string;
  name: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface CreateApiKeyData {
  userId: string;
  keyHash: string;
  name?: string;
  expiresAt?: Date;
}

@Injectable()
export class ApiKeysRepository {
  constructor(private databaseService: DatabaseService) {}

  async create(data: CreateApiKeyData): Promise<ApiKeyRecord> {
    const result = await this.databaseService.query<ApiKeyRecord>(
      `
      INSERT INTO api_keys (user_id, key_hash, name, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id as "userId",
        key_hash as "keyHash",
        name,
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        expires_at as "expiresAt"
    `,
      [data.userId, data.keyHash, data.name || null, data.expiresAt || null],
    );
    return result.rows[0];
  }

  async findByHash(keyHash: string): Promise<ApiKeyRecord | null> {
    const result = await this.databaseService.query<ApiKeyRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        key_hash as "keyHash",
        name,
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM api_keys
      WHERE key_hash = $1
    `,
      [keyHash],
    );
    return result.rows[0] || null;
  }

  async listByUser(userId: string): Promise<ApiKeyRecord[]> {
    const result = await this.databaseService.query<ApiKeyRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        key_hash as "keyHash",
        name,
        last_used_at as "lastUsedAt",
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM api_keys
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
      [userId],
    );
    return result.rows;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE api_keys
      SET last_used_at = NOW()
      WHERE id = $1
    `,
      [id],
    );
  }

  async revoke(id: string): Promise<void> {
    await this.databaseService.query(
      `
      DELETE FROM api_keys
      WHERE id = $1
    `,
      [id],
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.databaseService.query(
      `
      DELETE FROM api_keys
      WHERE user_id = $1
    `,
      [userId],
    );
  }

  /**
   * Aggregate usage data from Redis to PostgreSQL (for background jobs)
   * Updates total_requests and last_used_at based on provided stats
   */
  async updateUsageStats(
    keyHash: string,
    totalRequests: number,
    lastUsedAt: Date,
  ): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE api_keys
      SET total_requests = $1, last_used_at = $2
      WHERE key_hash = $3
    `,
      [totalRequests, lastUsedAt, keyHash],
    );
  }

  /**
   * Bulk update usage stats for multiple keys (more efficient for background jobs)
   */
  async bulkUpdateUsageStats(
    updates: Array<{
      keyHash: string;
      totalRequests: number;
      lastUsedAt: Date;
    }>,
  ): Promise<void> {
    if (updates.length === 0) return;

    // Use CASE statement for bulk update
    const values: any[] = [];
    const whenClauses: string[] = [];
    const hashList: string[] = [];

    updates.forEach((update) => {
      const requestsIdx = values.length + 1;
      const hashIdx = values.length + 3;

      whenClauses.push(`WHEN key_hash = $${hashIdx} THEN $${requestsIdx}`);
      values.push(update.totalRequests, update.lastUsedAt, update.keyHash);
      hashList.push(`$${hashIdx}`);
    });

    const query = `
      UPDATE api_keys
      SET
        total_requests = CASE ${whenClauses.join(' ')} END,
        last_used_at = CASE ${whenClauses
          .map((_, i) => `WHEN key_hash = $${i * 3 + 3} THEN $${i * 3 + 2}`)
          .join(' ')} END
      WHERE key_hash IN (${hashList.join(', ')})
    `;

    await this.databaseService.query(query, values);
  }
}
