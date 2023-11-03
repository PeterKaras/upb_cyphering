import { IsString, IsEmail } from "@nestjs/class-validator";

export class CypherKeyDto {

  @IsString()
  readonly publicKey: string;
}