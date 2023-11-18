import { Body, Controller, Post, Put, Param } from "@nestjs/common";
import { PatientService } from "./patient.service";
import { UsersService } from "src/users/users.service";
import { SkipThrottle } from "@nestjs/throttler";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { LoggedInUser } from "src/common/decorators/log-in-user.dto";
import { User } from "src/users/entities/user.entity";
import { EncryptedDataDto } from "src/users/dto/encrypted-data,dto";
import { GetPatientDto } from "./dto/get-patient.dto";
import { GetReducedPatientDto } from "../patient/dto/get-reduced-patient.dto";
import { mapPatientToGetReducedPatientDto } from "../patient/mapper/patient.mapper";

@SkipThrottle()
@Controller('patient')
export class PatientController {
  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientService
  ) {}

  @Post()
  async createPatient(@Body() createPatientDto: CreatePatientDto, @LoggedInUser() user: User): Promise<EncryptedDataDto> {
    const patient: GetPatientDto = await this.patientsService.createPatient(createPatientDto, user);
    return await this.usersService.cypher(user, patient);
  }

  @Put(':birthId')
  async updatePatientById(@LoggedInUser() loggedInUser: User, @Param('birthId') patientId: string, @Body() updatePatientDto: GetReducedPatientDto
  ): Promise<GetReducedPatientDto> {
    const updatedPatient = await this.patientsService.updatePatientById(loggedInUser, patientId, updatePatientDto);
    return mapPatientToGetReducedPatientDto(updatedPatient);
  }
}
