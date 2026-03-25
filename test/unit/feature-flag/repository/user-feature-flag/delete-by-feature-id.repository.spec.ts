/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserFeatureFlagRepository } from 'src/FeatureFlagModule/infraestructure/persistence/repositories/user-feature-flag.repository';
import { UserFeatureFlag } from 'src/FeatureFlagModule/domain/entities/UserFeatureFlag';
import { UserFeatureFlagEntity } from 'src/FeatureFlagModule/infraestructure/persistence/entities/UserFeatureFlag.entity';

describe('UserFeatureFlagRepository - deleteByFeatureFlagId', () => {
  let repository: UserFeatureFlagRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFeatureFlagRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<UserFeatureFlagRepository>(
      UserFeatureFlagRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should delete multiple user feature flags by feature flag id', async () => {
    const domainFlags = [
      new UserFeatureFlag('feature-1', 'user-1'),
      new UserFeatureFlag('feature-1', 'user-2'),
    ];
    new UserFeatureFlag('feature-2', 'user-3');

    const entities = domainFlags.map((df) => {
      const entity = new UserFeatureFlagEntity();
      entity.featureId = df.featureId;
      entity.userId = df.userId;
      return entity;
    });

    jest.spyOn(repository, 'delete').mockResolvedValue(entities as any);

    const result = await repository.deleteByFeatureFlagId('feature-1');

    expect(result).toHaveLength(2);
    expect(repository.delete)
      .toHaveBeenCalledWith(expect.any(String))
      .callCount(2);
  });

  it('should throw an error if delete fails', async () => {
    jest
      .spyOn(repository, 'delete')
      .mockRejectedValue(new Error('Delete Error'));

    await expect(repository.deleteByFeatureFlagId('feature-1')).rejects.toThrow(
      'Delete Error',
    );
  });
});
