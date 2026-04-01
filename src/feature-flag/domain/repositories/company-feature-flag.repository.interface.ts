import { CompanyFeatureFlag } from '../entities/CompanyFeatureFlag';

export interface CompanyFeatureFlagRepositoryInterface {
  findByCompany(companyId: string): Promise<CompanyFeatureFlag[] | null>;

  findByCompanyIdAndFeatureFlagId(
    companyId: string,
    featureId: string,
  ): Promise<CompanyFeatureFlag | null>;

  createCompanyFeatureFlag(
    companyFeatureFlag: CompanyFeatureFlag,
  ): Promise<CompanyFeatureFlag>;

  findByCompanyIdAndFeatureFlagId(
    companyId: string,
    featureId: string,
  ): Promise<CompanyFeatureFlag | null>;

  deleteByFeatureFlagId(featureId: string): Promise<boolean>;
}
