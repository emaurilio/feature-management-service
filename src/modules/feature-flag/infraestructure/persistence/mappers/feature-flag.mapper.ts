import { FeatureFlag } from '../../../domain/entities/FeatureFlag';
import { FeatureFlagEntity } from '../entities/FeatureFlag.entity';

export class FeatureFlagMapper {
  static toDomain(entity: FeatureFlagEntity): FeatureFlag {
    return new FeatureFlag(
      entity.nameVersion,
      entity.name,
      entity.percentage,
      entity.version,
      entity.isActive,
      entity.type,
      entity.id,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toPersistence(domain: FeatureFlag): Partial<FeatureFlagEntity> {
    return {
      id: domain.id,
      nameVersion: domain.nameVersion,
      name: domain.name,
      percentage: domain.percentage,
      version: domain.version,
      isActive: domain.isActive,
      type: domain.type,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt ?? undefined,
    };
  }
}
