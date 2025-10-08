import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CliAuthService } from './cli-auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cli-auth')
export class CliAuthController {
  constructor(private cliAuthService: CliAuthService) {}

  @Public()
  @Post('request')
  async requestAuth() {
    return this.cliAuthService.requestAuth();
  }

  @Public()
  @Get('status/:token')
  async getStatus(@Param('token') token: string) {
    return this.cliAuthService.getVerificationStatus(token);
  }

  @Public()
  @Get('poll/:token')
  async pollStatus(@Param('token') token: string) {
    return this.cliAuthService.pollStatus(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm/:token')
  @HttpCode(HttpStatus.OK)
  async confirmAuth(
    @Param('token') token: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.cliAuthService.confirmAuth(token, user.userId);
    return { message: 'Authentication confirmed' };
  }

  @Public()
  @Post('exchange/:token')
  async exchangeToken(@Param('token') token: string) {
    return this.cliAuthService.exchangeToken(token);
  }
}
