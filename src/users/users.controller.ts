import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards, Put } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiTags } from "@nestjs/swagger";
import { User } from "./entities/user.entity";
import { GetUserDto } from "./dto/get-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { AuthUserDto } from "../auth/dto/auth-user.dto";
import { AuthService } from "src/auth/auth.service";
import { LoggInUser } from "src/auth/dto/log-in-user.dto";
import { Public } from "src/common/decorators/public.decorator";
import { mapUserToGetUserDto } from "./mapper/user.mapper";
import { LocalAuthGuard } from "src/auth/guards/local-auth.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { CypherKeyDto } from "./dto/cypherKey.dto";
import { LoggedInUser } from "../common/decorators/log-in-user.dto";
import { Patient } from "../patient/entities/patient.entity";
import { EncryptedDataDto } from "./dto/encrypted-data,dto";
import { mapPatientToGetReducedPatientDto } from "../patient/mapper/patient.mapper";
import { GetReducedPatientDto } from "../patient/dto/get-reduced-patient.dto";
import { GetPatientDto } from "src/patient/dto/get-patient.dto";

@SkipThrottle()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<GetUserDto> {
    return await this.usersService.create(createUserDto);
  }

  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() user: AuthUserDto): Promise<LoggInUser> {
    return await this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @LoggedInUser() loggedInUser: User,
  ): Promise<GetUserDto> {
      const user = await this.usersService.findOneByEmail(loggedInUser.email);
      return mapUserToGetUserDto(user);
  }

  @Post('updatePublic')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePublic(@Body() body: CypherKeyDto, @LoggedInUser() loggedInUser: User,): Promise<GetUserDto> {
    const user = await this.usersService.updatePublicKey(loggedInUser.email, body.publicKey);
    return mapUserToGetUserDto(user);
  }

  @Post('keyPair')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateNewKeyPair(@LoggedInUser() loggedInUser: User,): Promise<{privateKey: string, publicKey: string}> {
    const keyPair = this.usersService.generateKeyPair();
    await this.usersService.updatePublicKey(loggedInUser.email, keyPair.publicKey)
    return {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey
    };
  }

  @Get('patients')
  @HttpCode(HttpStatus.OK)
  async getPatients(@LoggedInUser() loggedInUser: User): Promise<EncryptedDataDto | GetReducedPatientDto[]> {
    const patients: Patient[] = await this.usersService.findAllPatients(loggedInUser);
    return await this.usersService.cypher(loggedInUser, patients);
  }

  @Get('patients/:birthId')
  @HttpCode(HttpStatus.OK)
  async getPatientById(@LoggedInUser() loggedInUser: User, @Param('birthId') patientId: string): Promise<EncryptedDataDto> {
    const patient = await this.usersService.getOnePatientById(loggedInUser, patientId);
    return await this.usersService.cypher(loggedInUser, patient);
  }

  @Delete('patients/:birthId')
  @HttpCode(HttpStatus.OK)
  async deletePatient(@LoggedInUser() loggedInUser: User, @Param('birthId') patientId: string): Promise<void> {
    await this.usersService.deleteOnePatient(loggedInUser, patientId);
  }
}
