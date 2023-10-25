import { IsObject, IsString } from "@nestjs/class-validator";
import { GetUserDto } from "src/users/dto/get-user.dto";

export class LoggInUser {
  @IsString()
  readonly access_token: string;
  @IsObject()
  readonly user: GetUserDto;
}