import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ProgramRecord {
  id: string;
  userId: string;
  programAddress: string;
  name: string;
  description: string | null;
  cluster: string;
  status: string;
  deploymentLogs: any[];
  deployedAt: Date | null;
  expiresAt: Date | null;
  claimedAt: Date | null;
  claimedByAuthority: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProgramData {
  userId: string;
  programAddress: string;
  name: string;
  description?: string;
  cluster?: string;
  status?: string;
  expiresAt?: Date;
}

export interface UpdateProgramLogsData {
  logEntry: {
    timestamp: Date;
    message: string;
    level?: 'info' | 'warn' | 'error';
  };
}

export interface ClaimProgramData {
  claimedByAuthority: string;
  claimedAt: Date;
}

@Injectable()
export class ProgramsRepository {
  constructor(private databaseService: DatabaseService) {}

  async create(data: CreateProgramData): Promise<ProgramRecord> {
    const result = await this.databaseService.query<ProgramRecord>(
      `
      INSERT INTO programs (user_id, program_address, name, description, cluster, status, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        user_id as "userId",
        program_address as "programAddress",
        name,
        description,
        cluster,
        status,
        deployment_logs as "deploymentLogs",
        deployed_at as "deployedAt",
        expires_at as "expiresAt",
        claimed_at as "claimedAt",
        claimed_by_authority as "claimedByAuthority",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
      [
        data.userId,
        data.programAddress,
        data.name,
        data.description || null,
        data.cluster || 'devnet',
        data.status || 'pending',
        data.expiresAt || null,
      ],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<ProgramRecord | null> {
    const result = await this.databaseService.query<ProgramRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        program_address as "programAddress",
        name,
        description,
        cluster,
        status,
        deployment_logs as "deploymentLogs",
        deployed_at as "deployedAt",
        expires_at as "expiresAt",
        claimed_at as "claimedAt",
        claimed_by_authority as "claimedByAuthority",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM programs
      WHERE id = $1
    `,
      [id],
    );
    return result.rows[0] || null;
  }

  async findByProgramAddress(
    programAddress: string,
  ): Promise<ProgramRecord | null> {
    const result = await this.databaseService.query<ProgramRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        program_address as "programAddress",
        name,
        description,
        cluster,
        status,
        deployment_logs as "deploymentLogs",
        deployed_at as "deployedAt",
        expires_at as "expiresAt",
        claimed_at as "claimedAt",
        claimed_by_authority as "claimedByAuthority",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM programs
      WHERE program_address = $1
    `,
      [programAddress],
    );
    return result.rows[0] || null;
  }

  async listByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProgramRecord[]> {
    const result = await this.databaseService.query<ProgramRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        program_address as "programAddress",
        name,
        description,
        cluster,
        status,
        deployment_logs as "deploymentLogs",
        deployed_at as "deployedAt",
        expires_at as "expiresAt",
        claimed_at as "claimedAt",
        claimed_by_authority as "claimedByAuthority",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM programs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [userId, limit, offset],
    );
    return result.rows;
  }

  async listByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProgramRecord[]> {
    const result = await this.databaseService.query<ProgramRecord>(
      `
      SELECT
        id,
        user_id as "userId",
        program_address as "programAddress",
        name,
        description,
        cluster,
        status,
        deployment_logs as "deploymentLogs",
        deployed_at as "deployedAt",
        expires_at as "expiresAt",
        claimed_at as "claimedAt",
        claimed_by_authority as "claimedByAuthority",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM programs
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [status, limit, offset],
    );
    return result.rows;
  }

  async updateStatus(
    id: string,
    status: string,
    deployedAt?: Date,
  ): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE programs
      SET status = $1, deployed_at = COALESCE($2, deployed_at)
      WHERE id = $3
    `,
      [status, deployedAt || null, id],
    );
  }

  async appendLog(id: string, logEntry: any): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE programs
      SET deployment_logs = deployment_logs || $1::jsonb
      WHERE id = $2
    `,
      [JSON.stringify([logEntry]), id],
    );
  }

  async claimAuthority(id: string, data: ClaimProgramData): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE programs
      SET
        claimed_by_authority = $1,
        claimed_at = $2,
        status = 'claimed'
      WHERE id = $3
    `,
      [data.claimedByAuthority, data.claimedAt, id],
    );
  }

  async expireUnclaimedPrograms(): Promise<number> {
    const result = await this.databaseService.query<{ count: string }>(
      `
      UPDATE programs
      SET status = 'expired'
      WHERE status IN ('deployed', 'pending')
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
        AND claimed_at IS NULL
      RETURNING id
    `,
    );
    return result.rows.length;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.databaseService.query<{ count: string }>(
      `
      SELECT COUNT(*) as count
      FROM programs
      WHERE user_id = $1
    `,
      [userId],
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getTotalStats(): Promise<{
    totalPrograms: number;
    byStatus: Record<string, number>;
  }> {
    const totalResult = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM programs`,
    );

    const statusResult = await this.databaseService.query<{
      status: string;
      count: string;
    }>(
      `
      SELECT status, COUNT(*) as count
      FROM programs
      GROUP BY status
    `,
    );

    const byStatus: Record<string, number> = {};
    statusResult.rows.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    return {
      totalPrograms: parseInt(totalResult.rows[0].count, 10),
      byStatus,
    };
  }
}
