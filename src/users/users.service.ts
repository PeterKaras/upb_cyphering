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
import { EncryptedDataDto } from './dto/encrypted-data,dto'
import { GetReducedPatientDto } from 'src/patient/dto/get-reduced-patient.dto'
import { Patient } from 'src/patient/entities/patient.entity'
import { RequestEntity } from 'src/requests/entities/request.entity'

dotenv.config()

@Injectable()
export class UsersService {
  constructor (
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient) private readonly patientRepository: Repository<Patient>
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

  async cypher (loggInUser: User, data: any): Promise<EncryptedDataDto> {
    const publicKey = loggInUser.publicKey
    if (!publicKey) throw new BadRequestException('User has no public key')
    const symmetricKey = crypto.randomBytes(32).toString('hex')

    const encryptedSymmetricKey = this.encryptSymmetricKeyWithPublicKey(
      publicKey,
      Buffer.from(symmetricKey, 'hex'),
    )

    const encryptedDataWithSymmetricKey = this.encryptDataWithSymmetricKey(JSON.stringify(data), Buffer.from(symmetricKey, 'hex'))

    return {
      key: encryptedSymmetricKey,
      data: encryptedDataWithSymmetricKey,
    }
  }

  async create (user: CreateUserDto): Promise<GetUserDto | undefined> {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,}$/
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

    if (passwordStrength.score < 2) {
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
      timeout: 0,
      patients: [],
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

  async findAllPatients(user: User): Promise<Patient[]> {
    const publicKey = user.publicKey;
    if (!publicKey) throw new BadRequestException('User has no public key');
    const patients: Patient[] = await this.patientRepository.find();
    return patients;
  }

  async getOnePatientById(user: User, birthId: string) {
    const publicKey = user.publicKey;
    if (!publicKey) throw new BadRequestException('User has no public key');
    const patientDb = await this.patientRepository.findOne({
      where: { birthId: birthId },
    });
    if (!patientDb) {
      throw new BadRequestException('Patient not found');
    }
    return patientDb;
  }

  async deleteOnePatient(user: User, birthId: string): Promise<void> {
    const publicKey = user.publicKey;
    if (!publicKey) throw new BadRequestException('User has no public key');
    const patientDb = await this.patientRepository.findOne({
      where: { birthId: birthId },
    });
    if (!patientDb) {
      throw new BadRequestException('Patient not found');
    }

    const users = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['patients'],
    });
    if (!users) {
      throw new BadRequestException('Doctor not found');
    }

    users.patients = users.patients.filter(patient => patient.birthId !== patientDb.birthId);
    await this.usersRepository.save(users);
    await this.patientRepository.delete(patientDb.id);
  }
}
