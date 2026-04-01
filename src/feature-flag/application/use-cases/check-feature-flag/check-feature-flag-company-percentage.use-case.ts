import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';
import { CheckFeatureFlagInterface } from 'src/feature-flag/domain/use-cases/check-feature-flag.use-case.interface';

export class CheckFeatureFlagCompanyPercentageUseCase implements CheckFeatureFlagInterface {
  constructor(
    private readonly hashFeatureFlag: HashFeatureFlagService,
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

    const hashName = `${checkFeatureFlagDto.companyId}-
      ${checkFeatureFlagDto.featureName}-
      ${checkFeatureFlagDto.version}`;

    const hashCompanyFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    return hashCompanyFeatureFlag < checkFeatureFlagDto.percentage;
  }
}
