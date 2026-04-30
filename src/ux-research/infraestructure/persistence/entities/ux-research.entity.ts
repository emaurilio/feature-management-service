import { FeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { UXResearchType } from 'src/ux-research/domain/enums/ux-research-type.enum';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

@Entity('ux_research')
export class UXResearchEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nameVersion: string;

    @Column()
    @Index()
    name: string;

    @Column({ nullable: true })
    featureFlagName: string;

    @ManyToOne(() => FeatureFlagEntity, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: 'featureFlagName', referencedColumnName: 'name' })
    featureFlag: FeatureFlagEntity;

    @Column({ default: true })
    enable: boolean = true;

    @Column({ type: 'int', default: 0 })
    percentage: number;

    @Column()
    version: number;

    @Column({ default: true })
    @Index()
    isActive: boolean;

    @Column({ type: 'date', nullable: true })
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date;

    @Column({ type: 'varchar', default: UXResearchType.PERCENTAGE })
    type: UXResearchType;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
