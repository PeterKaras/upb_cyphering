import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { Patient } from "../patient/entities/patient.entity";
import { JwtModule } from "@nestjs/jwt";
import { RequestEntity } from "./entities/request.entity";
import { AppService } from "../app.service";

@Module({
  providers: [AppService, RequestsService],
  controllers: [RequestsController],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Patient,
      RequestEntity,
    ]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  exports: [RequestsService],
})
export class RequestsModule {}
