import { IsString, IsEmail } from "@nestjs/class-validator";

export class AuthUserDto {

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;
}