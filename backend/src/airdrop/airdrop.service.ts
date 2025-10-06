import { Injectable } from '@nestjs/common';
import { CreateAirdropDto } from './airdrop.dto';

@Injectable()
export class AirdropService {

  createAirdrop(createAirdropDto: CreateAirdropDto): string {
    return 'Airdrop created';
  }
}
