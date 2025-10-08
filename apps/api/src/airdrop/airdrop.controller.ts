import { AirdropService } from './airdrop.service';
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AirdropResponseDto, CreateAirdropDto } from './airdrop.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AirdropUsageDailyRepository } from './repositories/airdrop-usage-daily.repository';
import { AirdropsRepository } from './repositories/airdrops.repository';

@Controller()
export class AirdropController {
  constructor(
    private readonly airdropService: AirdropService,
    private readonly airdropUsageDailyRepository: AirdropUsageDailyRepository,
    private readonly airdropsRepository: AirdropsRepository,
  ) {}

  @Post('/airdrop')
  createAirdrop(
    @CurrentUser() user: { userId: string },
    @Body() createAirdropDto: CreateAirdropDto,
  ): Promise<AirdropResponseDto> {
    // TODO: Extract API key from request context if API key auth is used
    return this.airdropService.createAirdrop(user.userId, createAirdropDto);
  }

  @Get('/airdrop/usage')
  async getUsageStats(@CurrentUser() user: { userId: string }) {
    const stats = await this.airdropService.getUserUsageStats(user.userId);
    return { usage: stats };
  }

  @Get('/airdrop/usage/history')
  async getUsageHistory(
    @CurrentUser() user: { userId: string },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Default to last 30 days if not specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyRecords =
      await this.airdropUsageDailyRepository.findByUserAndDateRange(
        user.userId,
        start,
        end,
      );

    const aggregated =
      await this.airdropUsageDailyRepository.getAggregatedStats(
        user.userId,
        start,
        end,
      );

    return {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      aggregated,
      daily: dailyRecords,
    };
  }

  @Get('/airdrop/history')
  async getAirdropHistory(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    // Get paginated airdrops
    const airdrops = await this.airdropsRepository.listByUser(
      user.userId,
      parsedLimit,
      parsedOffset,
    );

    // Get total count for pagination
    const total = await this.airdropsRepository.countByUser(user.userId);

    // Format for UI with Solscan explorer links
    const formattedAirdrops = airdrops.map((airdrop) => ({
      id: airdrop.id,
      signature: airdrop.signature,
      recipient: airdrop.recipient,
      amount: airdrop.amount,
      status: airdrop.status,
      createdAt: airdrop.createdAt.toISOString(),
      explorerUrl: `https://solscan.io/tx/${airdrop.signature}?cluster=devnet`,
    }));

    return {
      airdrops: formattedAirdrops,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total,
      },
    };
  }
}
