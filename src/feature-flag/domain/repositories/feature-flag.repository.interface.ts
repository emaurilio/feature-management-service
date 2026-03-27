import { FeatureFlag } from '../entities/FeatureFlag';

export interface UserFeatureFlagRepositoryInterface {
  createFeatureFlag(featureFlag: FeatureFlag): Promise<FeatureFlag>;
  findByName(name: string): Promise<FeatureFlag | null>;
  searchForName(
    name: string,
    page: number,
    limit: number,
  ): Promise<{ data: FeatureFlag[]; total: number }>;
}
