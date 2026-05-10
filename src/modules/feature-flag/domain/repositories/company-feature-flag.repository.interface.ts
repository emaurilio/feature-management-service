import { CompanyFeatureFlag } from '../entities/CompanyFeatureFlag';

export interface CompanyFeatureFlagRepositoryInterface {
  findByCompanyId(companyId: string): Promise<CompanyFeatureFlag[] | null>;

  createCompanyFeatureFlag(
    companyFeatureFlag: CompanyFeatureFlag,
  ): Promise<CompanyFeatureFlag>;

  findByCompanyIdAndFeatureFlagId(
    companyId: string,
    featureId: string,
  ): Promise<CompanyFeatureFlag | null>;

  createMany(
    companyFeatureFlags: CompanyFeatureFlag[],
  ): Promise<CompanyFeatureFlag[]>;

  deleteByFeatureFlagId(featureId: string): Promise<boolean>;
}
