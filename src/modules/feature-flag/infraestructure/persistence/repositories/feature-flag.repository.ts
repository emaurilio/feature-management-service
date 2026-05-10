import { Injectable } from '@nestjs/common';
import { Repository, DataSource, Like } from 'typeorm';
import { FeatureFlagEntity } from '../entities/FeatureFlag.entity';
import { FeatureFlagMapper } from '../mappers/feature-flag.mapper';
import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/feature-flag.repository.interface';

@Injectable()
export class FeatureFlagRepository
  extends Repository<FeatureFlagEntity>
  implements FeatureFlagRepositoryInterface
{
  constructor(private dataSource: DataSource) {
    super(FeatureFlagEntity, dataSource.createEntityManager());
  }

  async createFeatureFlag(featureFlag: FeatureFlag): Promise<FeatureFlag> {
    const featureFlagEntity = FeatureFlagMapper.toPersistence(featureFlag);
    const result = (await this.save(featureFlagEntity)) as FeatureFlagEntity;

    return FeatureFlagMapper.toDomain(result);
  }

  async findByName(
    name: string,
    withDeleted = false,
  ): Promise<FeatureFlag | null> {
    const result = await this.findOne({ where: { name }, withDeleted });

    return result ? FeatureFlagMapper.toDomain(result) : null;
  }

  async searchByNamePaginated(
    name: string,
    page: number,
    limit: number,
  ): Promise<{ data: FeatureFlag[]; total: number }> {
    const skip = (page - 1) * limit;

    const [entities, total] = await this.findAndCount({
      where: { name: Like(`%${name}%`) },
      take: limit,
      skip: skip,
      order: { name: 'ASC' },
    });

    return {
      data: entities.map((entity) => FeatureFlagMapper.toDomain(entity)),
      total: total,
    };
  }

  async updateFeatureFlag(
    id: string,
    partialEntity: Partial<FeatureFlag>,
  ): Promise<FeatureFlag> {
    await this.update(id, partialEntity);
    const updatedEntity = await this.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('Feature Flag not found after update');
    }
    return FeatureFlagMapper.toDomain(updatedEntity);
  }

  async deleteFeatureFlag(id: string): Promise<boolean> {
    const result = (await this.softDelete(id)) ? true : false;
    return result;
  }
}
