import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface UserRecord {
  id: string;
  email: string | null;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email?: string;
  passwordHash?: string;
}

@Injectable()
export class UsersRepository {
  constructor(private databaseService: DatabaseService) {}

  async create(data: CreateUserData): Promise<UserRecord> {
    const result = await this.databaseService.query<UserRecord>(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash as "passwordHash", created_at as "createdAt", updated_at as "updatedAt"
    `,
      [data.email || null, data.passwordHash || null],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.databaseService.query<UserRecord>(
      `
      SELECT id, email, password_hash as "passwordHash", created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `,
      [id],
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.databaseService.query<UserRecord>(
      `
      SELECT id, email, password_hash as "passwordHash", created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE email = $1
    `,
      [email],
    );
    return result.rows[0] || null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
    `,
      [passwordHash, id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.databaseService.query(
      `
      DELETE FROM users
      WHERE id = $1
    `,
      [id],
    );
  }
}
