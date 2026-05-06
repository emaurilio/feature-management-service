/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { AuditLogService } from 'src/feature-flag/application/services/audit-log.service';
import { CheckFeatureFlagUserUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-user.use-case';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import type { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';

describe('CheckFeatureFlagUserUseCase', () => {
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let useCase: CheckFeatureFlagUserUseCase;
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
        CheckFeatureFlagUserUseCase,
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

    cacheService = module.get(CACHE_SERVICE);
    auditLogService = module.get(AuditLogService);
    useCase = module.get(CheckFeatureFlagUserUseCase);
    userFeatureFlagRepository = module.get('UserFeatureFlagRepositoryInterface');

    auditLogService.dispatchLog.mockResolvedValue(true);
    cacheService.set.mockResolvedValue();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(cacheService).toBeDefined();
    expect(auditLogService).toBeDefined();
    expect(userFeatureFlagRepository).toBeDefined();
  });

  it('should return cached true and avoid repository when cache hit', async () => {
    cacheService.get.mockResolvedValue(true);

    const result = await useCase.execute(dtoBase);

    const [cacheKey] = cacheService.get.mock.calls[0] as [string];
    expect(cacheKey).toContain('user-1');
    expect(cacheKey).toContain('my-feature');
    expect(cacheKey).toContain('2');
    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_user',
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
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_user',
        data: expect.objectContaining({
          check_result: false,
          check_method: 'cache',
        }),
      }),
    );
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
    expect(cacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(auditLogService.dispatchLog).toHaveBeenCalledTimes(1);
  });

  it('should return true and cache result when user feature flag is found', async () => {
    cacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('user-1', 'feature-id');
    expect(cacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('user-1'),
      true,
    );
    expect(result).toBe(true);
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag_user',
        data: expect.objectContaining({
          check_result: true,
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
  });
});
