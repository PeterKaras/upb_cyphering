import { IsString } from "class-validator";

export class CreateRequestDto {
  @IsString()
  readonly reason: string;

  @IsString()
  readonly notes: string;

  @IsString()
  readonly birthId: string;
}