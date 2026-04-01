import { UserFeatureFlag } from '../entities/UserFeatureFlag';

export interface UserFeatureFlagRepositoryInterface {
  findByUserId(userId: string): Promise<UserFeatureFlag[] | null>;

  findByUserIdAndFeatureFlagId(
    userId: string,
    featureId: string,
  ): Promise<UserFeatureFlag | null>;

  createMany(userFeatureFlags: UserFeatureFlag[]): Promise<UserFeatureFlag[]>;

  deleteByFeatureFlagId(featureId: string): Promise<boolean>;
}
