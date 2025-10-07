import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Delete,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiKeysService } from './services/api-keys.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { SafeUser } from '../users/interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private apiKeysService: ApiKeysService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req: { user: SafeUser }) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: SafeUser): SafeUser {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: { userId: string }) {
    await this.authService.logout(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-token')
  async generateApiToken(@CurrentUser() user: { userId: string }) {
    const token = await this.authService.generateApiToken(user.userId);
    return { token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-key')
  async getApiKey(@CurrentUser() user: { userId: string }) {
    return this.authService.getUserApiKey(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-key/regenerate')
  async regenerateApiKey(@CurrentUser() user: { userId: string }) {
    const newApiKey = await this.authService.regenerateApiKey(user.userId);
    return { apiKey: newApiKey };
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-keys')
  async listApiKeys(@CurrentUser() user: { userId: string }) {
    const keys = await this.apiKeysService.listUserApiKeys(user.userId);
    return { apiKeys: keys };
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-keys')
  async createApiKey(
    @CurrentUser() user: { userId: string },
    @Body('name') name: string,
  ) {
    const token = await this.apiKeysService.generateApiKey(user.userId, name);
    return { token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-keys/:keyId/usage')
  async getApiKeyUsage(
    @CurrentUser() user: { userId: string },
    @Param('keyId') keyId: string,
  ) {
    // Verify the key belongs to the user
    const userId = await this.apiKeysService.validateApiKey(keyId);
    if (userId !== user.userId) {
      throw new HttpException(
        'API key not found or access denied',
        HttpStatus.FORBIDDEN,
      );
    }

    const stats = await this.apiKeysService.getUsageStats(keyId);
    return { usage: stats };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('api-keys/:keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeApiKey(
    @CurrentUser() user: { userId: string },
    @Param('keyId') keyId: string,
  ) {
    await this.apiKeysService.revokeApiKey(user.userId, keyId);
  }
}
