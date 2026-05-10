/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserFeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { UserFeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/UserFeatureFlag.entity';

describe('UserFeatureFlagRepository - findByUserIdAndFeatureFlagId', () => {
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

  it('should return a UserFeatureFlagEntity when found by userId and featureId', async () => {
    const entity = new UserFeatureFlagEntity();
    entity.id = 'some-uuid';
    entity.userId = 'user-123';
    entity.featureId = 'feature-456';

    jest.spyOn(repository, 'findOne').mockResolvedValue(entity as any);

    const result = await repository.findByUserIdAndFeatureFlagId(
      'user-123',
      'feature-456',
    );

    expect(result).toBeDefined();
    expect(result?.userId).toBe('user-123');
    expect(result?.featureId).toBe('feature-456');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-123', featureId: 'feature-456' },
    });
  });

  it('should return null when no UserFeatureFlagEntity is found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await repository.findByUserIdAndFeatureFlagId(
      'non-existent',
      'any-feature',
    );

    expect(result).toBeNull();
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { userId: 'non-existent', featureId: 'any-feature' },
    });
  });

  it('should throw an error if findOne fails', async () => {
    jest.spyOn(repository, 'findOne').mockRejectedValue(new Error('DB Error'));

    await expect(
      repository.findByUserIdAndFeatureFlagId('any-user', 'any-feature'),
    ).rejects.toThrow('DB Error');
  });
});
