import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IStorageService } from './interfaces/storage.interface';

@Injectable()
export class StorageService implements IStorageService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl !== undefined) {
      // ioredis SETEX expects TTL in seconds
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.redis.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return await this.redis.hincrby(key, field, increment);
  }

  async hincrbyfloat(
    key: string,
    field: string,
    increment: number,
  ): Promise<string> {
    return await this.redis.hincrbyfloat(key, field, increment);
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }
}
