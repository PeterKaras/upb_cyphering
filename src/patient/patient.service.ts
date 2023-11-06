import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { mapPatientToGetPatientDto } from './mapper/patient.mapper';
import { GetPatientDto } from './dto/get-patient.dto';

@Injectable()
export class PatientService {
  constructor (
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient) private readonly patientsRepository: Repository<Patient>,
  ) {}

  async createPatient(createPatientDto: CreatePatientDto, loggedInUser: User): Promise<GetPatientDto> {
    const existingPatient = await this.patientsRepository.findOne({
      where: {
        personId: createPatientDto.personId
      }
    });
    if (existingPatient) throw new BadRequestException('Patient already exists');

    const createdPatient: Patient = this.patientsRepository.create({
      ...createPatientDto,
      doctors: [loggedInUser],
      medicalResults: []
    });
    const savedPatient = await this.patientsRepository.save(createdPatient);
    return mapPatientToGetPatientDto(savedPatient);
  }
}
