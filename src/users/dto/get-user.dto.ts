import { IsEmail, IsString } from "@nestjs/class-validator";


export class GetUserDto {

  @IsString()
  readonly firstName: string;

  @IsString()
  readonly lastName: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly text: string;

  @IsString()
  readonly publicKey: string;
}