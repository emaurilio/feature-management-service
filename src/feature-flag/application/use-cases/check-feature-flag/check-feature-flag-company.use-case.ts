import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';

export class CheckFeatureFlagCompanyUseCase {
  constructor(
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepository,
  ) {}

  async execute(checkFeatureFlagDto: CheckFeatureFlagDto): Promise<boolean> {
    const companyFeatureFlag = await this.companyFeatureFlagRepository.findOne({
      where: {
        featureId: checkFeatureFlagDto.featureId,
        companyId: checkFeatureFlagDto.companyId,
      },
    });

    if (companyFeatureFlag === null) {
      return false;
    }

    return true;
  }
}
