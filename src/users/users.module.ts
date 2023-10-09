import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AppService } from "../app.service";
import { User } from "./entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  controllers: [UsersController],
  providers: [AppService, UsersService],
  imports: [TypeOrmModule.forFeature([User])],
  exports: [UsersService],
})
export class UsersModule {}
