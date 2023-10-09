import { Injectable } from '@nestjs/common';
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {
  }

  async cypher(): Promise<User[]> {
    const users: User[] = await this.usersRepository.find();
    return users;
  }
}
