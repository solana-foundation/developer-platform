import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import * as fs from 'fs';
import * as path from 'path';

export interface Migration {
  id: number;
  name: string;
  appliedAt: Date;
}

@Injectable()
export class MigrationService {
  constructor(private databaseService: DatabaseService) {}

  async ensureMigrationsTable(): Promise<void> {
    await this.databaseService.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.databaseService.query<Migration>(`
      SELECT id, name, applied_at as "appliedAt"
      FROM schema_migrations
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async applyMigration(name: string, sql: string): Promise<void> {
    await this.databaseService.transaction(async (client) => {
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [
        name,
      ]);
    });
  }

  async getPendingMigrations(
    migrationsDir: string,
  ): Promise<{ name: string; path: string }[]> {
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedNames = new Set(appliedMigrations.map((m) => m.name));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    return files
      .filter((file) => !appliedNames.has(file))
      .map((file) => ({
        name: file,
        path: path.join(migrationsDir, file),
      }));
  }

  async runMigrations(migrationsDir: string): Promise<void> {
    await this.ensureMigrationsTable();
    const pending = await this.getPendingMigrations(migrationsDir);

    for (const migration of pending) {
      console.log(`Applying migration: ${migration.name}`);
      const sql = fs.readFileSync(migration.path, 'utf8');
      await this.applyMigration(migration.name, sql);
      console.log(`✓ Applied migration: ${migration.name}`);
    }

    if (pending.length === 0) {
      console.log('No pending migrations');
    }
  }
}
