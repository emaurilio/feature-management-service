import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users_feature_flags')
@Index(['featureId', 'companyId'], { unique: true })
export class UserFeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureId: string;

  @Column()
  companyId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
