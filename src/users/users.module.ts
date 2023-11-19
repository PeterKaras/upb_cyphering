import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from '../app.service';
import { JwtModule } from '@nestjs/jwt';
import { config } from 'dotenv';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { Patient } from 'src/patient/entities/patient.entity';
import { RequestEntity } from 'src/requests/entities/request.entity';
config();

@Module({
  providers: [AppService, UsersService, AuthService],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Patient,
      RequestEntity
    ]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
