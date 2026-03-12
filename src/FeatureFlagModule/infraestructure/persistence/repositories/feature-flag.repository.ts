import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { FeatureFlagEntity } from '../entities/FeatureFlag.entity';
import { FeatureFlagMapper } from '../mappers/feature-flag.mapper';
import { FeatureFlag } from 'src/FeatureFlagModule/domain/entities/FeatureFlag';

@Injectable()
export class FeatureFlagRepository extends Repository<FeatureFlagEntity> {
  constructor(private dataSource: DataSource) {
    super(FeatureFlagEntity, dataSource.createEntityManager());
  }

  async createFeatureFlag(featureFlag: FeatureFlag): Promise<FeatureFlag> {
    const featureFlagEntity = FeatureFlagMapper.toPersistence(featureFlag);
    const result = (await this.save(featureFlagEntity)) as FeatureFlagEntity;
    return FeatureFlagMapper.toDomain(result);
  }

  async findByName(name: string): Promise<FeatureFlag | null> {
    const result = await this.findOne({ where: { name } });
    return result ? FeatureFlagMapper.toDomain(result) : null;
  }
}
