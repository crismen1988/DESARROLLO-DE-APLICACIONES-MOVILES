import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RestablecerPasswordDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{40,128}$/)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  passwordNueva!: string;
}
