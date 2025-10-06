import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { IStorageService } from './interfaces/storage.interface';

@Injectable()
export class StorageService implements IStorageService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get(key: string): Promise<string | null> {
    const value = await this.cacheManager.get<string>(key);
    return value || null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl ? ttl * 1000 : 0);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const value = await this.get(key);
    if (value) {
      await this.set(key, value, seconds);
    }
  }

  async ttl(key: string): Promise<number> {
    const ttl = await this.cacheManager.ttl(key);
    return ttl || -1;
  }

  async keys(pattern: string): Promise<string[]> {
    const stores = this.cacheManager.stores as any;
    if (stores && stores[0] && stores[0].keys) {
      return stores[0].keys(pattern);
    }
    return [];
  }
}