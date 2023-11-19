import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { mapPatientToGetPatientDto } from './mapper/patient.mapper';
import { GetPatientDto } from './dto/get-patient.dto';
import { GetReducedPatientDto } from './dto/get-reduced-patient.dto';
import { MedicalResults } from 'src/medical-results/entities/medical-results.entity';
import { Update } from '@reduxjs/toolkit';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { GetMedicalResultsDto } from 'src/medical-results/dto/get-medical-results.dto';
import { mapMedicalResultToGetMedicalResultDto } from 'src/medical-results/mapper/medical-result.mapper';
import { RequestEntity } from 'src/requests/entities/request.entity';
import * as PDFDocument from 'pdfkit';
import * as blobStream from 'blob-stream';

@Injectable()
export class PatientService {
  constructor (
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient) private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(MedicalResults) private readonly medicalResultsRepository: Repository<MedicalResults>,
    @InjectRepository(RequestEntity) private readonly requestRepository: Repository<RequestEntity>,
  ) {}

  async createPatient(createPatientDto: CreatePatientDto, loggedInUser: User): Promise<GetPatientDto> {
    const existingPatient: Patient = await this.patientsRepository.findOne({
      where: {
        birthId: createPatientDto.birthId.toString()
      }
    });
    if (existingPatient) throw new BadRequestException('Patient already exists');

    const existingUser: User = await this.usersRepository.findOne({
      where: {
        email: loggedInUser.email
      },
      relations: ['patients']
    });

    if (!existingUser) throw new BadRequestException('User does not exist');

    const createdPatient: Patient = this.patientsRepository.create({
      ...createPatientDto,
      allergies: JSON.stringify(createPatientDto.allergies),
      diagnosis: JSON.stringify(createPatientDto.diagnosis),
      doctors: [loggedInUser],
    });
    const savedPatient: Patient = await this.patientsRepository.save(createdPatient);

    await this.usersRepository.save({
      ...existingUser,
      patients: [...existingUser.patients, savedPatient]
    });

    return mapPatientToGetPatientDto(savedPatient);
  }

  async updatePatientById(loggedInUser: User, updatePatientDto: UpdatePatientDto): Promise<undefined> {
    const publicKey = loggedInUser.publicKey;
    if (!publicKey) throw new BadRequestException('User has no public key');
  
    const userDb = await this.usersRepository.findOne({
      relations: ['patients'],
      where: { id: loggedInUser.id },
    });
  
    if (!userDb) throw new BadRequestException('User not found');
  
    const patient: Patient = await this.patientsRepository.findOne({
      where: {
        birthId: updatePatientDto.birthId,
      },
      relations: ['doctors'],
    });
  
    if (!patient) throw new BadRequestException('Patient not found');
  
    const savedPatient = await this.patientsRepository.save({
      ...updatePatientDto,
      diagnosis: JSON.stringify(updatePatientDto.diagnosis),
      allergies: JSON.stringify(updatePatientDto.allergies),
    });
  
    return undefined;
  }
  
  async createMedical(loggedInUser: User, updateMedicalResultDto: any): Promise<undefined> {
    const publicKey = loggedInUser.publicKey;
    if (!publicKey) throw new BadRequestException('User has no public key');
  
    const userDb = await this.usersRepository.findOne({
      relations: ['patients'],
      where: { id: loggedInUser.id },
    });
  
    if (!userDb) throw new BadRequestException('User not found');
  
    const patient: Patient = await this.patientsRepository.findOne({
      where: {
        birthId: updateMedicalResultDto.birthId,
      },
      relations: ['doctors'],
    });
  
    if (!patient) throw new BadRequestException('Patient not found');
  
    await Promise.all(updateMedicalResultDto.medicalResults.map(async (medicalResult: any) => {
      if (!medicalResult.id) {
        const created: MedicalResults = this.medicalResultsRepository.create({
          title: medicalResult.title,
          text: medicalResult.text,
          date: medicalResult.date,
          birthId: updateMedicalResultDto.birthId,
        });
  
        await this.medicalResultsRepository.save(created);
      }
    }));
    return undefined;
  }

  async getMedicalResults(birthId: string): Promise<GetMedicalResultsDto[]> {
    const medicals: MedicalResults[] = await this.medicalResultsRepository.find();
    const filtered = medicals.filter((medical: MedicalResults) => medical.birthId === birthId);
    return filtered.map((medical) => mapMedicalResultToGetMedicalResultDto(medical));
  }

  async generatePdf(birthId: string): Promise<any> {
    const patient: Patient = await this.patientsRepository.findOne({
      where: {
        birthId: birthId,
      }
    });
    const requests = await this.requestRepository.find();
    const filteredRequests = requests.filter((request: RequestEntity) => request.birthId === birthId);
    const medicals: MedicalResults[] = await this.medicalResultsRepository.find();
    const filtered = medicals.filter((medical: MedicalResults) => medical.birthId === birthId);
    const pdfDoc = new PDFDocument();
    const chunks: Buffer[] = [];

    const data = {
      birthId: patient.birthId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      diagnosis: patient.diagnosis,
      allergies: patient.allergies,
      doctors: patient.doctors,
      medicals: filtered,
      threatmentRequests: filteredRequests,
    }
    pdfDoc.text(JSON.stringify(data, null, 2));

    // Collect chunks of the PDF
    pdfDoc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // End the PDF and resolve with the buffer
    return new Promise<Buffer>((resolve) => {
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      pdfDoc.end();
    });
  }
}
