import { IsString } from 'class-validator';

export class ClaimProgramDto {
  @IsString()
  authorityAddress: string;
}
