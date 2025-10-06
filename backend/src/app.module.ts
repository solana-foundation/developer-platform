import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AirdropService } from './airdrop/airdrop.service';
import { AirdropController } from './airdrop/airdrop.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        return {
          store: store as any,
        };
      },
    }),
  ],
  controllers: [AppController, AirdropController],
  providers: [AppService, AirdropService],
})
export class AppModule {}
