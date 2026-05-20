import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { CheckFeatureFlagResponseDto } from '../dto/response/check-feature-flag-response.dto';

export class CheckFeatureFlagResponseMapper {
  static toResponse(
    featureFlag: FeatureFlag,
    checkFeatureFlag: boolean,
  ): CheckFeatureFlagResponseDto {
    return {
      id: featureFlag.id,
      name: featureFlag.name,
      nameVersion: featureFlag.nameVersion,
      type: featureFlag.type,
      percentage: featureFlag.percentage,
      version: featureFlag.version,
      isActive: featureFlag.isActive,
      checkFeatureFlag,
    };
  }
}
