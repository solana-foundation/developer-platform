import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  programAddress: string;

  @IsString()
  @IsIn(['devnet', 'testnet', 'mainnet-beta'])
  @IsOptional()
  cluster?: string;

  @IsOptional()
  expiresAt?: Date;
}
