/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';

describe('CreateFeatureFlagRepository - createFeatureFlag', () => {
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

  it('should create a feature flag', async () => {
    const featureFlag = new FeatureFlag(
      'test-1',
      'test',
      55,
      1,
      true,
      FeatureFlagType.COMPANY,
    );

    const entity = new FeatureFlagEntity();
    Object.assign(entity, featureFlag);

    jest.spyOn(repository, 'save').mockResolvedValue(entity as any);

    const result = await repository.createFeatureFlag(featureFlag);

    expect(result.nameVersion).toEqual(featureFlag.nameVersion);
    expect(result.name).toEqual(featureFlag.name);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should throw an error if save fails', async () => {
    const featureFlag = new FeatureFlag(
      'test-1',
      'test',
      55,
      1,
      true,
      FeatureFlagType.COMPANY,
    );
    jest.spyOn(repository, 'save').mockRejectedValue(new Error('Save Error'));

    await expect(repository.createFeatureFlag(featureFlag)).rejects.toThrow(
      'Save Error',
    );
  });
});
