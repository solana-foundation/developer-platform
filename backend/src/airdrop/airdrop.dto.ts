import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAirdropDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}