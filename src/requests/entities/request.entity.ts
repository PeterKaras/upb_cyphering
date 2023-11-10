import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

enum Status {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Done = 'Done',
}

@Entity({ name: 'request' })
export class RequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reason: string;

  @Column()
  notes: string;

  @Column()
  date: string;

  @Column({ type: 'enum', enum: Status, default: Status.Pending})
  status: Status;

  @Column()
  birthId: string;

  @Column()
  doctorId: number;
}
