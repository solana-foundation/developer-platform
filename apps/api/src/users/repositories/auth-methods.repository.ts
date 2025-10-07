import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface AuthMethodRecord {
  id: string;
  userId: string;
  provider: string;
  providerId: string;
  metadata: Record<string, any>;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuthMethodData {
  userId: string;
  provider: string;
  providerId: string;
  metadata?: Record<string, any>;
  verified?: boolean;
}

@Injectable()
export class AuthMethodsRepository {
  constructor(private databaseService: DatabaseService) {}

  async create(data: CreateAuthMethodData): Promise<AuthMethodRecord> {
    const result = await this.databaseService.query<AuthMethodRecord>(
      `
      INSERT INTO auth_methods (user_id, provider, provider_id, metadata, verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        user_id as "userId",
        provider,
        provider_id as "providerId",
        metadata,
        verified,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
      [
        data.userId,
        data.provider,
        data.providerId,
        JSON.stringify(data.metadata || {}),
        data.verified !== undefined ? data.verified : false,
      ],
    );
    return result.rows[0];
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<AuthMethodRecord | null> {
    const result = await this.databaseService.query<AuthMethodRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        provider,
        provider_id as "providerId",
        metadata,
        verified,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM auth_methods
      WHERE provider = $1 AND provider_id = $2
    `,
      [provider, providerId],
    );
    return result.rows[0] || null;
  }

  async listByUser(userId: string): Promise<AuthMethodRecord[]> {
    const result = await this.databaseService.query<AuthMethodRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        provider,
        provider_id as "providerId",
        metadata,
        verified,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM auth_methods
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
      [userId],
    );
    return result.rows;
  }

  async verify(id: string): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE auth_methods
      SET verified = TRUE
      WHERE id = $1
    `,
      [id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.databaseService.query(
      `
      DELETE FROM auth_methods
      WHERE id = $1
    `,
      [id],
    );
  }

  async deleteByProvider(
    userId: string,
    provider: string,
    providerId: string,
  ): Promise<void> {
    await this.databaseService.query(
      `
      DELETE FROM auth_methods
      WHERE user_id = $1 AND provider = $2 AND provider_id = $3
    `,
      [userId, provider, providerId],
    );
  }
}
