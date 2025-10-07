import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ApiKeysRepository } from './repositories/api-keys.repository';
import { ApiKeyUsageDailyRepository } from './repositories/api-key-usage-daily.repository';
import { ApiKeysService } from './services/api-keys.service';
import { ApiUsageAggregationService } from './services/api-usage-aggregation.service';
import { ApiUsageArchivalService } from './services/api-usage-archival.service';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    UsersModule,
    StorageModule,
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    ApiKeyStrategy,
    ApiKeysRepository,
    ApiKeyUsageDailyRepository,
    ApiKeysService,
    ApiUsageAggregationService,
    ApiUsageArchivalService,
  ],
  exports: [AuthService, ApiKeysRepository, ApiKeysService],
})
export class AuthModule {}
