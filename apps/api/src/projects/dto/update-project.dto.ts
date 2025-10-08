import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
