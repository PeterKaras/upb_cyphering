import { IsArray, IsString } from "@nestjs/class-validator";
import { GetMedicalResultsDto } from "src/medical-results/dto/get-medical-results.dto";

export class GetReducedPatientDto {
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
  readonly medicalResults: GetMedicalResultsDto[];
}