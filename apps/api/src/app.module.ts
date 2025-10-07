import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AirdropService } from './airdrop/airdrop.service';
import { AirdropController } from './airdrop/airdrop.controller';
import { AirdropsRepository } from './airdrop/repositories/airdrops.repository';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CliAuthModule } from './cli-auth/cli-auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MigrationService } from './database/migrations/migration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    StorageModule,
    UsersModule,
    AuthModule,
    CliAuthModule,
  ],
  controllers: [AppController, AirdropController],
  providers: [
    AppService,
    AirdropService,
    AirdropsRepository,
    MigrationService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
