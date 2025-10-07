import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        redis.on('error', (err) => {
          console.error('[Redis] Connection error:', err);
        });

        redis.on('connect', () => {
          console.log('[Redis] Connected successfully');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService, 'REDIS_CLIENT'],
})
export class StorageModule {}
