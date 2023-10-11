import { Controller, Get } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiTags } from "@nestjs/swagger";
import { User } from "./entities/user.entity";

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}


  @Get('encrypted')
  async cypher(): Promise<any> {
    return await this.usersService.cypher();
  }
}
