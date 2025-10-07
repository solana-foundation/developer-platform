import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { ApiKeysService } from './services/api-keys.service';
import { RegisterDto } from './dto/register.dto';
import { SafeUser } from '../users/interfaces/user.interface';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private storageService: StorageService,
    private apiKeysService: ApiKeysService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user);
    return {
      user,
      ...tokens,
    };
  }

  async login(user: SafeUser) {
    const tokens = await this.generateTokens(user);
    return {
      user,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const storedToken = await this.storageService.get(
        `refresh_token:${payload.sub}`,
      );
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;
      return this.generateTokens(safeUser);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.storageService.del(`refresh_token:${userId}`);
  }

  async generateApiToken(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.apiKeysService.generateApiKey(userId, 'API Key');
  }

  async getUserApiKey(userId: string): Promise<{ apiKeys: any[] }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const keys = await this.apiKeysService.listUserApiKeys(userId);

    // Map to legacy format for backward compatibility
    return {
      apiKeys: keys.map((key) => ({
        key: key.keyPreview,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        totalRequests: key.totalRequests,
      })),
    };
  }

  async regenerateApiKey(userId: string): Promise<string> {
    // Revoke all existing keys
    await this.apiKeysService.revokeAllApiKeys(userId);

    // Generate a new one
    return this.generateApiToken(userId);
  }

  private async generateTokens(user: SafeUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h') },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      },
    );

    await this.storageService.set(
      `refresh_token:${user.id}`,
      refreshToken,
      7 * 24 * 60 * 60,
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
