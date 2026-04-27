/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from 'src/feature-flag/application/services/hash-feature-flag.service';
import { AuditLogService } from 'src/feature-flag/application/services/audit-log.service';
import { CheckFeatureFlagPercentageUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-percentage.use-case';

describe('CheckFeatureFlagPercentageUseCase', () => {
  let hashFeatureFlagService: jest.Mocked<HashFeatureFlagService>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let useCase: CheckFeatureFlagPercentageUseCase;

  const dtoBase: CheckFeatureFlagDto = {
    userId: 'user-1',
    featureName: 'my-feature',
    version: 2,
    featureId: 'feature-id',
    percentage: 50,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckFeatureFlagPercentageUseCase,
        {
          provide: HashFeatureFlagService,
          useValue: {
            calculateHash: jest.fn(),
          },
        },
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
      ],
    }).compile();

    hashFeatureFlagService = module.get(HashFeatureFlagService);
    cacheService = module.get(CACHE_SERVICE);
    auditLogService = module.get(AuditLogService);
    useCase = module.get(CheckFeatureFlagPercentageUseCase);

    auditLogService.dispatchLog.mockResolvedValue(true);
    cacheService.set.mockResolvedValue();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(hashFeatureFlagService).toBeDefined();
    expect(cacheService).toBeDefined();
    expect(auditLogService).toBeDefined();
  });

  it('should return cached value and avoid hash calculation when cache hit', async () => {
    cacheService.get.mockResolvedValue(true);

    const result = await useCase.execute(dtoBase);

    expect(cacheService.get).toHaveBeenCalledWith('user-1-my-feature-2');
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_percentage',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          featureName: dtoBase.featureName,
          version: dtoBase.version,
          entityId: dtoBase.userId,
          check_result: true,
          check_method: 'cache',
        }),
      }),
    );
  });

  it('should calculate hash, save cache and return true when hash is lower than percentage', async () => {
    cacheService.get.mockResolvedValue(null);
    hashFeatureFlagService.calculateHash.mockReturnValue(10);

    const result = await useCase.execute(dtoBase);

    expect(cacheService.get).toHaveBeenCalledWith('user-1-my-feature-2');
    expect(hashFeatureFlagService.calculateHash).toHaveBeenCalledWith(
      'user-1-my-feature-2',
    );
    expect(cacheService.set).toHaveBeenCalledWith(
      'user-1-my-feature-2',
      true,
    );
    expect(result).toBe(true);

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_percentage',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          entityId: dtoBase.userId,
          check_result: true,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should calculate hash, save cache and return false when hash is greater than or equal to percentage', async () => {
    cacheService.get.mockResolvedValue(null);
    hashFeatureFlagService.calculateHash.mockReturnValue(70);

    const result = await useCase.execute(dtoBase);

    expect(cacheService.set).toHaveBeenCalledWith(
      'user-1-my-feature-2',
      false,
    );
    expect(result).toBe(false);
  });

  it('should prioritize companyId when building the key and payload', async () => {
    cacheService.get.mockResolvedValue(false);

    const dtoWithCompany: CheckFeatureFlagDto = {
      ...dtoBase,
      userId: 'user-1',
      companyId: 'company-1',
    };

    const result = await useCase.execute(dtoWithCompany);

    expect(cacheService.get).toHaveBeenCalledWith(
      'company-1-my-feature-2',
    );
    expect(result).toBe(false);
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityId: 'company-1',
          check_method: 'cache',
        }),
      }),
    );
  });
});
