import { IsString, IsEmail } from "@nestjs/class-validator";


export class CreateUserDto {

  @IsString()
  readonly firstName: string;

  @IsString()
  readonly lastName: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;

  @IsString()
  readonly confirmationPassword: string;
}