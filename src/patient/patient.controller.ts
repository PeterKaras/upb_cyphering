import { Body, Controller, Post, Put, Param, Get, Res } from "@nestjs/common";
import { PatientService } from "./patient.service";
import { UsersService } from "src/users/users.service";
import { SkipThrottle } from "@nestjs/throttler";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { LoggedInUser } from "src/common/decorators/log-in-user.dto";
import { User } from "src/users/entities/user.entity";
import { EncryptedDataDto } from "src/users/dto/encrypted-data,dto";
import { GetPatientDto } from "./dto/get-patient.dto";
import { GetReducedPatientDto } from "../patient/dto/get-reduced-patient.dto";
import { Patient } from "./entities/patient.entity";
import { Response } from 'express';
import { GetMedicalResultsDto } from "src/medical-results/dto/get-medical-results.dto";

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
  async updatePatientById(@LoggedInUser() loggedInUser: User, @Body() updatePatientDto: GetReducedPatientDto
  ): Promise<undefined> {
    await this.patientsService.updatePatientById(loggedInUser, updatePatientDto);
    return undefined;
  }

  @Post('medicalResults')
  async addMedicalResult(@LoggedInUser() loggedInUser: User, @Body() medicalResult: any): Promise<undefined> {
    await this.patientsService.createMedical(loggedInUser, medicalResult);
    return undefined;
  }

  @Get('medical/:birthId')
  async getMedicalResults(@Param('birthId') birthId: string, @LoggedInUser() user: User): Promise<EncryptedDataDto> {
    const medicalResults: GetMedicalResultsDto[] = await this.patientsService.getMedicalResults(birthId);
    return await this.usersService.cypher(user, medicalResults);
  }

  @Get('generatePdf/:birthId')
  async getPatientById(@Param('birthId') birthId: string, @LoggedInUser() user: User, @Res() res: Response): Promise<any> {
    const pdf = await this.patientsService.generatePdf(birthId);
    const encryptedPdf = await this.usersService.cypher(user, pdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=example.pdf');
    res.setHeader('Content-Length', encryptedPdf.data.length);
    res.send(encryptedPdf);
  }
}
