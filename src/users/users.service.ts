import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import * as dotenv from 'dotenv'
import * as crypto from "crypto";
import * as CryptoJS from 'crypto-js' // Import crypto-js
import { CreateUserDto } from './dto/create-user.dto'
import * as fs from "fs";
import * as path from "path";
import { mapUserToGetUserDto } from './mapper/user.mapper'
import { GetUserDto } from './dto/get-user.dto'
import * as zxcvbn from "zxcvbn";
import { AuthUserDto } from '../auth/dto/auth-user.dto'

dotenv.config()

@Injectable()
export class UsersService {
  constructor (
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  private readonly modulusLength = 2048;

  encryptDataWithSymmetricKey (data: string, symmetricKey: string): string {
    const iv = CryptoJS.lib.WordArray.random(16)
    const encrypted = CryptoJS.AES.encrypt(data, symmetricKey, {
      iv: iv,
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.Pkcs7,
    })

    return iv.toString() + ':' + encrypted.toString()
  }

  decryptDataWithSymmetricKey (
    encryptedData: string,
    symmetricKey: string,
  ): { firstName: string; lastName: string; text: string } {
    const parts = encryptedData.split(':')
    const iv = CryptoJS.enc.Hex.parse(parts.shift())
    const encryptedText = parts.join(':')
    const decrypted = CryptoJS.AES.decrypt(encryptedText, symmetricKey, {
      iv: iv,
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.Pkcs7,
    })

    const decryptedData = decrypted.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decryptedData)
  }

  encryptSymmetricKeyWithPublicKey (
    publicKey: string,
    symmetricKey: string,
  ): string {
    const encrypted = CryptoJS.AES.encrypt(symmetricKey, publicKey)
    return encrypted.toString()
  }

  decryptSymmetricKeyWithPrivateKey (
    encryptedKey: string,
    privateKey: string,
  ): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, privateKey)
    return decrypted.toString(CryptoJS.enc.Utf8)
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
    const newPublicKey = publicKey.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').trim();
    const newPrivateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').trim();
    return { publicKey: newPublicKey, privateKey: newPrivateKey };
  }

  async cypher (): Promise<any> {
    // decorator LoggInUser, check if public key is not null
    // if not null, encrypt symmetric key with public key
    // if null, return error with corresponding message to create public key
    const users: User[] = await this.usersRepository.find()
    return Promise.all(
      users.map(user => {
        const dataToEncrypt = {
          firstName: user.firstName,
          lastName: user.lastName,
          text: user.text,
        }
        const symmetricKey = CryptoJS.lib.WordArray.random(32).toString()
        const encryptedData = this.encryptDataWithSymmetricKey(
          JSON.stringify(dataToEncrypt),
          symmetricKey,
        )

        // const encryptedSymmetricKey = this.encryptSymmetricKeyWithPrivateKey(
        //   publicKey,
        //   symmetricKey,
        // )

        return {
          original: dataToEncrypt,
          encrypted: encryptedData,
          // encryptedSymmetricKey,
          // publicKey,
        }
      }),
    )
  }

  async create (user: CreateUserDto): Promise<GetUserDto | undefined> {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
    const passwordStrength = zxcvbn(user.password);
    const data = fs.readFileSync(
      path.join(__dirname, '..', '..', '10-million-password-list-top-100000.txt'),
      'utf8',
    )

    const existingUser = await this.usersRepository.findOne({
      where: { email: user.email },
    })

    if (existingUser) {
      throw new BadRequestException('Could not create user with specified data');
    }

    if (passwordStrength.score < 2.5) {
      // Password is weak; score 0 to 2 means weak, and 3 to 4 means strong
      throw new BadRequestException('Password is too weak, please choose a stronger one.');
    }

    const passwordList = data.split('\n')
    const cleanedPasswordList = passwordList.map(password => password.trim());
    const matchPassword = cleanedPasswordList.filter(password => password === user.password);
    if(matchPassword.length > 0) {
      throw new BadRequestException('Password is too common, please choose a stronger one.');
    }

    if (user.password !== user.confirmationPassword) {
      throw new BadRequestException("Passwords don't match")
    }

    if (!user.password.match(passwordRegex)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one digit, one special character, and be at least 6 characters long.',
      )
    }

    const createdUser = this.usersRepository.create({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      text: null,
      publicKey: null,
      timeout: 0
    })

    const savedUser = await this.usersRepository.save(createdUser)
    return mapUserToGetUserDto(savedUser);
  }
  /*
  async login (user: AuthUserDto): Promise<GetUserDto | undefined> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: user.email },
    })

    if (!existingUser) {
      throw new BadRequestException('Could not find user with specified email')
    }

    if (existingUser.password !== user.password) {
      throw new BadRequestException('Incorrect password')
    }

    return mapUserToGetUserDto(existingUser);
  }*/

  async findOneByEmail(
    email: string,
  ): Promise<User | undefined> {
    let user = await this.usersRepository.findOne({
      where: { email },
      select: ['password', 'email', 'id', 'firstName', 'lastName', 'text', 'publicKey', 'timeout'],
    });

    return user;
  }

  async updatePublicKey(email: string, newPublicKey: string): Promise<User> {
    const user = await this.findOneByEmail(email)
    if (!user) {
      throw new Error('User not found');
    }
    user.publicKey = newPublicKey;
    await this.usersRepository.save(user);
    return user;
  }
}
