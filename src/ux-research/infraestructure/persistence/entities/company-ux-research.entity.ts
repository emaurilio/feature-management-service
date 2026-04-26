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
import { UXResearchEntity } from './ux-research.entity';

@Entity('companies_ux_research')
@Index(['companyId', 'uxResearchId'], { unique: true })
export class CompanyUXResearchEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    uxResearchId: string;

    @ManyToOne(() => UXResearchEntity)
    @JoinColumn({ name: 'uxResearchId', referencedColumnName: 'id' })
    uxResearch: UXResearchEntity;

    @Column()
    companyId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
