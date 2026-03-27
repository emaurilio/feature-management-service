import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { HashFeatureFlagService } from '../../services/hash-feature-flag.service';
import { CheckFeatureFlagDto } from '../../dto/check-feature-flag/check-feature-flag.dto';

export class CheckFeatureFlagCompanyPercentageUseCase {
  constructor(
    private readonly hashFeatureFlag: HashFeatureFlagService,
    private readonly companyFeatureFlagRepository: CompanyFeatureFlagRepository,
  ) {}

  execute(checkFeatureFlagDto: CheckFeatureFlagDto): boolean {
    const companyFeatureFlag = this.companyFeatureFlagRepository.findOne({
      where: {
        featureId: checkFeatureFlagDto.featureId,
        companyId: checkFeatureFlagDto.companyId,
      },
    });

    if (companyFeatureFlag === null) {
      return false;
    }

    const hashName =
      checkFeatureFlagDto.companyId +
      '-' +
      checkFeatureFlagDto.featureName +
      '-' +
      checkFeatureFlagDto.version;
    const hashCompanyFeatureFlag = this.hashFeatureFlag.calculateHash(hashName);

    return hashCompanyFeatureFlag >= checkFeatureFlagDto.percentage;
  }
}
