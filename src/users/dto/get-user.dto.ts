import { IsEmail, IsString, IsNumber } from "@nestjs/class-validator";


export class GetUserDto {

  @IsNumber()
  readonly id: number;

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