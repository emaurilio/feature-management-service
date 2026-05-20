import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { DeleteFeatureFlagResponseDto } from '../dto/response/delete-feature-flag-response.dto';

export class DeleteFeatureFlagResponseMapper {
  static toResponse(
    featureFlag: FeatureFlag,
    deleted: boolean,
  ): DeleteFeatureFlagResponseDto {
    return {
      id: featureFlag.id,
      name: featureFlag.name,
      nameVersion: featureFlag.nameVersion,
      type: featureFlag.type,
      percentage: featureFlag.percentage,
      version: featureFlag.version,
      isActive: featureFlag.isActive,
      deleted,
    };
  }
}
