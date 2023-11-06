import { IsString } from "@nestjs/class-validator";

export class EncryptedDataDto {
  @IsString()
  readonly data: string;

  @IsString()
  readonly key: string;
}