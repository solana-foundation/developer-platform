import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [CacheModule.register()],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}