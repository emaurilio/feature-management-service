import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeatureFlagEntity } from './FeatureFlag.entity';

@Entity('feature_flags_companies')
@Index(['featureId', 'companyId'], { unique: true })
export class CompanyFeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureId: string;

  @ManyToOne(() => FeatureFlagEntity)
  @JoinColumn({ name: 'featureId', referencedColumnName: 'id' })
  featureFlag: FeatureFlagEntity;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
