import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import { RequestsService } from "./requests.service";
import { CreateRequestDto } from "./dto/create-request.dto";
import { User } from "../users/entities/user.entity";
import { LoggedInUser } from "../common/decorators/log-in-user.dto";

@SkipThrottle()
@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
  ) {}


  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRequestDto: CreateRequestDto, @LoggedInUser() loggedInUser: User) {
    await this.requestsService.create(createRequestDto, loggedInUser);
  }

}
