import { CompanyUXResearch } from '../../../domain/entites/CompanyUXResearch';
import { CompanyUXResearchEntity } from '../entities/company-ux-research.entity';

export class CompanyUXResearchMapper {
  static toDomain(entity: CompanyUXResearchEntity): CompanyUXResearch {
    return new CompanyUXResearch(
      entity.uxResearchId,
      entity.companyId,
      entity.id,
    );
  }

  static toPersistence(
    domain: CompanyUXResearch,
  ): Partial<CompanyUXResearchEntity> {
    return {
      id: domain.id,
      uxResearchId: domain.uxResearchId,
      companyId: domain.companyId,
    };
  }
}
