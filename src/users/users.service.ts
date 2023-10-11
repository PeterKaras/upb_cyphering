import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import * as dotenv from "dotenv";
import * as CryptoJS from "crypto-js"; // Import crypto-js

dotenv.config();

@Injectable()
export class UsersService {
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>
  ) {
  }

  private readonly modulusLength = 2048; // Key size

  encryptDataWithSymmetricKey(data: string, symmetricKey: string): string {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(data, symmetricKey, {
      iv: iv,
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return iv.toString() + ':' + encrypted.toString();
  }

  decryptDataWithSymmetricKey(encryptedData: string, symmetricKey: string): { firstName: string; lastName: string; text: string } {
    const parts = encryptedData.split(':');
    const iv = CryptoJS.enc.Hex.parse(parts.shift());
    const encryptedText = parts.join(':');
    const decrypted = CryptoJS.AES.decrypt(encryptedText, symmetricKey, {
      iv: iv,
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  }

  encryptSymmetricKeyWithPrivateKey(privateKey: string, symmetricKey: string): string {
    const encrypted = CryptoJS.AES.encrypt(symmetricKey, privateKey);
    return encrypted.toString();
  }

  decryptSymmetricKeyWithPublicKey(encryptedKey: string, publicKey: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, publicKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyPair = CryptoJS.SHA256(CryptoJS.lib.WordArray.random(32)).toString();
    return { publicKey: keyPair, privateKey: keyPair };
  }

  async cypher(): Promise<any> {
    const users: User[] = await this.usersRepository.find();
    return Promise.all(users.map((user) => {
      const dataToEncrypt = {
        firstName: user.firstName,
        lastName: user.lastName,
        text: user.text,
      }
      const symmetricKey = CryptoJS.lib.WordArray.random(32).toString();
      const encryptedData = this.encryptDataWithSymmetricKey(JSON.stringify(dataToEncrypt), symmetricKey);
      const { publicKey, privateKey } = this.generateKeyPair();
      const encryptedSymmetricKey = this.encryptSymmetricKeyWithPrivateKey(privateKey, symmetricKey);

      return {
        original: dataToEncrypt,
        encrypted: encryptedData,
        encryptedSymmetricKey,
        publicKey,
      }
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
