import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface AirdropRecord {
  id: string;
  userId: string;
  signature: string;
  slot: number;
  recipient: string;
  amount: string;
  status: string;
  createdAt: Date;
}

export interface CreateAirdropData {
  userId: string;
  signature: string;
  slot: number;
  recipient: string;
  amount: number;
  status?: string;
}

@Injectable()
export class AirdropsRepository {
  constructor(private databaseService: DatabaseService) {}

  async create(data: CreateAirdropData): Promise<AirdropRecord> {
    const result = await this.databaseService.query<AirdropRecord>(
      `
      INSERT INTO airdrops (user_id, signature, slot, recipient, amount, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        user_id as "userId",
        signature,
        slot,
        recipient,
        amount,
        status,
        created_at as "createdAt"
    `,
      [
        data.userId,
        data.signature,
        data.slot,
        data.recipient,
        data.amount,
        data.status || 'confirmed',
      ],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<AirdropRecord | null> {
    const result = await this.databaseService.query<AirdropRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        signature,
        slot,
        recipient,
        amount,
        status,
        created_at as "createdAt"
      FROM airdrops
      WHERE id = $1
    `,
      [id],
    );
    return result.rows[0] || null;
  }

  async findBySignature(signature: string): Promise<AirdropRecord | null> {
    const result = await this.databaseService.query<AirdropRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        signature,
        slot,
        recipient,
        amount,
        status,
        created_at as "createdAt"
      FROM airdrops
      WHERE signature = $1
    `,
      [signature],
    );
    return result.rows[0] || null;
  }

  async listByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AirdropRecord[]> {
    const result = await this.databaseService.query<AirdropRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        signature,
        slot,
        recipient,
        amount,
        status,
        created_at as "createdAt"
      FROM airdrops
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [userId, limit, offset],
    );
    return result.rows;
  }

  async listByRecipient(
    recipient: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AirdropRecord[]> {
    const result = await this.databaseService.query<AirdropRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        signature,
        slot,
        recipient,
        amount,
        status,
        created_at as "createdAt"
      FROM airdrops
      WHERE recipient = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [recipient, limit, offset],
    );
    return result.rows;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE airdrops
      SET status = $1
      WHERE id = $2
    `,
      [status, id],
    );
  }

  async getTotalStats(): Promise<{
    totalAirdrops: number;
    totalAmount: string;
  }> {
    const result = await this.databaseService.query<{
      totalAirdrops: string;
      totalAmount: string;
    }>(
      `
      SELECT
        COUNT(*) as "totalAirdrops",
        COALESCE(SUM(amount), 0) as "totalAmount"
      FROM airdrops
    `,
    );
    return {
      totalAirdrops: parseInt(result.rows[0].totalAirdrops, 10),
      totalAmount: result.rows[0].totalAmount,
    };
  }

  async getUserStats(userId: string): Promise<{
    totalAirdrops: number;
    totalAmount: string;
  }> {
    const result = await this.databaseService.query<{
      totalAirdrops: string;
      totalAmount: string;
    }>(
      `
      SELECT
        COUNT(*) as "totalAirdrops",
        COALESCE(SUM(amount), 0) as "totalAmount"
      FROM airdrops
      WHERE user_id = $1
    `,
      [userId],
    );
    return {
      totalAirdrops: parseInt(result.rows[0].totalAirdrops, 10),
      totalAmount: result.rows[0].totalAmount,
    };
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.databaseService.query<{ count: string }>(
      `
      SELECT COUNT(*) as count
      FROM airdrops
      WHERE user_id = $1
    `,
      [userId],
    );
    return parseInt(result.rows[0].count, 10);
  }
}
