/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { FeatureFlagCacheService } from 'src/feature-flag/application/services/feature-flag-cache.service';
import { HashFeatureFlagService } from 'src/feature-flag/application/services/hash-feature-flag.service';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { CheckFeatureFlagCompanyPercentageUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-company-percentage.use-case';
import type { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';

describe('CheckFeatureFlagCompanyPercentageUseCase', () => {
  let hashFeatureFlagService: jest.Mocked<HashFeatureFlagService>;
  let featureFlagCacheService: jest.Mocked<FeatureFlagCacheService>;
  let logService: jest.Mocked<LogService>;
  let useCase: CheckFeatureFlagCompanyPercentageUseCase;
  let companyFeatureFlagRepository: jest.Mocked<CompanyFeatureFlagRepositoryInterface>;

  const dtoBase: CheckFeatureFlagDto = {
    companyId: 'company-1',
    featureName: 'my-feature',
    version: 2,
    featureId: 'feature-id',
    percentage: 50,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckFeatureFlagCompanyPercentageUseCase,
        {
          provide: HashFeatureFlagService,
          useValue: {
            calculateHash: jest.fn(),
          },
        },
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

    hashFeatureFlagService = module.get(HashFeatureFlagService);
    featureFlagCacheService = module.get(FeatureFlagCacheService);
    logService = module.get(LogService);
    useCase = module.get(CheckFeatureFlagCompanyPercentageUseCase);
    companyFeatureFlagRepository = module.get('CompanyFeatureFlagRepositoryInterface');

    logService.dispatchLog.mockResolvedValue(true);
    featureFlagCacheService.set.mockResolvedValue();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(hashFeatureFlagService).toBeDefined();
    expect(featureFlagCacheService).toBeDefined();
    expect(logService).toBeDefined();
  });

  it('should return cached value and avoid hash calculation when cache hit', async () => {
    featureFlagCacheService.get.mockResolvedValue(true);

    const result = await useCase.execute(dtoBase);

    const [cacheKey] = featureFlagCacheService.get.mock.calls[0] as [string];
    expect(cacheKey).toContain('company-1');
    expect(cacheKey).toContain('my-feature');
    expect(cacheKey).toContain('2');
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);

    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company_percentage',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          featureName: dtoBase.featureName,
          version: dtoBase.version,
          company_id: dtoBase.companyId,
          check_result: true,
          check_method: 'cache',
        }),
      }),
    );
  });

  it('should return false from cache and avoid repository/hash when cache hit is false', async () => {
    featureFlagCacheService.get.mockResolvedValue(false);

    const result = await useCase.execute(dtoBase);

    expect(result).toBe(false);
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company_percentage',
        data: expect.objectContaining({
          check_result: false,
          check_method: 'cache',
        }),
      }),
    );
  });

  it('should calculate hash, save cache and return true when hash is lower than percentage', async () => {
    featureFlagCacheService.get.mockResolvedValue(null);
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );
    hashFeatureFlagService.calculateHash.mockReturnValue(10);

    const result = await useCase.execute(dtoBase);

    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('company-1', 'feature-id');

    const [hashInput] = hashFeatureFlagService.calculateHash.mock.calls[0] as [
      string,
    ];
    expect(hashInput).toContain('company-1');
    expect(hashInput).toContain('my-feature');
    expect(hashInput).toContain('2');

    expect(featureFlagCacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('company-1'),
      true,
    );
    expect(result).toBe(true);

    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company_percentage',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          check_result: true,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should calculate hash, save cache and return false when hash is greater than or equal to percentage', async () => {
    featureFlagCacheService.get.mockResolvedValue(null);
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );
    hashFeatureFlagService.calculateHash.mockReturnValue(70);

    const result = await useCase.execute(dtoBase);

    expect(featureFlagCacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('company-1'),
      false,
    );
    expect(result).toBe(false);
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
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);

    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_company_percentage',
        data: expect.objectContaining({
          company_id: 'company-1',
          check_result: false,
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
