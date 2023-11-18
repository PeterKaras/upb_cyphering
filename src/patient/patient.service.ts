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

@Injectable()
export class PatientService {
  constructor (
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient) private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(MedicalResults) private readonly medicalResultsRepository: Repository<MedicalResults>,
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
/*
  async updatePatientById(loggedInUser: User, birthId: string, updatePatientDto: GetReducedPatientDto) {
    const publicKey = loggedInUser.publicKey;
    if (!publicKey) throw new BadRequestException('User has no public key');

    const userDb = await this.usersRepository.findOne({
      relations: ['patients'],
      where: { id: loggedInUser.id },
    });

    if (!userDb) throw new BadRequestException('User not found');

    const patient: Patient = await this.patientsRepository.findOne({
      where: {
        birthId: birthId.toString()
      }
    });
    if (!patient) throw new BadRequestException('Patient not found');
    
    patient.firstName = updatePatientDto.firstName ?? patient.firstName;
    patient.lastName = updatePatientDto.lastName ?? patient.lastName;
    patient.address = updatePatientDto.address ?? patient.address;
    patient.diagnosis = updatePatientDto.diagnosis ? JSON.stringify(updatePatientDto.diagnosis) : patient.diagnosis;
    patient.allergies = updatePatientDto.allergies ? JSON.stringify(updatePatientDto.allergies) : patient.allergies;
    // medical record...
    
    for (const resultDto of updatePatientDto.medicalResults) {
      let resultEntity: MedicalResults;
      if (resultDto.id) {
        resultEntity = await this.medicalResultsRepository.findOne({
          where: {
            id: resultDto.id          }
        });
        if (!resultEntity) {
          throw new BadRequestException('Medical Result not found');
        }
      } else {
        /*resultEntity = this.medicalResultsRepository.create();
        resultEntity.date = new Date().toISOString(); 
        resultEntity.patient = patient;
        resultEntity.doctor = loggedInUser; 
        resultEntity = this.medicalResultsRepository.create({
          date: new Date().toISOString(),
          patient: patient,
          doctor: loggedInUser
        });
      }
      resultEntity.title = resultDto.title ?? resultEntity.title;
      resultEntity.text = resultDto.text ?? resultEntity.text;
      await this.medicalResultsRepository.save(resultEntity);
    }
    await this.usersRepository.save({
      ...patient,
      medicalResults: [...patient.medicalResults, resultEntity]
    })

    await this.usersRepository.save(patient);
    await this.usersRepository.save(userDb);
    return patient;
  }*/

  async updatePatientById(loggedInUser: User, birthId: string, updatePatientDto: GetReducedPatientDto) {
    const publicKey = loggedInUser.publicKey;
    if (!publicKey) throw new BadRequestException('User has no public key');

    const userDb = await this.usersRepository.findOne({
      relations: ['patients'],
      where: { id: loggedInUser.id },
    });

    if (!userDb) throw new BadRequestException('User not found');
    const patientIndex = userDb.patients.findIndex(patient => patient.birthId === birthId);
    if (patientIndex === -1) {
      throw new BadRequestException('Patient not found');
    }

    const patient = userDb.patients[patientIndex];
    patient.firstName = updatePatientDto.firstName ?? patient.firstName;
    patient.lastName = updatePatientDto.lastName ?? patient.lastName;
    patient.address = updatePatientDto.address ?? patient.address;
    patient.diagnosis = updatePatientDto.diagnosis ? JSON.stringify(updatePatientDto.diagnosis) : patient.diagnosis;
    patient.allergies = updatePatientDto.allergies ? JSON.stringify(updatePatientDto.allergies) : patient.allergies;
    // medical record...

    for (const resultDto of updatePatientDto.medicalResults) {
      let resultEntity: MedicalResults;
      console.log(resultDto)
      if (resultDto.id) {
        resultEntity = await this.medicalResultsRepository.findOne({
          where: {
            id: resultDto.id          }
        });
        if (!resultEntity) {
          throw new BadRequestException('Medical Result not found');
        }
      } else {
        resultEntity = this.medicalResultsRepository.create({
          date: new Date().toISOString(),
          patient: patient,
          doctor: loggedInUser
        });
      }
      resultEntity.title = resultDto.title ?? resultEntity.title;
      resultEntity.text = resultDto.text ?? resultEntity.text;
      
      // Causes an error
      //await this.medicalResultsRepository.save(resultEntity);

      /*await this.usersRepository.save({
      ...patient,
      medicalResults: [...patient.medicalResults, resultEntity]
      })*/
    }
    //await this.usersRepository.save(patient);
    await this.usersRepository.save(userDb);
    return userDb.patients[patientIndex]
  }
}
