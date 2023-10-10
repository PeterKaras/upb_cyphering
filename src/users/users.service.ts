import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import * as dotenv from "dotenv";
import forge from "node-forge";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

dotenv.config();

interface RSAKey {
  modulus: string;
  exponent: string;
}

@Injectable()
export class UsersService {
  private readonly password = process.env.SECRET_KEY;
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly iterations = 10000;

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>
  ) {}

  private deriveKey(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha512');
  }

  private encrypt(data: string, password: string, salt: string) {
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  }

  private decrypt(encryptedKey: string, iv: string, encrypted_key_data: any, salt: string) {
    const password_data = this.decrypt_key(encrypted_key_data.content, encrypted_key_data.iv, salt);

    const key = this.deriveKey(password_data, salt);
    const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private generateUserKeys(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: process.env.SECRET_KEY,
      }
    });
    return { publicKey, privateKey };
  }

  encrypt_key(data: string, salt: string): { iv: string; content: string } {
    const key = scryptSync(this.password, salt, this.keyLength);
    const iv = randomBytes(this.ivLength);

    const cipher = createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {iv: iv.toString('hex'), content: encrypted };
  }

  decrypt_key(encryptedData: string, iv: string, salt: string): string {
    const key = scryptSync(this.password, salt, this.keyLength);

    const decipher = createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async cypher(): Promise<{ iv: string; encryptedKey: string; content: string }[]> {
    const users: User[] = await this.usersRepository.find();

    return Promise.all(users.map((user) => {
      const dataToEncrypt = `${user.firstName} ${user.lastName} ${user.text}`;
      const salt = randomBytes(16);

      //Encrypting data
      const encrypted_data = this.encrypt(dataToEncrypt, user.publicKey, salt.toString('hex'));
      console.log("Encrypted_data:",encrypted_data);

      //Encrypting key
      const encrypted_key_data = this.encrypt_key(user.publicKey, salt.toString('hex'));
      console.log("Encrypted_key_data:",encrypted_key_data);

      //Decrypting data
      const decrypted_data = this.decrypt(encrypted_data.encryptedData, encrypted_data.iv, encrypted_key_data, salt.toString('hex'));
      console.log("Decrypted_data:",decrypted_data);

      return {
        iv: encrypted_data.iv,
        encryptedKey: encrypted_data.encryptedData,
        content: decrypted_data
      };
    }));
  }

  async create(user: any): Promise<User> {
    const { publicKey, privateKey } = this.generateUserKeys();

    return await this.usersRepository.save({
      firstName: user.firstName,
      lastName: user.lastName,
      text: user.text,
      publicKey: publicKey,
      privateKey: privateKey,
    });
  }
}
