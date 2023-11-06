import { IsString } from "class-validator";

export class CreatePatientDto {
  @IsString()
  readonly firstName: string;

  @IsString()
  readonly lastName: string;

  @IsString()
  readonly personId: number;

  @IsString()
  readonly address: string;

  @IsString()
  readonly diagnosis: string[];

  @IsString()
  readonly allergies: string[];
}