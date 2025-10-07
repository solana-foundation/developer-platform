import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { ApiKeysService } from '../services/api-keys.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(
    private usersService: UsersService,
    private apiKeysService: ApiKeysService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      throw new UnauthorizedException('API key not provided');
    }

    if (!apiKey.startsWith('sk_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Validate API key (Redis-only, fast lookup)
    const userId = await this.apiKeysService.validateApiKey(apiKey);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Track usage asynchronously (non-blocking)
    // Extract endpoint from request path
    const endpoint = `${req.method} ${req.path}`;
    this.apiKeysService
      .trackUsage(apiKey, endpoint)
      .catch((err) =>
        console.error('[ApiKeyStrategy] Failed to track usage:', err),
      );

    return { userId: user.id, email: user.email };
  }

  private extractApiKey(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer sk_')) {
      return authHeader.substring(7);
    }

    if (req.headers['x-api-key']) {
      return req.headers['x-api-key'] as string;
    }

    return null;
  }
}
