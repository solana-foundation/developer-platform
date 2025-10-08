import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class DeployProgramDto {
  @IsString()
  @MaxLength(255)
  projectName: string;

  @IsString()
  @MaxLength(255)
  programName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['devnet', 'testnet', 'mainnet-beta'])
  cluster: string;

  @IsString()
  @IsOptional()
  programPath?: string;
}
