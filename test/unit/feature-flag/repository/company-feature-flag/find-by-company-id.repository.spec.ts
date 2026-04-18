/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CompanyFeatureFlag } from 'src/feature-flag/domain/entities/CompanyFeatureFlag';
import { CompanyFeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/CompanyFeatureFlag.entity';

describe('CompanyFeatureFlagRepository - findByCompanyId', () => {
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

  it('should get company feature flags by company id', async () => {
    const domainFlags = [
      new CompanyFeatureFlag('feature-1', 'company-1'),
      new CompanyFeatureFlag('feature-2', 'company-1'),
    ];

    const entities = domainFlags.map((df) => {
      const entity = new CompanyFeatureFlagEntity();
      entity.featureId = df.featureId;
      entity.companyId = df.companyId;
      return entity;
    });

    jest.spyOn(repository, 'find').mockResolvedValue(entities as any);

    const result = await repository.findByCompanyId('company-1');

    expect(result).toHaveLength(2);
    expect(repository.find).toHaveBeenCalledWith({
      where: { companyId: 'company-1' },
    });
    expect(result?.[0].featureId).toBe('feature-1');
    expect(result?.[1].featureId).toBe('feature-2');
  });

  it('should return only company feature flags for the requested company id when the DB has other records', async () => {
    const domainFlags = [
      new CompanyFeatureFlag('feature-1', 'company-1'),
      new CompanyFeatureFlag('feature-1', 'company-5'),
      new CompanyFeatureFlag('feature-2', 'company-4'),
    ];

    const entities = domainFlags.map((df) => {
      const entity = new CompanyFeatureFlagEntity();
      entity.featureId = df.featureId;
      entity.companyId = df.companyId;
      return entity;
    });

    const expectedEntities = entities.filter(
      (entity) => entity.companyId === 'company-1',
    );

    jest.spyOn(repository, 'find').mockResolvedValue(expectedEntities as any);

    const result = await repository.findByCompanyId('company-1');

    expect(result).toHaveLength(1);
    expect(repository.find).toHaveBeenCalledWith({
      where: { companyId: 'company-1' },
    });
    expect(result?.[0].featureId).toBe('feature-1');
  });

  it('should return null when no company feature flags exist', async () => {
    jest.spyOn(repository, 'find').mockResolvedValue(null as any);

    const result = await repository.findByCompanyId('company-1');

    expect(result).toBeNull();
  });
});
