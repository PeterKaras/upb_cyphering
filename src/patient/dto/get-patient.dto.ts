import { IsArray, IsString } from "@nestjs/class-validator";
import { GetMedicalResultsDto } from "src/medical-results/dto/get-medical-results.dto";
import { GetUserNoPublicDto } from "src/users/dto/get-user-no-public.dto";
import { GetUserDto } from "src/users/dto/get-user.dto";

export class GetPatientDto {
  @IsString()
  readonly firstName: string;

  @IsString()
  readonly lastName: string;

  @IsString()
  readonly birthId: string;

  @IsString()
  readonly address: string;

  @IsString()
  readonly diagnosis: string[];

  @IsString()
  readonly allergies: string[];

  @IsArray()
  readonly doctors: GetUserNoPublicDto[];

  @IsArray()
  readonly medicalResults: GetMedicalResultsDto[];
}