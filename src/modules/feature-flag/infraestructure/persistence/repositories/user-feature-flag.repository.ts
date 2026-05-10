import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { UserFeatureFlagEntity } from '../entities/UserFeatureFlag.entity';
import { UserFeatureFlag } from 'src/modules/feature-flag/domain/entities/UserFeatureFlag';
import { UserFeatureFlagMapper } from '../mappers/user-feature-flag.mapper';
import { UserFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/user-feature-flag.repository.interface';

@Injectable()
export class UserFeatureFlagRepository
  extends Repository<UserFeatureFlagEntity>
  implements UserFeatureFlagRepositoryInterface
{
  constructor(private dataSource: DataSource) {
    super(UserFeatureFlagEntity, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<UserFeatureFlag[] | null> {
    return this.find({
      where: {
        userId,
      },
    });
  }

  async findByUserIdAndFeatureFlagId(
    userId: string,
    featureId: string,
  ): Promise<UserFeatureFlag | null> {
    return this.findOne({ where: { userId, featureId } });
  }

  async createMany(
    userFeatureFlags: UserFeatureFlag[],
  ): Promise<UserFeatureFlag[]> {
    const entities = userFeatureFlags.map((userFeatureFlag) =>
      UserFeatureFlagMapper.toPersistence(userFeatureFlag),
    );

    return this.save(entities);
  }

  async deleteByFeatureFlagId(featureId: string): Promise<boolean> {
    const expectedCount = await this.count({ where: { featureId } });
    if (expectedCount === 0) {
      return true;
    }

    const result = await this.softDelete({ featureId });
    return (result.affected ?? 0) === expectedCount;
  }
}
