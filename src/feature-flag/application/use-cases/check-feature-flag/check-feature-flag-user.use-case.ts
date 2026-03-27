import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';

export class CheckFeatureFlagUserUseCase {
  constructor(
    private readonly userFeatureFlagRepository: UserFeatureFlagRepository,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const userFeatureFlag = await this.userFeatureFlagRepository.findOne({
      where: {
        featureId: checkFeatureFlagDto.featureId,
        userId: checkFeatureFlagDto.userId,
      },
    });

    if (userFeatureFlag === null) {
      return false;
    }

    return true;
  }
}
