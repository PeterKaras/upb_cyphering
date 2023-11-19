import { IsNumber, IsObject, IsString, isString } from "@nestjs/class-validator";
import { GetReducedPatientDto } from "src/patient/dto/get-reduced-patient.dto";
import { GetUserNoPublicDto } from "src/users/dto/get-user-no-public.dto";

export class GetMedicalResultsDto {

    @IsNumber()
    readonly id: number;

    @IsString()
    readonly birthId: string;

    @IsString()
    readonly title: string;

    @IsString()
    readonly date: string;

    @IsString()
    readonly text: string;
}