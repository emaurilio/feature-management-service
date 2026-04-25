/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { FeatureFlagCacheService } from 'src/feature-flag/application/services/feature-flag-cache.service';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { CheckFeatureFlagCompanyUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-company.use-case';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';

describe('CheckFeatureFlagCompanyUseCase', () => {
  let featureFlagCacheService: jest.Mocked<FeatureFlagCacheService>;
  let logService: jest.Mocked<LogService>;
  let useCase: CheckFeatureFlagCompanyUseCase;
  let companyFeatureFlagRepository: jest.Mocked<CompanyFeatureFlagRepositoryInterface>;

  const dtoBase: CheckFeatureFlagDto = {
    companyId: 'company-1',
    featureName: 'my-feature',
    version: 2,
    featureId: 'feature-id',
    percentage: 0.0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckFeatureFlagCompanyUseCase,
        {
          provide: FeatureFlagCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: LogService,
          useValue: {
            dispatchLog: jest.fn(),
          },
        },
        {
          provide: 'CompanyFeatureFlagRepositoryInterface',
          useValue: {
            findByCompanyIdAndFeatureFlagId: jest.fn(),
          },
        },
      ],
    }).compile();

    featureFlagCacheService = module.get(FeatureFlagCacheService);
    logService = module.get(LogService);
    useCase = module.get(CheckFeatureFlagCompanyUseCase);
    companyFeatureFlagRepository = module.get('CompanyFeatureFlagRepositoryInterface');

    logService.dispatchLog.mockResolvedValue(true);
    featureFlagCacheService.set.mockResolvedValue();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(featureFlagCacheService).toBeDefined();
    expect(logService).toBeDefined();
    expect(companyFeatureFlagRepository).toBeDefined();
  });

  it('should return cached true and avoid repository when cache hit', async () => {
    featureFlagCacheService.get.mockResolvedValue(true);

    const result = await useCase.execute(dtoBase);

    const [cacheKey] = featureFlagCacheService.get.mock.calls[0] as [string];
    expect(cacheKey).toContain('company-1');
    expect(cacheKey).toContain('my-feature');
    expect(cacheKey).toContain('2');
    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company',
        data: expect.objectContaining({
          check_result: true,
          check_method: 'cache',
        }),
      }),
    );
  });

  it('should return cached false and avoid repository when cache hit', async () => {
    featureFlagCacheService.get.mockResolvedValue(false);

    const result = await useCase.execute(dtoBase);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company',
        data: expect.objectContaining({
          check_result: false,
          check_method: 'cache',
        }),
      }),
    );
  });

  it('should return false when company feature flag is not found', async () => {
    featureFlagCacheService.get.mockResolvedValue(null);
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      null,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('company-1', 'feature-id');
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(logService.dispatchLog).toHaveBeenCalledTimes(2);
  });

  it('should return true and cache result when company feature flag is found', async () => {
    featureFlagCacheService.get.mockResolvedValue(null);
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('company-1', 'feature-id');
    expect(featureFlagCacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('company-1'),
      true,
    );
    expect(result).toBe(true);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company',
        data: expect.objectContaining({
          check_result: true,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should query repository with empty company and feature ids when they are missing', async () => {
    featureFlagCacheService.get.mockResolvedValue(null);
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      null,
    );

    const dtoWithoutIds: CheckFeatureFlagDto = {
      ...dtoBase,
      companyId: '',
      featureId: '',
    };

    await useCase.execute(dtoWithoutIds);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('', '');
  });
});
