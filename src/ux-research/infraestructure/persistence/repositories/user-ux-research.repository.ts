import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { UserUXResearch } from 'src/ux-research/domain/entites/UserUXResearch';
import { UserUXResearchEntity } from '../entities/user-ux-resarch.entity';
import { UserUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';
import { UserUXResearchMapper } from '../mappers/user-ux-research.mapper';

@Injectable()
export class UserUXResearchRepository
    extends Repository<UserUXResearchEntity>
    implements UserUXResearchRepositoryInterface {
    
    constructor(private dataSource: DataSource) {
        super(UserUXResearchEntity, dataSource.createEntityManager());
    }

    async findByUserId(userId: string): Promise<UserUXResearch[] | null> {
        return this.find({
            where: {
                userId,
            },
        });
    }

    async findByUserIdAndUXResearchId(
        userId: string,
        uxResearchId: string,
    ): Promise<UserUXResearch | null> {
        return this.findOne({ where: { userId, uxResearchId } });
    }

    async createMany(
        userUXResearches: UserUXResearch[],
    ): Promise<UserUXResearch[]> {
        const entities = userUXResearches.map((userUXResearch) =>
            UserUXResearchMapper.toPersistence(userUXResearch),
        );

        return this.save(entities);
    }

    async deleteByUXResearchId(uxResearchId: string): Promise<boolean> {
        const expectedCount = await this.count({ where: { uxResearchId } });
        if (expectedCount === 0) {
            return true;
        }

        const result = await this.softDelete({ uxResearchId });
        return (result.affected ?? 0) === expectedCount;
    }
}
