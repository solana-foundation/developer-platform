import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cluster: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  userId: string;
  name: string;
  description?: string;
  cluster: string;
}

@Injectable()
export class ProjectsRepository {
  constructor(private db: DatabaseService) {}

  async create(data: CreateProjectData): Promise<ProjectRecord> {
    const result = await this.db.query(
      `INSERT INTO projects (user_id, name, description, cluster)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id as "userId", name, description, cluster,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [data.userId, data.name, data.description, data.cluster],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    const result = await this.db.query(
      `SELECT id, user_id as "userId", name, description, cluster,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM projects
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] || null;
  }

  async findByUserAndName(
    userId: string,
    name: string,
  ): Promise<ProjectRecord | null> {
    const result = await this.db.query(
      `SELECT id, user_id as "userId", name, description, cluster,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM projects
       WHERE user_id = $1 AND name = $2`,
      [userId, name],
    );
    return result.rows[0] || null;
  }

  async listByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProjectRecord[]> {
    const result = await this.db.query(
      `SELECT id, user_id as "userId", name, description, cluster,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM projects
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows;
  }

  async listByUserAndCluster(
    userId: string,
    cluster: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProjectRecord[]> {
    const result = await this.db.query(
      `SELECT id, user_id as "userId", name, description, cluster,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM projects
       WHERE user_id = $1 AND cluster = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, cluster, limit, offset],
    );
    return result.rows;
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (updates.length === 0) return;

    values.push(id);
    await this.db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM projects WHERE id = $1', [id]);
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.db.query(
      'SELECT COUNT(*) FROM projects WHERE user_id = $1',
      [userId],
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getProgramsForProject(
    projectId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    const result = await this.db.query(
      `SELECT id, project_id as "projectId", program_address as "programAddress",
              name, description, cluster, status, deployment_logs as "deploymentLogs",
              deployed_at as "deployedAt", expires_at as "expiresAt",
              claimed_at as "claimedAt", claimed_by_authority as "claimedByAuthority",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM programs
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [projectId, limit, offset],
    );
    return result.rows;
  }

  async getProjectStats(
    projectId: string,
  ): Promise<{ totalPrograms: number; byStatus: Record<string, number> }> {
    const result = await this.db.query(
      `SELECT status, COUNT(*) as count
       FROM programs
       WHERE project_id = $1
       GROUP BY status`,
      [projectId],
    );

    const totalPrograms = result.rows.reduce(
      (sum, row) => sum + parseInt(row.count, 10),
      0,
    );
    const byStatus: Record<string, number> = {};

    result.rows.forEach((row) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    return { totalPrograms, byStatus };
  }
}
