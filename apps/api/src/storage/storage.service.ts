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

  keys(pattern: string): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stores = this.cacheManager.stores as any;
    if (
      stores &&
      Array.isArray(stores) &&
      stores[0] &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof stores[0].keys === 'function'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return stores[0].keys(pattern);
    }
    return Promise.resolve([]);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stores = this.cacheManager.stores as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (stores && Array.isArray(stores) && stores[0] && stores[0].client) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await stores[0].client.hset(key, field, value);
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stores = this.cacheManager.stores as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (stores && Array.isArray(stores) && stores[0] && stores[0].client) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const value = (await stores[0].client.hget(key, field)) as string | null;
      return value || null;
    }
    return null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stores = this.cacheManager.stores as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (stores && Array.isArray(stores) && stores[0] && stores[0].client) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const value = (await stores[0].client.hgetall(key)) as Record<
        string,
        string
      >;
      return value || {};
    }
    return {};
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stores = this.cacheManager.stores as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (stores && Array.isArray(stores) && stores[0] && stores[0].client) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const value = (await stores[0].client.hincrby(
        key,
        field,
        increment,
      )) as number;
      return value;
    }
    return 0;
  }

  async incr(key: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stores = this.cacheManager.stores as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (stores && Array.isArray(stores) && stores[0] && stores[0].client) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const value = (await stores[0].client.incr(key)) as number;
      return value;
    }
    return 0;
  }
}
