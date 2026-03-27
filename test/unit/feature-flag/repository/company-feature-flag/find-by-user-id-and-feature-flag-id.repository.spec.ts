/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { CompanyFeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/CompanyFeatureFlag.entity';

describe('CompanyFeatureFlagRepository - findByCompanyIdAndFeatureFlagId', () => {
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

  it('should return a CompanyFeatureFlagEntity when found by companyId and featureId', async () => {
    const entity = new CompanyFeatureFlagEntity();
    entity.id = 'some-uuid';
    entity.companyId = 'company-123';
    entity.featureId = 'feature-456';

    jest.spyOn(repository, 'findOne').mockResolvedValue(entity as any);

    const result = await repository.findByCompanyIdAndFeatureFlagId(
      'company-123',
      'feature-456',
    );

    expect(result).toBeDefined();
    expect(result?.companyId).toBe('company-123');
    expect(result?.featureId).toBe('feature-456');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { companyId: 'company-123', featureId: 'feature-456' },
    });
  });

  it('should return null when no CompanyFeatureFlagEntity is found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await repository.findByCompanyIdAndFeatureFlagId(
      'non-existent',
      'any-feature',
    );

    expect(result).toBeNull();
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { companyId: 'non-existent', featureId: 'any-feature' },
    });
  });

  it('should throw an error if findOne fails', async () => {
    jest.spyOn(repository, 'findOne').mockRejectedValue(new Error('DB Error'));

    await expect(
      repository.findByCompanyIdAndFeatureFlagId('any-company', 'any-feature'),
    ).rejects.toThrow('DB Error');
  });
});
