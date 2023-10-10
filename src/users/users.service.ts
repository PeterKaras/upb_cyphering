import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { createHmac, publicEncrypt, createDecipheriv, randomBytes, generateKeyPairSync } from "crypto";

const crypto = require('crypto');

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {
  }

  async cypher(): Promise<{encryptedData: string, iv: string, encryptedSymmetricKey: string, hmac: string}[]> {
    const users: User[] = await this.usersRepository.find();
    const symmetricKey = this.generateSymmetricKey();

    return Promise.all(users.map(async (user) => {
      const dataToEncrypt = user.firstName + ' ' + user.lastName + ' ' + user.text;
      const algorithm = 'aes-256-cbc';

      // Generate a random IV
      const iv = crypto.randomBytes(16);

      // Encrypting the data
      const cipher = crypto.createCipheriv(algorithm, symmetricKey, iv);
      let encryptedData: string = cipher.update(dataToEncrypt, 'utf8', 'hex');
      encryptedData += cipher.final('hex');

      // Encrypt the symmetric key using the user's public key
      const encryptedSymmetricKey = await this.encryptSymmetricKeyWithPublicKey('' + user.id, symmetricKey);

      // Generate HMAC for encrypted data
      const hmac = this.generateHMAC(encryptedData, symmetricKey);

      return {
        encryptedData,
        iv: iv.toString('hex'),
        encryptedSymmetricKey,
        hmac
      };
    }));
  }

  private generateSymmetricKey(): Buffer {
    return randomBytes(32);  // Generate 32 bytes of random data for AES-256
  }

  async create(user: any): Promise<User> {
    const { publicKey, privateKey } = this.generateUserKeys();

    return await this.usersRepository.save({
      firstName: user.firstName,
      lastName: user.lastName,
      text: user.text,
      publicKey: publicKey,
    });
  }

  private async encryptSymmetricKeyWithPublicKey(userId: string, symmetricKey: Buffer): Promise<string> {
    const userPublicKey = await this.getUserPublicKey(+userId); // You'll need to implement this

    const encryptedKey = publicEncrypt(userPublicKey, symmetricKey);
    return encryptedKey.toString('base64');
  }

  async getUserPublicKey(userId: number): Promise<string> {
    const user = await this.usersRepository.findOne({ where: { id :userId}});
    if (!user) {
      throw new Error('User not found');
    }
    return user.publicKey;
  }

  private decryptData(encryptedData: string, symmetricKey: Buffer, iv: string): string {
    const decipher = createDecipheriv('aes-256-cbc', symmetricKey, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private generateHMAC(data: string, key: Buffer): string {
    const hmac = createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest('hex');
  }

  private verifyHMAC(data: string, receivedHMAC: string, key: Buffer): boolean {
    const computedHMAC = this.generateHMAC(data, key);
    return computedHMAC === receivedHMAC;
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
