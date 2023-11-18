import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Patient } from 'src/patient/entities/patient.entity';
import { MedicalResults } from 'src/medical-results/entities/medical-results.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true, default: null })
  text: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true, default: null })
  publicKey: string | null;

  @Column({ nullable: true, default: 0 })
  timeout: number;

  @ManyToMany(() => Patient, (patient) => patient.doctors, { cascade: true })
  patients: Patient[];

  @OneToOne(() => MedicalResults, (medicalResult) => medicalResult.doctor, { cascade: true, nullable: true })
  writtenMedicalResult: MedicalResults;

  @BeforeInsert()
  async hashPassword() {
    const salt: string = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }

}
