/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';

describe('FeatureFlagRepository - updateFeatureFlag', () => {
  let repository: FeatureFlagRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<FeatureFlagRepository>(FeatureFlagRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should update a feature flag and return the mapped entity', async () => {
    const partialUpdate: Partial<FeatureFlag> = { isActive: true };
    const entity = new FeatureFlagEntity();
    entity.id = 'flag-123';
    entity.name = 'test-flag';
    entity.nameVersion = 'test-flag-1';
    entity.percentage = 100;
    entity.version = 1;
    entity.isActive = true;
    entity.type = FeatureFlagType.PERCENTAGE;

    const updateSpy = jest
      .spyOn(Repository.prototype, 'update')
      .mockResolvedValue({} as any);
    jest.spyOn(repository, 'findOne').mockResolvedValue(entity as any);

    const result = await repository.updateFeatureFlag(
      'flag-123',
      partialUpdate,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('flag-123');
    expect(result.isActive).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith('flag-123', partialUpdate);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'flag-123' },
    });
  });

  it('should throw if update fails', async () => {
    jest
      .spyOn(Repository.prototype, 'update')
      .mockRejectedValue(new Error('Update failed'));

    await expect(
      repository.updateFeatureFlag('flag-123', { isActive: true }),
    ).rejects.toThrow('Update failed');
  });

  it('should throw if the feature flag is not found after update', async () => {
    jest.spyOn(Repository.prototype, 'update').mockResolvedValue({} as any);
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    await expect(
      repository.updateFeatureFlag('flag-123', { isActive: true }),
    ).rejects.toThrow('Feature Flag not found after update');
  });
});
