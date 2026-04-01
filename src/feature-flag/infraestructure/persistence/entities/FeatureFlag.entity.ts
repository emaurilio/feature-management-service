import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
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
  nameVersion: string;

  @Column()
  @Index()
  name: string;

  @Column({ default: true })
  enable: boolean = true;

  @Column({ type: 'int', default: 0 })
  percentage: number;

  @Column()
  version: number;

  @Column({ default: true })
  @Index()
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
