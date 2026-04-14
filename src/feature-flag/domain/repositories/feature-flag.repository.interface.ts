import { FeatureFlag } from '../entities/FeatureFlag';

export interface FeatureFlagRepositoryInterface {
  createFeatureFlag(featureFlag: FeatureFlag): Promise<FeatureFlag>;
  findByName(name: string, withDeleted: boolean): Promise<FeatureFlag | null>;
  searchForName(
    name: string,
    page: number,
    limit: number,
  ): Promise<{ data: FeatureFlag[]; total: number }>;
}
