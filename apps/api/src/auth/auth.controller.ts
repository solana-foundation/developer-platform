import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user) {
    await this.authService.logout(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-token')
  async generateApiToken(@CurrentUser() user) {
    const token = await this.authService.generateApiToken(user.userId);
    return { token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-key')
  async getApiKey(@CurrentUser() user) {
    return this.authService.getUserApiKey(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-key/regenerate')
  async regenerateApiKey(@CurrentUser() user) {
    const newApiKey = await this.authService.regenerateApiKey(user.userId);
    return { apiKey: newApiKey };
  }
}