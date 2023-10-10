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
  private symmetricKey = crypto.randomBytes(32); // Generovanie symetrického kľúča

  encryptDataWithSymmetricKey(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.symmetricKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Ukladanie IV spolu s šifrovanými dátami
  }

  decryptDataWithSymmetricKey(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.symmetricKey, iv);
    let decrypted = decipher.update(encryptedText.toString('hex'), 'hex', 'utf8');

    decrypted += decipher.final('utf8');
    return decrypted;
  }

  encryptSymmetricKeyWithPublicKey(publicKey: string): string {
    return crypto.publicEncrypt(publicKey, this.symmetricKey).toString('base64');
  }

  decryptSymmetricKeyWithPrivateKey(encryptedKey: string, privateKey: string): Buffer {
    return crypto.privateDecrypt(privateKey, Buffer.from(encryptedKey, 'base64'));
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
      const encryptedData = this.encryptDataWithSymmetricKey(dataToEncrypt);
      const { publicKey, privateKey } = this.generateKeyPair();
      const encryptedSymmetricKey = this.encryptSymmetricKeyWithPublicKey(publicKey);

      // Dešifrovanie symetrického kľúča s privátnym kľúčom
      const decryptedSymmetricKey = this.decryptSymmetricKeyWithPrivateKey(encryptedSymmetricKey, privateKey);

      // Overenie, či dešifrovaný symetrický kľúč je rovnaký ako pôvodný
      if (decryptedSymmetricKey.toString() !== this.symmetricKey.toString()) {
        throw new Error('Symmetric key decryption failed!');
      }

      const decryptedData = this.decryptDataWithSymmetricKey(encryptedData);

      // Overenie integrity dát
      if (decryptedData !== dataToEncrypt) {
        throw new Error('Data integrity verification failed!');
      }
      console.log('Original: ', dataToEncrypt);
      console.log('Encrypted: ', encryptedData);
      console.log('Decrypted: ', decryptedData);
      console.log('Decrypted symmetric key: ', decryptedSymmetricKey.toString());
      console.log('Original symmetric key: ', this.symmetricKey.toString());
      console.log("--------------------------------------------------------------")
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
