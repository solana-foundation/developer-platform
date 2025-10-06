import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { RegisterDto } from './dto/register.dto';
import { SafeUser } from '../users/interfaces/user.interface';
import { JwtPayload } from './strategies/jwt.strategy';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private storageService: StorageService,
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
    await this.storageService.del(`api_tokens:${userId}`);
  }

  async generateApiToken(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      type: 'api',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('API_TOKEN_EXPIRES_IN', '30d'),
    });

    const apiTokenKey = `api_token:${uuidv4()}`;
    await this.storageService.set(
      apiTokenKey,
      JSON.stringify({
        userId,
        token,
        createdAt: new Date().toISOString(),
      }),
      30 * 24 * 60 * 60,
    );

    await this.addApiTokenToUserList(userId, apiTokenKey);

    return token;
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

  async getUserApiKey(userId: string): Promise<{ apiKey: string | null }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { apiKey: user.apiKey || null };
  }

  async regenerateApiKey(userId: string): Promise<string> {
    return this.usersService.regenerateApiKey(userId);
  }

  private async addApiTokenToUserList(userId: string, tokenKey: string) {
    const listKey = `api_tokens:${userId}`;
    const existingList = await this.storageService.get(listKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const tokens: string[] = existingList ? JSON.parse(existingList) : [];
    tokens.push(tokenKey);
    await this.storageService.set(listKey, JSON.stringify(tokens));
  }
}
