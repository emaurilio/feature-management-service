import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { CompanyUXResearchEntity } from '../entities/company-ux-research.entity';
import { CompanyUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';
import { CompanyUXResearch } from 'src/ux-research/domain/entites/CompanyUXResearch';
import { CompanyUXResearchMapper } from '../mappers/company-ux-research.mapper';

@Injectable()
export class CompanyUXResearchRepository
    extends Repository<CompanyUXResearchEntity>
    implements CompanyUXResearchRepositoryInterface {
    constructor(private dataSource: DataSource) {
        super(CompanyUXResearchEntity, dataSource.createEntityManager());
    }

    async findByCompanyId(
        companyId: string,
    ): Promise<CompanyUXResearch[] | null> {
        const findCompany = await this.find({ where: { companyId } });
        if (!findCompany) {
            return null;
        }

        return findCompany.map((companyUXResearch) => {
            return CompanyUXResearchMapper.toDomain(companyUXResearch);
        });
    }

    async createCompanyUXResearch(
        companyUXResearch: CompanyUXResearch,
    ): Promise<CompanyUXResearch> {
        return this.save(companyUXResearch);
    }

    async createMany(
        companyUXResearchs: CompanyUXResearch[],
    ): Promise<CompanyUXResearch[]> {
        const entities = companyUXResearchs.map((companyUXResearch) => {
            return CompanyUXResearchMapper.toPersistence(companyUXResearch);
        });

        return this.save(entities);
    }

    async findByCompanyIdAndUXResearchId(
        companyId: string,
        uxResearchId: string,
    ): Promise<CompanyUXResearch | null> {
        const findOneCompanyUXResearch = await this.findOne({
            where: { companyId, uxResearchId },
        });
        if (!findOneCompanyUXResearch) {
            return null;
        }

        return CompanyUXResearchMapper.toDomain(findOneCompanyUXResearch);
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
