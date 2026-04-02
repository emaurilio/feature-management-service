import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('feature_flags_companies')
@Index(['featureId', 'companyId'], { unique: true })
export class CompanyFeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureId: string;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
