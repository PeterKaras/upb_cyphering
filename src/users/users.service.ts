import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import * as dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';

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

  decryptDataWithSymmetricKey(encryptedData: string, symmetricKey: Buffer): { firstName: string; lastName: string; text: string } {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, symmetricKey, iv);
    let decrypted = decipher.update(encryptedText.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
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
    const parsedData = await this.readJsonFile("output");

    return Promise.all(parsedData.map((user) => {
      const dataToEncrypt = {
        firstName: user.firstName,
        lastName: user.lastName,
        text: user.text,
      }
      const symmetricKey = crypto.randomBytes(32);
      const encryptedData = this.encryptDataWithSymmetricKey(JSON.stringify(dataToEncrypt), symmetricKey);

      console.log("Writing encrypted data to file");
      this.writeDataToJson(encryptedData, 'encryptedData'); // Write encrypted data

      const { publicKey, privateKey } = this.generateKeyPair();
      const encryptedSymmetricKey = this.encryptSymmetricKeyWithPrivateKey(privateKey, symmetricKey);
      const decryptedSymmetricKey = this.decryptSymmetricKeyWithPublicKey(encryptedSymmetricKey, publicKey);
      if (decryptedSymmetricKey.toString() !== symmetricKey.toString()) {
        throw new Error('Symmetric key decryption failed!');
      }

      const decryptedData = this.decryptDataWithSymmetricKey(encryptedData, decryptedSymmetricKey);
      console.log("Writing decrypted data to file");
      this.writeDataToJson(decryptedData, 'decryptedData'); // Write decrypted data

      // ... [rest of the logs and checks]

      return `
      All data integrity checks passed!
      Original: ${dataToEncrypt.firstName}, ${dataToEncrypt.lastName}, ${dataToEncrypt.text}, 
      Encrypted: ${encryptedData}, 
      Decrypted: ${decryptedData.firstName}, ${decryptedData.lastName}, ${decryptedData.text}`;
    }));
  }

  async readJsonFile(fileName: string): Promise<any> {
    const filePath = path.join(__dirname, '../../' + fileName + '.json');
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(rawData);
    } else {
      return JSON.parse("[]");
    }
  }

  async writeDataToJson(data: any, fileName: string) {
    const filePath = path.join(__dirname, '../../' + fileName + '.json');
    let existingData = [];

    // Check if the file exists and read its content
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(rawData);
    }

    // Append the new data to the existing data
    existingData.push(data);

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
  }

  async create(data: { firstName: string; lastName: string; text: string }): Promise<User> {
    const createdUser = await this.usersRepository.create(data);
    return this.usersRepository.save(createdUser);
  }
}
