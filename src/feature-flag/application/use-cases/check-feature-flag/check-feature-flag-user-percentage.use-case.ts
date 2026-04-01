import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';

export class CheckFeatureFlagUserPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    private readonly hashFeatureFlag: HashFeatureFlagService,
    private readonly userFeatureFlagRepository: UserFeatureFlagRepository,
  ) {}

  execute(checkFeatureFlagDto: CheckFeatureFlagDto): boolean {
    const userFeatureFlag = this.userFeatureFlagRepository.findOne({
      where: {
        featureId: checkFeatureFlagDto.featureId,
        userId: checkFeatureFlagDto.userId,
      },
    });

    if (userFeatureFlag === null) {
      return false;
    }

    const hashName =
      checkFeatureFlagDto.userId +
      '-' +
      checkFeatureFlagDto.featureName +
      '-' +
      checkFeatureFlagDto.version;
    const hashUserFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    return hashUserFeatureFlag < checkFeatureFlagDto.percentage;
  }
}
