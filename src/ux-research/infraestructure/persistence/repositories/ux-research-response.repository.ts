import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { UXResearchResponseEntity } from "../entities/ux-research-response.entity";
import { UXResearchResponseRepositoryInterface } from "src/ux-research/domain/repositories/persistence/ux-research-response.repository.interface";
import { DataSource } from "typeorm/browser";
import { UXResearchResponse } from "src/ux-research/domain/entites/UXResearchResponse";

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
    
    async searchByUXResearchIdPaginated(uxResearchId: string, page: number, limit: number): Promise<any> {
        return this.find({
            where: { uxResearchId },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async deleteUXResearchResponse(id: string): Promise<boolean> {
        const result = (await this.softDelete(id)) ? true : false;
        return result;
    }
}