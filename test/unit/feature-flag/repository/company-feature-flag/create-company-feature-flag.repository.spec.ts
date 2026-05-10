/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyFeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CompanyFeatureFlagEntity } from 'src/modules/feature-flag/infraestructure/persistence/entities/CompanyFeatureFlag.entity';
import { CompanyFeatureFlag } from 'src/modules/feature-flag/domain/entities/CompanyFeatureFlag';

describe('CompanyFeatureFlagRepository - createCompanyFeatureFlag', () => {
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

  it('should create a company feature flag', async () => {
    const domainFlag = new CompanyFeatureFlag('feature-1', 'company-1');

    const entity = new CompanyFeatureFlagEntity();
    entity.featureId = domainFlag.featureId;
    entity.companyId = domainFlag.companyId;

    jest.spyOn(repository, 'save').mockResolvedValue(entity as any);

    const result = await repository.createCompanyFeatureFlag(domainFlag);

    expect(result).toEqual(domainFlag);
    expect(repository.save).toHaveBeenCalledWith(entity);
  });

  it('should throw an error if save fails', async () => {
    const domainFlag = new CompanyFeatureFlag('feature-1', 'company-1');
    jest.spyOn(repository, 'save').mockRejectedValue(new Error('Save Error'));

    await expect(
      repository.createCompanyFeatureFlag(domainFlag),
    ).rejects.toThrow('Save Error');
  });
});
