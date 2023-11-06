import { IsEmail, IsString, IsNumber, IsArray } from "@nestjs/class-validator";
import { GetReducedPatientDto } from "src/patient/dto/get-reduced-patient.dto";


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

  @IsArray()
  readonly patients: GetReducedPatientDto[];
}