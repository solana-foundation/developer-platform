import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private usersService: UsersService) {
    super(async (req: Request, callback: Function) => {
      return await this.validate(req, callback);
    });
  }

  private async validate(req: Request, callback: Function) {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      return callback(null, false);
    }

    const user = await this.usersService.findByApiKey(apiKey);

    if (!user) {
      return callback(new UnauthorizedException('Invalid API key'), false);
    }

    return callback(null, { userId: user.id, email: user.email });
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