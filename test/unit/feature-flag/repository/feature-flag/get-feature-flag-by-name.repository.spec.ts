/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';

describe('GetFeatureFlagByNameRepository', () => {
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

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should return a FeatureFlag when found by name', async () => {
    const entity = new FeatureFlagEntity();
    entity.id = 'some-uuid';
    entity.name = 'test-feature';
    entity.nameVersion = 'test-feature-1';
    entity.version = 1;
    entity.isActive = true;
    entity.percentage = 100;
    entity.type = FeatureFlagType.PERCENTAGE;

    jest.spyOn(repository, 'findOne').mockResolvedValue(entity as any);

    const result = await repository.findByName('test-feature');

    expect(result).toBeDefined();
    expect(result?.name).toBe('test-feature');
    expect(result?.nameVersion).toBe('test-feature-1');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name: 'test-feature' },
    });
  });

  it('should return null when no FeatureFlag is found by name', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await repository.findByName('non-existent');

    expect(result).toBeNull();
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name: 'non-existent' },
    });
  });

  it('should throw an error if findOne fails', async () => {
    jest
      .spyOn(repository, 'findOne')
      .mockRejectedValue(new Error('DB connection failed'));

    await expect(repository.findByName('any-name')).rejects.toThrow(
      'DB connection failed',
    );
  });
});
