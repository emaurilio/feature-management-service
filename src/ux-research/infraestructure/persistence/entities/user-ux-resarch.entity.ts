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

@Entity('users_ux_research')
@Index(['userId', 'uxResearchId'], { unique: true })
export class UserUXResearchEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    uxResearchId: string;

    @ManyToOne(() => UXResearchEntity)
    @JoinColumn({ name: 'uxResearchId', referencedColumnName: 'id' })
    uxResearch: UXResearchEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
