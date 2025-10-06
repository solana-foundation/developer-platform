import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private usersService: UsersService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      throw new UnauthorizedException('API key not provided');
    }

    const user = await this.usersService.findByApiKey(apiKey);

    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

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
