import { CompanyFeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/CompanyFeatureFlag.entity';
import { setSeederFactory } from 'typeorm-extension';

export const CompanyFeatureFlagFactory = setSeederFactory(
  CompanyFeatureFlagEntity,
  (faker) => {
    const entity = new CompanyFeatureFlagEntity();
    entity.featureId = faker.string.uuid();
    entity.companyId = faker.string.uuid();
    return entity;
  },
);
