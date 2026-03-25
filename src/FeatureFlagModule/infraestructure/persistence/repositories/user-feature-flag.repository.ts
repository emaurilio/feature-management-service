import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { UserFeatureFlagEntity } from '../entities/UserFeatureFlag.entity';
import { UserFeatureFlag } from 'src/FeatureFlagModule/domain/entities/UserFeatureFlag';
import { UserFeatureFlagMapper } from '../mappers/user-feature-flag.mapper';

@Injectable()
export class UserFeatureFlagRepository extends Repository<UserFeatureFlagEntity> {
  constructor(private dataSource: DataSource) {
    super(UserFeatureFlagEntity, dataSource.createEntityManager());
  }

  async findByUserId(userId: string) {
    return this.find({
      where: {
        userId,
      },
    });
  }

  async findByUserIdAndFeatureFlagId(userId: string, featureId: string) {
    return this.findOne({ where: { userId, featureId } });
  }

  async createMany(userFeatureFlags: UserFeatureFlag[]) {
    const entities = userFeatureFlags.map((userFeatureFlag) =>
      UserFeatureFlagMapper.toPersistence(userFeatureFlag),
    );
    return this.save(entities);
  }

  async deleteByFeatureFlagId(featureId: string) {
    return this.delete({ featureId });
  }
}
