/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CheckFeatureFlagDto } from 'src/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';
import { FeatureFlagCacheService } from 'src/feature-flag/application/services/feature-flag-cache.service';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { CheckFeatureFlagUserUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-user.use-case';
import type { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';

describe('CheckFeatureFlagUserUseCase', () => {
  let featureFlagCacheService: jest.Mocked<FeatureFlagCacheService>;
  let logService: jest.Mocked<LogService>;
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
          provide: 'UserFeatureFlagRepositoryInterface',
          useValue: {
            findByUserIdAndFeatureFlagId: jest.fn(),
          },
        },
      ],
    }).compile();

    featureFlagCacheService = module.get(FeatureFlagCacheService);
    logService = module.get(LogService);
    useCase = module.get(CheckFeatureFlagUserUseCase);
    userFeatureFlagRepository = module.get('UserFeatureFlagRepositoryInterface');

    logService.dispatchLog.mockResolvedValue(true);
    featureFlagCacheService.set.mockResolvedValue();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(featureFlagCacheService).toBeDefined();
    expect(logService).toBeDefined();
    expect(userFeatureFlagRepository).toBeDefined();
  });

  it('should return cached true and avoid repository when cache hit', async () => {
    featureFlagCacheService.get.mockResolvedValue(true);

    const result = await useCase.execute(dtoBase);

    const [cacheKey] = featureFlagCacheService.get.mock.calls[0] as [string];
    expect(cacheKey).toContain('user-1');
    expect(cacheKey).toContain('my-feature');
    expect(cacheKey).toContain('2');
    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(true);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
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
    featureFlagCacheService.get.mockResolvedValue(false);

    const result = await useCase.execute(dtoBase);

    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).not.toHaveBeenCalled();
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
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
    featureFlagCacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      null,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('user-1', 'feature-id');
    expect(featureFlagCacheService.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(logService.dispatchLog).toHaveBeenCalledTimes(1);
  });

  it('should return true and cache result when user feature flag is found', async () => {
    featureFlagCacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      {} as any,
    );

    const result = await useCase.execute(dtoBase);

    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('user-1', 'feature-id');
    expect(featureFlagCacheService.set).toHaveBeenCalledWith(
      expect.stringContaining('user-1'),
      true,
    );
    expect(result).toBe(true);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
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
    featureFlagCacheService.get.mockResolvedValue(null);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      null,
    );

    const dtoWithoutIds: CheckFeatureFlagDto = {
      ...dtoBase,
      userId: '',
      featureId: '',
    };

    await useCase.execute(dtoWithoutIds);

    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).toHaveBeenCalledWith('', '');
  });
});
