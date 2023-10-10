import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { createDecipheriv, createHmac, generateKeyPairSync, publicDecrypt, publicEncrypt, randomBytes } from "crypto";
import {  scryptSync, createCipheriv } from 'crypto';
import * as dotenv from 'dotenv';

const crypto = require('crypto');

dotenv.config();

@Injectable()
export class UsersService {
  private readonly password = process.env.SECRET_KEY; // This should be kept safe and possibly moved to .env
  private readonly algorithm = 'aes-256-cbc';
  private readonly hmacSecret = process.env.HMAC_SECRET;
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly salt = Buffer.from(process.env.SECRET_SALT, 'utf8');

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {
  }

  async cypher(): Promise<Awaited<{ salt: Buffer; iv: string }>[]> {
    const users: User[] = await this.usersRepository.find();

    return Promise.all(users.map(async (user) => {
      const dataToEncrypt = user.firstName + ' ' + user.lastName + ' ' + user.text;

      const encrypted_data = this.encrypt(dataToEncrypt);
      const decrypted_data = this.decrypt(encrypted_data.content, encrypted_data.iv, encrypted_data.hmac);

      return {
        salt: this.salt,
        iv: encrypted_data.iv,
        content: encrypted_data.content,
      };
    }));
  }

  encrypt(data: string): { hmac: string; iv: string; content: string } {
    const key = scryptSync(this.password, this.salt, this.keyLength);
    const iv = randomBytes(this.ivLength);

    const cipher = createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Compute HMAC over the encrypted data
    const hmac = createHmac('sha256', this.hmacSecret);
    hmac.update(encrypted);
    const hash = hmac.digest('hex');

    return { iv: iv.toString('hex'), content: encrypted, hmac: hash };
  }

  decrypt(encryptedData: string, iv: string, hmacValue: string): string {
    // First, validate the HMAC
    const hmac = createHmac('sha256', this.hmacSecret);
    hmac.update(encryptedData);
    const hash = hmac.digest('hex');

    if (hash !== hmacValue) {
      throw new Error('Data integrity verification failed!');
    }

    const key = scryptSync(this.password, this.salt, this.keyLength);
    const decipher = createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
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

  generateUserKeys() {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'top secret'
      }
    });

    return { publicKey, privateKey };
  }
}
