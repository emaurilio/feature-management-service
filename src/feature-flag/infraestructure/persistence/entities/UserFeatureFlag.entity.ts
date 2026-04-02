import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('feature_flags_users')
@Index(['featureId', 'userId'], { unique: true })
export class UserFeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
