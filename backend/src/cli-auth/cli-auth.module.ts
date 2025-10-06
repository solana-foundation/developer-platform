import { Module } from '@nestjs/common';
import { CliAuthController } from './cli-auth.controller';
import { CliAuthService } from './cli-auth.service';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [StorageModule, AuthModule, ConfigModule],
  controllers: [CliAuthController],
  providers: [CliAuthService],
  exports: [CliAuthService],
})
export class CliAuthModule {}