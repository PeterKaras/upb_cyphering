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


  async cypher() {
    const userDto = {
      firstName: 'John',
      lastName: 'Doe',
      text: 'Hello World!'
    }
    const createdUser = this.usersRepository.create(userDto);
    await this.usersRepository.save(createdUser);
    console.log(createdUser);
    return 'Hello World!';
  }
}
