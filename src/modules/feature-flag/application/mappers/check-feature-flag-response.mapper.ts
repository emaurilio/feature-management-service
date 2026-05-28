import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { CheckFeatureFlagResponseDto } from '../dto/dto-response/check-feature-flag-response.dto';
import { GetFeatureFlagResponseMapper } from './get-feature-flag-response.mapper';

export class CheckFeatureFlagResponseMapper {
  static toResponse(
    featureFlag: FeatureFlag,
    checkFeatureFlag: boolean,
  ): CheckFeatureFlagResponseDto {
    return {
      ...GetFeatureFlagResponseMapper.toResponse(featureFlag),
      checkFeatureFlag,
    };
  }
}
