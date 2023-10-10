import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import * as dotenv from "dotenv";

dotenv.config();

@Injectable()
export class UsersService {
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>
  ) {
  }

  private readonly modulusLength = 2048; // Key size

  encryptDataWithSymmetricKey(data: string, symmetricKey: Buffer): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, symmetricKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptDataWithSymmetricKey(encryptedData: string, symmetricKey: Buffer): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, symmetricKey, iv);
    let decrypted = decipher.update(encryptedText.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  encryptSymmetricKeyWithPrivateKey(privateKey: string, symmetricKey: Buffer): string {
    return crypto.privateEncrypt(privateKey, symmetricKey).toString('base64');
  }

  decryptSymmetricKeyWithPublicKey(encryptedKey: string, publicKey: string): Buffer {
    return crypto.publicDecrypt(publicKey, Buffer.from(encryptedKey, 'base64'));
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: this.modulusLength,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    return { publicKey, privateKey };
  }

  async cypher(): Promise<Awaited<string>[]> {
    const users: User[] = await this.usersRepository.find();
    return Promise.all(users.map((user) => {
      const dataToEncrypt = `${user.firstName} ${user.lastName} ${user.text}`;
      const symmetricKey = crypto.randomBytes(32);
      const encryptedData = this.encryptDataWithSymmetricKey(dataToEncrypt, symmetricKey);
      const { publicKey, privateKey } = this.generateKeyPair();
      const encryptedSymmetricKey = this.encryptSymmetricKeyWithPrivateKey(privateKey, symmetricKey);
      const decryptedSymmetricKey = this.decryptSymmetricKeyWithPublicKey(encryptedSymmetricKey, publicKey);
      if (decryptedSymmetricKey.toString() !== symmetricKey.toString()) {
        throw new Error('Symmetric key decryption failed!');
      }
      const decryptedData = this.decryptDataWithSymmetricKey(encryptedData, decryptedSymmetricKey);
      if (decryptedData !== dataToEncrypt) {
        throw new Error('Data integrity verification failed!');
      }

      console.log(`Original: ${dataToEncrypt}, Encrypted: ${encryptedData}, Decrypted: ${decryptedData}`);
      console.log(`Symmetric key: ${symmetricKey.toString('hex')}`);
      console.log(`Encrypted symmetric key: ${encryptedSymmetricKey}`);

      return `Original: ${dataToEncrypt}, Encrypted: ${encryptedData}, Decrypted: ${decryptedData}`;
    }));
  }

  async create(user: any): Promise<User> {
    return await this.usersRepository.save({
      firstName: user.firstName,
      lastName: user.lastName,
      text: user.text,
    });
  }
}
