import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAirdropDto {
  @IsString()
  @IsNotEmpty()
  address: string;
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class AirdropResponseDto {
  constructor(signature: string, slot: number) {
    this.signature = signature;
    this.slot = slot;
  }
  @IsString()
  @IsNotEmpty()
  signature: string;
  @IsNumber()
  @IsNotEmpty()
  slot: number;
}
