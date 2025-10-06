import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';
import { AuthService } from '../auth/auth.service';
import { CliAuthSession } from './interfaces/cli-token.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CliAuthService {
  private readonly CLI_TOKEN_TTL = 300; // 5 minutes
  private readonly POLL_TOKEN_TTL = 3600; // 1 hour

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async requestAuth(): Promise<{
    token: string;
    verificationUrl: string;
    userCode: string;
  }> {
    const token = uuidv4();
    const userCode = this.generateUserCode();
    const baseUrl = this.configService.get<string>(
      'BASE_URL',
      'http://localhost:3000',
    );

    const session: CliAuthSession = {
      token,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.CLI_TOKEN_TTL * 1000),
      browserUrl: `${baseUrl}/cli-auth/verify?token=${token}&code=${userCode}`,
    };

    await this.storageService.set(
      `cli_auth:${token}`,
      JSON.stringify(session),
      this.CLI_TOKEN_TTL,
    );

    await this.storageService.set(
      `cli_code:${userCode}`,
      token,
      this.CLI_TOKEN_TTL,
    );

    return {
      token,
      verificationUrl: session.browserUrl,
      userCode,
    };
  }

  async getVerificationStatus(
    token: string,
  ): Promise<{ status: string; message: string }> {
    const sessionData = await this.storageService.get(`cli_auth:${token}`);
    if (!sessionData) {
      throw new NotFoundException(
        'Authentication session not found or expired',
      );
    }

    const session = JSON.parse(sessionData) as CliAuthSession;

    return {
      status: session.status,
      message: this.getStatusMessage(session.status),
    };
  }

  async confirmAuth(token: string, userId: string): Promise<void> {
    const sessionData = await this.storageService.get(`cli_auth:${token}`);
    if (!sessionData) {
      throw new NotFoundException(
        'Authentication session not found or expired',
      );
    }

    const session = JSON.parse(sessionData) as CliAuthSession;
    if (session.status !== 'pending') {
      throw new UnauthorizedException('Session already processed');
    }

    session.status = 'verified';
    session.userId = userId;

    await this.storageService.set(
      `cli_auth:${token}`,
      JSON.stringify(session),
      this.POLL_TOKEN_TTL,
    );
  }

  async exchangeToken(
    token: string,
  ): Promise<{ apiToken: string; userId: string }> {
    const sessionData = await this.storageService.get(`cli_auth:${token}`);
    if (!sessionData) {
      throw new NotFoundException(
        'Authentication session not found or expired',
      );
    }

    const session = JSON.parse(sessionData) as CliAuthSession;

    if (session.status !== 'verified') {
      throw new UnauthorizedException('Session not verified');
    }

    if (!session.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const apiToken = await this.authService.generateApiToken(session.userId);

    await this.storageService.del(`cli_auth:${token}`);

    return {
      apiToken,
      userId: session.userId,
    };
  }

  async verifyByCode(code: string): Promise<{ token: string }> {
    const token = await this.storageService.get(`cli_code:${code}`);
    if (!token) {
      throw new NotFoundException('Invalid or expired verification code');
    }

    await this.storageService.del(`cli_code:${code}`);

    return { token };
  }

  async pollStatus(token: string): Promise<{
    status: 'pending' | 'verified' | 'expired';
    apiToken?: string;
    userId?: string;
  }> {
    const sessionData = await this.storageService.get(`cli_auth:${token}`);
    if (!sessionData) {
      return { status: 'expired' };
    }

    const session = JSON.parse(sessionData) as CliAuthSession;

    if (session.status === 'verified' && session.userId) {
      const result = await this.exchangeToken(token);
      return {
        status: 'verified',
        apiToken: result.apiToken,
        userId: result.userId,
      };
    }

    return { status: session.status };
  }

  private generateUserCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case 'pending':
        return 'Waiting for browser verification';
      case 'verified':
        return 'Successfully verified';
      case 'expired':
        return 'Session expired';
      default:
        return 'Unknown status';
    }
  }
}
