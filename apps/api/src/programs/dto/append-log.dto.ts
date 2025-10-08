import { IsString, IsIn, IsOptional } from 'class-validator';

export class AppendLogDto {
  @IsString()
  message: string;

  @IsString()
  @IsIn(['info', 'warn', 'error'])
  @IsOptional()
  level?: 'info' | 'warn' | 'error';
}
