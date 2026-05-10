import { UserFeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';
import { setSeederFactory } from 'typeorm-extension';

export const UserFeatureFlagFactory = setSeederFactory<UserFeatureFlagEntity>(
  UserFeatureFlagEntity,
  (faker) => {
    const entity = new UserFeatureFlagEntity();
    entity.featureId = faker.string.uuid();
    entity.userId = faker.string.uuid();
    return entity;
  },
);
