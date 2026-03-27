/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UserFeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';
import { setSeederFactory } from 'typeorm-extension';

export const UserFeatureFlagFactory = setSeederFactory<UserFeatureFlagEntity>(
  UserFeatureFlagEntity,
  (faker) => {
    const entity = new UserFeatureFlagEntity();
    entity.featureId = faker.string.uuid();
    entity.companyId = faker.string.uuid();
    entity.userId = faker.string.uuid();
    return entity;
  },
);
