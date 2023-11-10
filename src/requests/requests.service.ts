import { Injectable } from '@nestjs/common';
import { User } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { RequestEntity } from "./entities/request.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { mapRequestToGetRequestDto } from "./mapper/request.mapper";
import { GetRequestDto } from "./dto/get-request.dto";

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(RequestEntity) private readonly requestRepository: Repository<RequestEntity>,
  ) {
  }

  async create(createRequestDto: CreateRequestDto, loggedInUser: User): Promise<void> {
    if (createRequestDto.notes.length === 0) {
      throw new Error('Notes cannot be empty');
    }

    if (createRequestDto.reason.length === 0) {
      throw new Error('Reason cannot be empty');
    }

    const request = this.requestRepository.create({
      ...createRequestDto,
      date: (new Date()).toString(),
      doctorId: loggedInUser.id,
    });
    await this.requestRepository.save(request);
  }
}
