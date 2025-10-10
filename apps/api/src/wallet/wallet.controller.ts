import { Controller, Get, Param, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TokenBalancesResponseDto } from './dto/token-balance.dto';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':address/balances')
  getTokenBalances(
    @Param('address') address: string,
    @Query('limit') limit?: string,
  ): Promise<TokenBalancesResponseDto> {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.walletService.getTokenBalances(address, parsedLimit);
  }
}
