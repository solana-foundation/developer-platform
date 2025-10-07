import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MigrationService } from '../migrations/migration.service';
import * as path from 'path';

async function runMigrations() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const migrationService = app.get(MigrationService);

  const migrationsDir = path.join(__dirname, '../migrations/sql');

  try {
    await migrationService.runMigrations(migrationsDir);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void runMigrations();
