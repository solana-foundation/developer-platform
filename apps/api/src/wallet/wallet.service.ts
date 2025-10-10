import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createSolanaRpc, address } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import {
  TokenBalanceDto,
  TokenBalancesResponseDto,
} from './dto/token-balance.dto';

@Injectable()
export class WalletService {
  private rpc: ReturnType<typeof createSolanaRpc>;

  constructor() {
    const rpcUrl = process.env.RPC_URL;

    if (!rpcUrl) {
      throw new Error('RPC_URL environment variable must be set');
    }

    this.rpc = createSolanaRpc(rpcUrl);
  }

  async getTokenBalances(
    walletAddress: string,
    limit?: number,
  ): Promise<TokenBalancesResponseDto> {
    try {
      const owner = address(walletAddress);

      const response = await this.rpc
        .getTokenAccountsByOwner(
          owner,
          { programId: TOKEN_PROGRAM_ADDRESS },
          { encoding: 'jsonParsed' },
        )
        .send();

      let balances: TokenBalanceDto[] = response.value.map((account) => {
        const parsedInfo = account.account.data.parsed.info;
        return new TokenBalanceDto(
          parsedInfo.mint,
          parsedInfo.tokenAmount.uiAmountString,
          parsedInfo.tokenAmount.decimals,
          account.pubkey,
        );
      });

      // Apply limit if provided
      if (limit !== undefined && limit > 0) {
        balances = balances.slice(0, limit);
      }

      return new TokenBalancesResponseDto(walletAddress, balances);
    } catch (error) {
      console.error('[WalletService] Failed to fetch token balances:', {
        error,
        walletAddress,
      });

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        `Failed to fetch token balances: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
