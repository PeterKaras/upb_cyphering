import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { Patient } from './entities/patient.entity';
import { AuthService } from 'src/auth/auth.service';
import { AppService } from 'src/app.service';
import { PatientController } from './patient.controller';
import { UsersService } from 'src/users/users.service';
import { MedicalResults } from 'src/medical-results/entities/medical-results.entity';
import { RequestEntity } from 'src/requests/entities/request.entity';
import { RequestsService } from 'src/requests/requests.service';

@Module({
  providers: [AppService, PatientService, AuthService, UsersService, RequestsService],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Patient,
      MedicalResults,
      RequestEntity
    ]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  exports: [PatientService],
  controllers: [PatientController]
})
export class PatientModule {}
