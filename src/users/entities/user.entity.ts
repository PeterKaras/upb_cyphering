import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

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

  @BeforeInsert()
  async hashPassword() {
    const salt: string = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }
}
