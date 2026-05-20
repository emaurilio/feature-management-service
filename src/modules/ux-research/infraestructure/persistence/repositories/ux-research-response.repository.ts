import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { UXResearchResponseEntity } from "../entities/ux-research-response.entity";
import { UXResearchResponseRepositoryInterface } from "src/modules/ux-research/domain/repositories/persistence/ux-research-response.repository.interface";
import { DataSource } from "typeorm";
import { UXResearchResponse } from "src/modules/ux-research/domain/entites/UXResearchResponse";
import { UXResearchResponseMapper } from "../mappers/ux-research-response.mapper";

@Injectable()
export class UXResearchResponseRepository
    extends Repository<UXResearchResponseEntity>
    implements UXResearchResponseRepositoryInterface {
    
    constructor(private dataSource: DataSource) {
        super(UXResearchResponseEntity, dataSource.createEntityManager());
    }
    
    async createUXResearchResponse(uxResearchResponse: UXResearchResponse): Promise<UXResearchResponseEntity> {
        return this.save(uxResearchResponse);
    }
    
    async searchByUXResearchIdPaginated(uxResearchId: string, page: number, limit: number): Promise<{
        items: UXResearchResponse[];
        meta: {
            totalItems: number;
            itemCount: number;
            itemsPerPage: number;
            totalPages: number;
            currentPage: number;
        };
    } | null> {
        const skip = (page - 1) * limit;

        const [result, total] = await this.findAndCount({
            where: { uxResearchId },
            skip,
            take: limit,
        });
    
        const resultDomain = result.map(uxResearchResponse => UXResearchResponseMapper.toDomain(uxResearchResponse));

        return {
            items: resultDomain,
            meta: {
                totalItems: total,
                itemCount: resultDomain.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        };
    }

    async findById(id: string): Promise<UXResearchResponse | null> {
        const entity = await this.findOne({ where: { id } });

        if (!entity) {
            return null;
        }

        return UXResearchResponseMapper.toDomain(entity);
    }

    async deleteUXResearchResponse(id: string): Promise<boolean> {
        const result = await this.softDelete(id);
        return (result.affected ?? 0) > 0;
    }

    async getByUXResearchIdPaginated(uxResearchId: string, page: number = 1, limit: number = 15): Promise<{
        items: UXResearchResponse[];
        meta: {
            totalItems: number;
            itemCount: number;
            itemsPerPage: number;
            totalPages: number;
            currentPage: number;
        };
    } | null> {
        const skip = (page - 1) * limit;
        
        const [result, total] = await this.findAndCount({
            where: { uxResearchId },
            skip,
            take: limit,
        });

        if (result.length === 0) {
            return null;
        }

        const resultDomain = result.map(uxResearchResponse => UXResearchResponseMapper.toDomain(uxResearchResponse));
        
        return {
            items: resultDomain,
            meta: {
                totalItems: total,
                itemCount: resultDomain.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        };
    }
}
