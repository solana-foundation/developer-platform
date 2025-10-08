import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['devnet', 'testnet', 'mainnet-beta'])
  @IsOptional()
  cluster?: string;
}
