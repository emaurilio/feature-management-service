import { UXResearch } from '../../../domain/entites/UXResearch';
import { UXResearchEntity } from '../entities/ux-research.entity';

export class UXResearchMapper {
  static toDomain(entity: UXResearchEntity): UXResearch {
    return new UXResearch(
      entity.nameVersion,
      entity.name,
      entity.percentage,
      entity.version,
      entity.isActive,
      entity.type,
      entity.featureFlagName,
      entity.startDate,
      entity.endDate,
      entity.id,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toPersistence(domain: UXResearch): Partial<UXResearchEntity> {
    return {
      id: domain.id,
      nameVersion: domain.nameVersion,
      name: domain.name,
      percentage: domain.percentage,
      version: domain.version,
      isActive: domain.isActive,
      type: domain.type,
      featureFlagName: domain.featureFlagName,
      startDate: domain.startDate,
      endDate: domain.endDate,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt ?? undefined,
    };
  }
}
