import { FeatureFlagType } from 'src/FeatureFlagModule/domain/enums/feature-flag-type.enum';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('feature_flags')
export class FeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  nameVersion: string;

  @Column()
  name: string;

  @Column({ type: 'int', default: 0 })
  percentage: number;

  @Column()
  version: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: FeatureFlagType.PERCENTAGE })
  type: FeatureFlagType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
