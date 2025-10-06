import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
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

  @Public()
  @Get('verify')
  async verifyPage(
    @Query('token') token: string,
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CLI Authentication</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 12px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 400px;
              text-align: center;
            }
            h1 {
              color: #333;
              margin-bottom: 1rem;
            }
            .code {
              font-size: 2rem;
              font-weight: bold;
              color: #667eea;
              background: #f3f4f6;
              padding: 1rem;
              border-radius: 8px;
              margin: 1.5rem 0;
              letter-spacing: 2px;
            }
            .message {
              color: #666;
              margin-bottom: 2rem;
              line-height: 1.5;
            }
            .button {
              background: #667eea;
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 8px;
              font-size: 1rem;
              cursor: pointer;
              transition: background 0.3s;
            }
            .button:hover {
              background: #5a67d8;
            }
            .success {
              color: #10b981;
              font-weight: 600;
            }
            .error {
              color: #ef4444;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>CLI Authentication</h1>
            <div class="message">
              Confirm this code matches what's shown in your terminal:
            </div>
            <div class="code">${code}</div>
            <div id="status" class="message">
              Click below to authenticate your CLI session
            </div>
            <button id="confirmBtn" class="button" onclick="confirmAuth()">
              Confirm Authentication
            </button>
          </div>
          <script>
            const token = '${token}';

            async function confirmAuth() {
              const button = document.getElementById('confirmBtn');
              const status = document.getElementById('status');

              button.disabled = true;
              button.textContent = 'Authenticating...';

              try {
                const response = await fetch('/cli-auth/confirm/' + token, {
                  method: 'POST',
                  credentials: 'include',
                });

                if (response.ok) {
                  status.innerHTML = '<div class="success">✓ Authentication successful!</div>';
                  status.innerHTML += '<div class="message">You can now close this window and return to your terminal.</div>';
                  button.style.display = 'none';
                } else if (response.status === 401) {
                  window.location.href = '/auth/login?redirect=/cli-auth/verify?token=' + token + '&code=${code}';
                } else {
                  status.innerHTML = '<div class="error">Authentication failed. Please try again.</div>';
                  button.disabled = false;
                  button.textContent = 'Retry Authentication';
                }
              } catch (error) {
                status.innerHTML = '<div class="error">Network error. Please try again.</div>';
                button.disabled = false;
                button.textContent = 'Retry Authentication';
              }
            }
          </script>
        </body>
      </html>
    `;
    res.type('html').send(html);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm/:token')
  @HttpCode(HttpStatus.OK)
  async confirmAuth(
    @Param('token') token: string,
    @CurrentUser() user,
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