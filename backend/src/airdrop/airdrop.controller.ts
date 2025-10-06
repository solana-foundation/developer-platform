import { AirdropService } from './airdrop.service';
import { Controller, Post, Body } from '@nestjs/common';
import { AirdropResponseDto, CreateAirdropDto } from './airdrop.dto';

@Controller()
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Post('/airdrop')
  createAirdrop(@Body() createAirdropDto: CreateAirdropDto): Promise<AirdropResponseDto> {
    return this.airdropService.createAirdrop(createAirdropDto);
  }
}
