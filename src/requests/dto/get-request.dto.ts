import { IsNumber, IsObject, IsString } from "@nestjs/class-validator";
import { GetUserDto } from "src/users/dto/get-user.dto";
import { GetReducedPatientDto } from "../../patient/dto/get-reduced-patient.dto";

export class GetRequestDto {
  @IsNumber()
  readonly id: number;

  @IsString()
  readonly birthId: string;

  @IsString()
  readonly reason: string;

  @IsString()
  readonly notes: string;

  @IsString()
  readonly status: string;

  @IsString()
  readonly date: Date | string;

  @IsNumber()
  readonly doctorId: number;
}