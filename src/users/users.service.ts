import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import * as dotenv from 'dotenv'
import * as crypto from "crypto";
import { CreateUserDto } from './dto/create-user.dto'
import * as fs from "fs";
import * as path from "path";
import { mapUserToGetUserDto } from './mapper/user.mapper'
import { GetUserDto } from './dto/get-user.dto'
import * as zxcvbn from "zxcvbn";

dotenv.config()

@Injectable()
export class UsersService {
  constructor (
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  private readonly modulusLength = 2048;
  private readonly algorithm = 'aes-256-cbc';

  encryptSymmetricKeyWithPublicKey(publicKey: string, symmetricKey: Buffer): string {
    return crypto.publicEncrypt(publicKey, symmetricKey).toString('base64');
  }

  encryptDataWithSymmetricKey(data: string, symmetricKey: Buffer): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, symmetricKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
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
    const newPublicKey = publicKey;
    const newPrivateKey = privateKey;
    return { publicKey: newPublicKey, privateKey: newPrivateKey };
  }

  async cypher (loggInUser: User): Promise<any> {
    const publicKey = loggInUser.publicKey
    if (!publicKey) throw new BadRequestException('User has no public key')
    const users: User[] = await this.usersRepository.find()
    const symmetricKey = crypto.randomBytes(32).toString('hex')

    const encryptedSymmetricKey = this.encryptSymmetricKeyWithPublicKey(
      publicKey,
      Buffer.from(symmetricKey, 'hex'),
    )

    const encryptedData = users.map(user => {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        text: user.text,
      }
    })

    const encryptedDataWithSymmetricKey = this.encryptDataWithSymmetricKey(JSON.stringify(encryptedData), Buffer.from(symmetricKey, 'hex'))

    return {
      key: encryptedSymmetricKey,
      data: encryptedDataWithSymmetricKey,
    }
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
      throw new BadRequestException('User not found');
    }
    if (!newPublicKey.includes('PUBLIC KEY') || !newPublicKey.includes('END') || !newPublicKey.includes('BEGIN')) {
      throw new BadRequestException('Invalid public key - missing BEGIN or END or PUBLIC KEY');
    }
    user.publicKey = newPublicKey.trim();
    await this.usersRepository.save(user);
    return user;
  }
}
