import { CheckFeatureFlagResponseMapper } from 'src/modules/feature-flag/application/mappers/check-feature-flag-response.mapper';
import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';

describe('CheckFeatureFlagResponseMapper', () => {
  it('should map feature flag and check result to response dto', () => {
    const featureFlag = new FeatureFlag(
      'my-flag-1',
      'my-flag',
      50,
      1,
      true,
      FeatureFlagType.PERCENTAGE,
      'flag-id',
    );

    const result = CheckFeatureFlagResponseMapper.toResponse(featureFlag, true);

    expect(result).toEqual({
      id: 'flag-id',
      name: 'my-flag',
      nameVersion: 'my-flag-1',
      type: FeatureFlagType.PERCENTAGE,
      percentage: 50,
      version: 1,
      isActive: true,
      checkFeatureFlag: true,
    });
  });
});
