import { Injectable } from '@nestjs/common';
import { Repository, DataSource, Like } from 'typeorm';
import { UXResearchEntity } from '../entities/ux-research.entity';
import { UXResearch } from 'src/ux-research/domain/entites/UXResearch';
import { UXResearchMapper } from '../mappers/ux-research.mapper';
import { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';

@Injectable()
export class UXResearchRepository
    extends Repository<UXResearchEntity>
    implements UXResearchRepositoryInterface {
    constructor(private dataSource: DataSource) {
        super(UXResearchEntity, dataSource.createEntityManager());
    }

    async createUXResearch(uxResearch: UXResearch): Promise<UXResearch> {
        const uxResearchEntity = UXResearchMapper.toPersistence(uxResearch);
        const result = (await this.save(uxResearchEntity)) as UXResearchEntity;

        return UXResearchMapper.toDomain(result);
    }

    async findByName(
        name: string,
        withDeleted = false,
    ): Promise<UXResearch | null> {
        const result = await this.findOne({ where: { name }, withDeleted });

        return result ? UXResearchMapper.toDomain(result) : null;
    }

    async searchByNamePaginated(
        name: string,
        page: number,
        limit: number,
    ): Promise<{ data: UXResearch[]; total: number }> {
        const skip = (page - 1) * limit;

        const [entities, total] = await this.findAndCount({
            where: { name: Like(`%${name}%`) },
            take: limit,
            skip: skip,
            order: { name: 'ASC' },
        });

        return {
            data: entities.map((entity) => UXResearchMapper.toDomain(entity)),
            total: total,
        };
    }

    async updateUXResearch(
        id: string,
        partialEntity: Partial<UXResearch>,
    ): Promise<UXResearch> {
        await this.update(id, partialEntity);
        const updatedEntity = await this.findOne({ where: { id } });
        if (!updatedEntity) {
            throw new Error('UX Research not found after update');
        }
        return UXResearchMapper.toDomain(updatedEntity);
    }

    async deleteUXResearch(id: string): Promise<boolean> {
        const result = (await this.softDelete(id)) ? true : false;
        return result;
    }
}
