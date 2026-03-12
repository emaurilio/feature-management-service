import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { UserFeatureFlagEntity } from '../entities/UserFeatureFlag.entity';

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

  async createUserFeatureFlag(userFeatureFlag: UserFeatureFlagEntity) {
    return this.save(userFeatureFlag);
  }
}
