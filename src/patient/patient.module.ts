import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { Patient } from './entities/patient.entity';
import { AuthService } from 'src/auth/auth.service';
import { AppService } from 'src/app.service';
import { PatientController } from './patient.controller';

@Module({
  providers: [AppService, PatientService, AuthService],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Patient
    ]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  exports: [PatientService],
  controllers: [PatientController]
})
export class PatientModule {}
