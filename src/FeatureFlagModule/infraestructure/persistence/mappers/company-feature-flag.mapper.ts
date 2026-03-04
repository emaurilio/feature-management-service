import { CompanyFeatureFlag } from '../../../domain/entities/CompanyFeatureFlag';
import { CompanyFeatureFlagEntity } from '../entities/CompanyFeatureFlag.entity';

export class CompanyFeatureFlagMapper {
  static toDomain(entity: CompanyFeatureFlagEntity): CompanyFeatureFlag {
    return new CompanyFeatureFlag(
      entity.featureId,
      entity.companyId,
      entity.id,
    );
  }

  static toPersistence(
    domain: CompanyFeatureFlag,
  ): Partial<CompanyFeatureFlagEntity> {
    return {
      id: domain.id,
      featureId: domain.featureId,
      companyId: domain.companyId,
    };
  }
}
