import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';

export class CheckFeatureFlagCompanyUseCase implements CheckFeatureFlagInterface {
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
