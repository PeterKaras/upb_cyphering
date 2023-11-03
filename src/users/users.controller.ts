import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiTags } from "@nestjs/swagger";
import { User } from "./entities/user.entity";
import { GetUserDto } from "./dto/get-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { AuthUserDto } from "../auth/dto/auth-user.dto";
import { AuthService } from "src/auth/auth.service";
import { LoggInUser } from "src/auth/dto/log-in-user.dto";
import { Public } from "src/common/decorators/pubic.decorator";
import { LoggedInUser } from "src/common/decorators/log-in-user.dto";
import { mapUserToGetUserDto } from "./mapper/user.mapper";
import { LocalAuthGuard } from "src/auth/guards/local-auth.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { CypherKeyDto } from "./dto/cypherKey.dto";

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

  @HttpCode(HttpStatus.OK)
  @Get('encrypted')
  async cypher(): Promise<any> {
    return await this.usersService.cypher();
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
}
