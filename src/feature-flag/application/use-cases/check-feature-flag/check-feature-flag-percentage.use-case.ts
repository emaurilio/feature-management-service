import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';

export class CheckFeatureFlagPercentageUseCase {
  constructor(private readonly hashFeatureFlag: HashFeatureFlagService) {}

  execute(checkFeatureFlagDto: CheckFeatureFlagDto): boolean {
    const entityId =
      checkFeatureFlagDto.companyId || checkFeatureFlagDto.userId;

    const hashName =
      entityId +
      '-' +
      checkFeatureFlagDto.featureName +
      '-' +
      checkFeatureFlagDto.version;
    const hashFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    return hashFeatureFlag >= checkFeatureFlagDto.percentage;
  }
}
