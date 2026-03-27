/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { UserFeatureFlag } from 'src/feature-flag/domain/entities/UserFeatureFlag';
import { UserFeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';

describe('UserFeatureFlagRepository - createMany', () => {
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

  it('should create multiple user feature flags', async () => {
    const domainFlags = [
      new UserFeatureFlag('feature-1', 'user-1'),
      new UserFeatureFlag('feature-2', 'user-2'),
    ];

    const entities = domainFlags.map((df) => {
      const entity = new UserFeatureFlagEntity();
      entity.featureId = df.featureId;
      entity.userId = df.userId;
      return entity;
    });

    jest.spyOn(repository, 'save').mockResolvedValue(entities as any);

    const result = await repository.createMany(domainFlags);

    expect(result).toHaveLength(2);
    expect(repository.save).toHaveBeenCalledWith(expect.any(Array));
    expect(result[0].featureId).toBe('feature-1');
    expect(result[1].featureId).toBe('feature-2');
  });

  it('should throw an error if save fails', async () => {
    const domainFlags = [new UserFeatureFlag('feature-1', 'user-1')];
    jest.spyOn(repository, 'save').mockRejectedValue(new Error('Save Error'));

    await expect(repository.createMany(domainFlags)).rejects.toThrow(
      'Save Error',
    );
  });
});
