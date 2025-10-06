import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AirdropService } from './airdrop/airdrop.service';
import { AirdropController } from './airdrop/airdrop.controller';

@Module({
  imports: [],
  controllers: [AppController, AirdropController],
  providers: [AppService, AirdropService],
})
export class AppModule {}
