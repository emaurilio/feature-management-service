import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('ux_researches_responses')
export class UXResearchResponseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    uxResearchId: string;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true })
    companyId: string;

    @Column({ type: 'json' })
    response: any;

    @Column()
    responseDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}