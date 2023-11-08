import { MedicalResults } from "src/medical-results/entities/medical-results.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'patient' })
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({unique: true})
  birthId: string;

  @Column()
  address: string;

  @Column()
  diagnosis: string;

  @Column()
  allergies: string;

  @OneToMany(() => MedicalResults, (medicalResults) => medicalResults.patient, { eager: true })
  medicalResults: MedicalResults[];

  @ManyToMany(() => User, (user) => user.patients)
  @JoinTable()
  doctors: User[];

}