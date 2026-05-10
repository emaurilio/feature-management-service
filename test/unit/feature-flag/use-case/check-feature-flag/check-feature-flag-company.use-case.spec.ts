/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/modules/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { AuditLogService } from 'src/modules/feature-flag/application/services/audit-log.service';
import { CheckFeatureFlagCompanyUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-company.use-case';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/company-feature-flag.repository.interface';

describe('CheckFeatureFlagCompanyUseCase', () => {
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
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
          provide: CACHE_SERVICE,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
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

    cacheService = module.get(CACHE_SERVICE);
    auditLogService = module.get(AuditLogService);
    useCase = module.get(CheckFeatureFlagCompanyUseCase);
    companyFeatureFlagRepository = module.get('CompanyFeatureFlagRepositoryInterface');

    auditLogService.dispatchLog.mockResolvedValue(true);
    cacheService.set.mockResolvedValue();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(cacheService).toBeDefined();
    expect(auditLogService).toBeDefined();
    expect(companyFeatureFlagRepository).toBeDefined();
  });

  it('should return cached true and avoid repository when cache hit', async () => {
    cacheService.get.mockResolvedValue(true);

    const result = await useCase.execute(dtoBase);

    const [cacheKey] = cacheService.get.mock.calls[0] as [string];
    expect(cacheKey).toContain('company-1');
    expect(cacheKey).toContain('my-feature');
    expect(cacheKey).toContain('2');
    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
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
    cacheService.get.mockResolvedValue(false);

    const result = await useCase.execute(dtoBase);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
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
    cacheService.get.mockResolvedValue(null);
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      null,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('company-1', 'feature-id');
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(auditLogService.dispatchLog).toHaveBeenCalledTimes(2);
  });

  it('should return true and cache result when company feature flag is found', async () => {
    cacheService.get.mockResolvedValue(null);
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('company-1', 'feature-id');
    expect(cacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('company-1'),
      true,
    );
    expect(result).toBe(true);
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company',
        data: expect.objectContaining({
          check_result: true,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should throw when company id is missing', async () => {
    const dtoWithoutIds: CheckFeatureFlagDto = {
      ...dtoBase,
      companyId: '',
      featureId: '',
    };

    await expect(useCase.execute(dtoWithoutIds)).rejects.toThrow(
      'Company ID is required',
    );

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company',
        data: expect.objectContaining({
          error: 'Company ID is required',
        }),
      }),
    );
  });
});
