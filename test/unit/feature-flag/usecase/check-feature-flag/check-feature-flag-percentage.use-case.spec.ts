/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { FeatureFlagCacheService } from 'src/feature-flag/application/services/feature-flag-cache.service';
import { HashFeatureFlagService } from 'src/feature-flag/application/services/hash-feature-flag.service';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { CheckFeatureFlagPercentageUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-percentage.use-case';

describe('CheckFeatureFlagPercentageUseCase', () => {
  let hashFeatureFlagService: jest.Mocked<HashFeatureFlagService>;
  let featureFlagCacheService: jest.Mocked<FeatureFlagCacheService>;
  let logService: jest.Mocked<LogService>;
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
      ],
    }).compile();

    hashFeatureFlagService = module.get(HashFeatureFlagService);
    featureFlagCacheService = module.get(FeatureFlagCacheService);
    logService = module.get(LogService);
    useCase = module.get(CheckFeatureFlagPercentageUseCase);

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

    expect(featureFlagCacheService.get).toHaveBeenCalledWith('user-1-my-feature-2');
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);

    expect(logService.dispatchLog).toHaveBeenCalledWith(
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
    featureFlagCacheService.get.mockResolvedValue(null);
    hashFeatureFlagService.calculateHash.mockReturnValue(10);

    const result = await useCase.execute(dtoBase);

    expect(featureFlagCacheService.get).toHaveBeenCalledWith('user-1-my-feature-2');
    expect(hashFeatureFlagService.calculateHash).toHaveBeenCalledWith(
      'user-1-my-feature-2',
    );
    expect(featureFlagCacheService.set).toHaveBeenCalledWith(
      'user-1-my-feature-2',
      true,
    );
    expect(result).toBe(true);

    expect(logService.dispatchLog).toHaveBeenCalledWith(
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
    featureFlagCacheService.get.mockResolvedValue(null);
    hashFeatureFlagService.calculateHash.mockReturnValue(70);

    const result = await useCase.execute(dtoBase);

    expect(featureFlagCacheService.set).toHaveBeenCalledWith(
      'user-1-my-feature-2',
      false,
    );
    expect(result).toBe(false);
  });

  it('should prioritize companyId when building the key and payload', async () => {
    featureFlagCacheService.get.mockResolvedValue(false);

    const dtoWithCompany: CheckFeatureFlagDto = {
      ...dtoBase,
      userId: 'user-1',
      companyId: 'company-1',
    };

    const result = await useCase.execute(dtoWithCompany);

    expect(featureFlagCacheService.get).toHaveBeenCalledWith(
      'company-1-my-feature-2',
    );
    expect(result).toBe(false);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityId: 'company-1',
          check_method: 'cache',
        }),
      }),
    );
  });
});
