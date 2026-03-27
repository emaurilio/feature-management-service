/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { setSeederFactory } from 'typeorm-extension';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';

export const FeatureFlagFactory = setSeederFactory(
  FeatureFlagEntity,
  (faker) => {
    const entity = new FeatureFlagEntity();
    const name = faker.lorem.word();
    entity.name = name;
    entity.version = 1;
    entity.nameVersion = `${name}-1`;
    entity.type = FeatureFlagType.PERCENTAGE;
    entity.percentage = 100;
    entity.isActive = true;
    return entity;
  },
);
