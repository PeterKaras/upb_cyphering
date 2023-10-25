import { Body, Controller, Get, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiTags } from "@nestjs/swagger";
import { User } from "./entities/user.entity";
import { GetUserDto } from "./dto/get-user.dto";
import { CreateUserDto } from "./dto/Create-user.dto";

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<GetUserDto> {
    return await this.usersService.create(createUserDto);
  }

  @Get('encrypted')
  async cypher(): Promise<any> {
    return await this.usersService.cypher();
  }
}
