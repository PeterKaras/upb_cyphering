import { Module } from '@nestjs/common';
import { MedicalResultsService } from './medical-results.service';
import { AppService } from 'src/app.service';
import { AuthService } from 'src/auth/auth.service';
import { MedicalResultsController } from './medical-results.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from 'src/patient/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';
import { MedicalResults } from './entities/medical-results.entity';
import { PatientService } from 'src/patient/patient.service';
import { UsersService } from 'src/users/users.service';

@Module({
  providers: [MedicalResultsService, AppService, AuthService, UsersService, PatientService],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Patient,
      MedicalResults
    ]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  exports: [MedicalResultsService],
  controllers: [MedicalResultsController]
})
export class MedicalResultsModule {}
