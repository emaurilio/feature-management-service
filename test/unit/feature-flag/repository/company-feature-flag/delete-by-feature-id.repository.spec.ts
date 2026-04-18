/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';

describe('CompanyFeatureFlagRepository - deleteByFeatureFlagId', () => {
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

  it('should delete company feature flags by feature flag ID only when expected rows are deleted', async () => {
    const featureId = 'feature-1';

    jest.spyOn(repository, 'count').mockResolvedValue(2 as any);
    jest
      .spyOn(repository, 'softDelete')
      .mockResolvedValue({ affected: 2 } as any);

    const result = await repository.deleteByFeatureFlagId(featureId);

    expect(repository.count).toHaveBeenCalledWith({ where: { featureId } });
    expect(repository.softDelete).toHaveBeenCalledWith({ featureId });
    expect(result).toBe(true);
  });

  it('should return false when softDelete removes fewer rows than expected', async () => {
    const featureId = 'feature-1';

    jest.spyOn(repository, 'count').mockResolvedValue(2 as any);
    jest
      .spyOn(repository, 'softDelete')
      .mockResolvedValue({ affected: 1 } as any);

    const result = await repository.deleteByFeatureFlagId(featureId);

    expect(result).toBe(false);
  });

  it('should return false when there are no rows to delete', async () => {
    const featureId = 'feature-1';

    jest.spyOn(repository, 'count').mockResolvedValue(0 as any);
    jest
      .spyOn(repository, 'softDelete')
      .mockResolvedValue({ affected: 0 } as any);

    const result = await repository.deleteByFeatureFlagId(featureId);

    expect(repository.softDelete).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
