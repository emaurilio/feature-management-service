import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { GetFeatureFlagResponseDto } from '../dto/dto-response/get-feature-flag-response.dto';

export class GetFeatureFlagResponseMapper {
  static toResponse(
    featureFlag: FeatureFlag,
    options?: { deleted?: boolean },
  ): GetFeatureFlagResponseDto {
    return {
      id: featureFlag.id,
      name: featureFlag.name,
      nameVersion: featureFlag.nameVersion,
      type: featureFlag.type,
      percentage: featureFlag.percentage,
      version: featureFlag.version,
      isActive: featureFlag.isActive,
      createdAt: featureFlag.createdAt,
      updatedAt: featureFlag.updatedAt,
      deletedAt: featureFlag.deletedAt,
      ...(options?.deleted !== undefined && { deleted: options.deleted }),
    };
  }
}
