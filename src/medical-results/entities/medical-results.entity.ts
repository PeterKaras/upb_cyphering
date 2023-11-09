import { Patient } from "src/patient/entities/patient.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'medicalResults' })
export class MedicalResults {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  text: string;

  @Column()
  date: string;

  @ManyToOne(() => Patient, (patient) => patient.medicalResults, { eager: false })
  patient: Patient;

  @OneToOne(() => User, (user) => user.writtenMedicalResult, { eager: false })
  doctor: User;

}