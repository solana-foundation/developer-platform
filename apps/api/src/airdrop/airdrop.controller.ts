import { AirdropService } from './airdrop.service';
import { Controller, Post, Body } from '@nestjs/common';
import { AirdropResponseDto, CreateAirdropDto } from './airdrop.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Post('/airdrop')
  createAirdrop(
    @CurrentUser() user: { userId: string },
    @Body() createAirdropDto: CreateAirdropDto,
  ): Promise<AirdropResponseDto> {
    return this.airdropService.createAirdrop(user.userId, createAirdropDto);
  }
}
