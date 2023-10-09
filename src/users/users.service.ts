import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

const crypto = require('crypto');

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {
  }

  async cypher(): Promise<{encryptedData: string, iv: string}[]> {
    const users: User[] = await this.usersRepository.find();
    const symmetricKey = this.generateSymmetricKey();

    return users.map((user) => {
      const dataToEncrypt = user.firstName + ' ' + user.lastName + ' ' + user.text;
      const algorithm = 'aes-256-cbc';

      // Generate a random IV
      const iv = crypto.randomBytes(16);

      // Encrypting the data
      const cipher = crypto.createCipheriv(algorithm, symmetricKey, iv);
      let encryptedData = cipher.update(dataToEncrypt, 'utf8', 'hex');
      encryptedData += cipher.final('hex');

      return {
        encryptedData,
        iv: iv.toString('hex') // Storing the IV as a hex string for easy transmission or storage
      };
    });
  }

  private generateSymmetricKey = () => {
    return crypto.randomBytes(32); // 32 bytový kľúč (256 bitov)
  };
}
