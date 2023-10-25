import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import * as dotenv from 'dotenv'
import * as CryptoJS from 'crypto-js' // Import crypto-js
import { CreateUserDto } from './dto/Create-user.dto'
import fs from 'fs'
import path from 'path'
import { mapUserToGetUserDto } from './mapper/user.mapper'
import { GetUserDto } from './dto/get-user.dto'

dotenv.config()

@Injectable()
export class UsersService {
  constructor (
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

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
    privateKey: string,
    symmetricKey: string,
  ): string {
    const encrypted = CryptoJS.AES.encrypt(symmetricKey, privateKey)
    return encrypted.toString()
  }

  decryptSymmetricKeyWithPublicKey (
    encryptedKey: string,
    publicKey: string,
  ): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, publicKey)
    return decrypted.toString(CryptoJS.enc.Utf8)
  }

  generateKeyPair (): { publicKey: string; privateKey: string } {
    const keyPair = CryptoJS.SHA256(
      CryptoJS.lib.WordArray.random(32),
    ).toString()
    return { publicKey: keyPair, privateKey: keyPair }
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

        // const encryptedSymmetricKey = this.encryptSymmetricKeyWithPublicKey(
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

  async create (user: CreateUserDto): Promise<GetUserDto> {
    this.validateUser(user)

    const createdUser = await this.usersRepository.create({
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

  async validateUser (user: CreateUserDto): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: user.email },
    })

    if (existingUser) {
      throw new Error('Could not create user with specified data');
    }

    const data = fs.readFileSync(
      path.join(__dirname, '..', '..', '10-million-password-list-top-100000.txt'),
      'utf8',
    )

    const passwordList = data.split('\n')
    if (passwordList.includes(user.password)) {
      throw new Error('Password is too common, please choose another one.')
    }
  
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/

    if (user.password !== user.confirmationPassword) {
      throw new Error("Passwords don't match")
    }

    if (!user.password.match(passwordRegex)) {
      throw new Error(
        'Password must contain at least one uppercase letter, one digit, one special character, and be at least 6 characters long.',
      )
    }
  }
}
