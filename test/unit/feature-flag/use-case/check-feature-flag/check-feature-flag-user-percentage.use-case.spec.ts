/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CACHE_SERVICE } from 'src/modules/common/cache/cache-service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/modules/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { HashFeatureFlagService } from 'src/modules/feature-flag/application/services/hash-feature-flag.service';
import { AuditLogService } from 'src/modules/feature-flag/application/services/audit-log.service';
import { CheckFeatureFlagUserPercentageUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-user-percentage.use-case';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { UserFeatureFlagRepositoryInterface } from 'src/modules/feature-flag/domain/repositories/user-feature-flag.repository.interface';

describe('CheckFeatureFlagUserPercentageUseCase', () => {
  let hashFeatureFlagService: jest.Mocked<HashFeatureFlagService>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let useCase: CheckFeatureFlagUserPercentageUseCase;
  let userFeatureFlagRepository: jest.Mocked<UserFeatureFlagRepositoryInterface>;

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
        CheckFeatureFlagUserPercentageUseCase,
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
        {
          provide: 'UserFeatureFlagRepositoryInterface',
          useValue: {
            findByUserIdAndFeatureFlagId: jest.fn(),
          },
        },
      ],
    }).compile();

    hashFeatureFlagService = module.get(HashFeatureFlagService);
    cacheService = module.get(CACHE_SERVICE);
    auditLogService = module.get(AuditLogService);
    useCase = module.get(CheckFeatureFlagUserPercentageUseCase);
    userFeatureFlagRepository = module.get('UserFeatureFlagRepositoryInterface');

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

    const [cacheKey] = cacheService.get.mock.calls[0] as [string];
    expect(cacheKey).toContain('user-1-my-feature-2');
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        entityId: dtoBase.userId,
        data: expect.objectContaining({
          check_result: true,
          check_method: 'cache',
        }),
      }),
    );
  });

  it('should return false from cache and avoid repository/hash when cache hit is false', async () => {
    cacheService.get.mockResolvedValue(false);

    const result = await useCase.execute(dtoBase);

    expect(result).toBe(false);
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        entityId: dtoBase.userId,
        data: expect.objectContaining({
          check_result: false,
          check_method: 'cache',
        }),
      }),
    );
  });

  it('should calculate hash, save cache and return true when hash is lower than percentage', async () => {
    cacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );
    hashFeatureFlagService.calculateHash.mockReturnValue(10);

    const result = await useCase.execute(dtoBase);

    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('user-1', 'feature-id');

    const [hashInput] = hashFeatureFlagService.calculateHash.mock.calls[0] as [
      string,
    ];
    expect(hashInput).toContain('user-1');
    expect(hashInput).toContain('my-feature');
    expect(hashInput).toContain('2');

    expect(cacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('user-1'),
      true,
    );
    expect(result).toBe(true);

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        entityId: dtoBase.userId,
        data: expect.objectContaining({
          check_result: true,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should calculate hash, save cache and return false when hash is greater than or equal to percentage', async () => {
    cacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );
    hashFeatureFlagService.calculateHash.mockReturnValue(70);

    const result = await useCase.execute(dtoBase);

    expect(cacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('user-1'),
      false,
    );
    expect(result).toBe(false);
  });

  it('should return false when user feature flag is not found', async () => {
    cacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      null,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('user-1', 'feature-id');
    expect(hashFeatureFlagService.calculateHash).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_user_percentage',
        entity: 'FeatureFlag',
        entityId: dtoBase.userId,
        data: expect.objectContaining({
          check_result: false,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should query repository with empty user and feature ids when they are missing', async () => {
    cacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      null,
    );

    const dtoWithoutIds: CheckFeatureFlagDto = {
      ...dtoBase,
      userId: '',
      featureId: '',
    };

    await expect(useCase.execute(dtoWithoutIds)).rejects.toThrow('User ID is required');

    expect(cacheService.get).not.toHaveBeenCalled();
    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).not.toHaveBeenCalled();
  });
});
