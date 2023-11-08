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
      medicalResults: []
    });
    const savedPatient: Patient = await this.patientsRepository.save(createdPatient);

    await this.usersRepository.save({
      ...existingUser,
      patients: [...existingUser.patients, savedPatient]
    });

    return mapPatientToGetPatientDto(savedPatient);
  }
}
