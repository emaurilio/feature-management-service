/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyFeatureFlagRepository } from 'src/FeatureFlagModule/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CompanyFeatureFlagEntity } from 'src/FeatureFlagModule/infraestructure/persistence/entities/CompanyFeatureFlag.entity';
import { CompanyFeatureFlag } from 'src/FeatureFlagModule/domain/entities/CompanyFeatureFlag';

describe('CompanyFeatureFlagRepository - createMany', () => {
  let repository: CompanyFeatureFlagRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyFeatureFlagRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<CompanyFeatureFlagRepository>(
      CompanyFeatureFlagRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create multiple company feature flags', async () => {
    const domainFlags = [
      new CompanyFeatureFlag('feature-1', 'company-1'),
      new CompanyFeatureFlag('feature-2', 'company-2'),
    ];

    const entities = domainFlags.map((df) => {
      const entity = new CompanyFeatureFlagEntity();
      entity.featureId = df.featureId;
      entity.companyId = df.companyId;
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
    const domainFlags = [new CompanyFeatureFlag('feature-1', 'company-1')];
    jest.spyOn(repository, 'save').mockRejectedValue(new Error('Save Error'));

    await expect(repository.createMany(domainFlags)).rejects.toThrow(
      'Save Error',
    );
  });
});
