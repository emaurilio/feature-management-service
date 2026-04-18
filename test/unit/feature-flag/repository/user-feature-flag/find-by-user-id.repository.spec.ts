/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { UserFeatureFlag } from 'src/feature-flag/domain/entities/UserFeatureFlag';
import { UserFeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';

describe('UserFeatureFlagRepository - findByUserId', () => {
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

  it('should get user feature flags by user id', async () => {
    const domainFlags = [
      new UserFeatureFlag('feature-1', 'user-1'),
      new UserFeatureFlag('feature-2', 'user-1'),
    ];

    const entities = domainFlags.map((df) => {
      const entity = new UserFeatureFlagEntity();
      entity.featureId = df.featureId;
      entity.userId = df.userId;
      return entity;
    });

    jest.spyOn(repository, 'find').mockResolvedValue(entities as any);

    const result = await repository.findByUserId('user-1');

    expect(result).toHaveLength(2);
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(result?.[0].featureId).toBe('feature-1');
    expect(result?.[1].featureId).toBe('feature-2');
  });

  it('should return only user feature flags for the requested user id when the DB has other records', async () => {
    const domainFlags = [
      new UserFeatureFlag('feature-1', 'user-1'),
      new UserFeatureFlag('feature-1', 'user-5'),
      new UserFeatureFlag('feature-2', 'user-4'),
    ];

    const entities = domainFlags.map((df) => {
      const entity = new UserFeatureFlagEntity();
      entity.featureId = df.featureId;
      entity.userId = df.userId;
      return entity;
    });

    const expectedEntities = entities.filter(
      (entity) => entity.userId === 'user-1',
    );

    jest.spyOn(repository, 'find').mockResolvedValue(expectedEntities as any);

    const result = await repository.findByUserId('user-1');

    expect(result).toHaveLength(1);
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(result?.[0].featureId).toBe('feature-1');
  });

  it('should return null when no user feature flags exist', async () => {
    jest.spyOn(repository, 'find').mockResolvedValue(null as any);

    const result = await repository.findByUserId('user-1');

    expect(result).toBeNull();
  });
});
