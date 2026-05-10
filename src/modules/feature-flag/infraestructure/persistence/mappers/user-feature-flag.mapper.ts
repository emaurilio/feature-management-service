import { UserFeatureFlag } from '../../../domain/entities/UserFeatureFlag';
import { UserFeatureFlagEntity } from '../entities/UserFeatureFlag.entity';

export class UserFeatureFlagMapper {
  static toDomain(entity: UserFeatureFlagEntity): UserFeatureFlag {
    return new UserFeatureFlag(
      entity.featureId,
      entity.userId,
      entity.id,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toPersistence(
    domain: UserFeatureFlag,
  ): Partial<UserFeatureFlagEntity> {
    return {
      id: domain.id,
      featureId: domain.featureId,
      userId: domain.userId,
    };
  }
}
