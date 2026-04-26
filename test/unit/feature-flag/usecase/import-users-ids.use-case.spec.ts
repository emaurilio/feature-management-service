/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';
import type { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { ImportUsersIdsUseCase } from 'src/feature-flag/application/use-cases/import-users-ids.use-case';
import { ImportUsersIdsDto } from 'src/feature-flag/application/dto/import-users-ids.dto';

describe('ImportUsersIdsUseCase', () => {
  let useCase: ImportUsersIdsUseCase;
  let featureFlagRepository: jest.Mocked<FeatureFlagRepositoryInterface>;
  let userFeatureFlagRepository: jest.Mocked<UserFeatureFlagRepositoryInterface>;
  let logService: jest.Mocked<LogService>;
  let cacheService: jest.Mocked<CacheServiceInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportUsersIdsUseCase,
        {
          provide: 'FeatureFlagRepositoryInterface',
          useValue: {
            findByName: jest.fn(),
          },
        },
        {
          provide: 'UserFeatureFlagRepositoryInterface',
          useValue: {
            findByUserIdAndFeatureFlagId: jest.fn(),
            createMany: jest.fn(),
          },
        },
        {
          provide: LogService,
          useValue: {
            dispatchLog: jest.fn(),
          },
        },
        {
          provide: CACHE_SERVICE,
          useValue: {
            invalidateCacheEntityFlags: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ImportUsersIdsUseCase>(ImportUsersIdsUseCase);
    cacheService = module.get<jest.Mocked<CacheServiceInterface>>(
      CACHE_SERVICE,
    );
    featureFlagRepository = module.get<
      jest.Mocked<FeatureFlagRepositoryInterface>
    >('FeatureFlagRepositoryInterface');
    userFeatureFlagRepository = module.get<
      jest.Mocked<UserFeatureFlagRepositoryInterface>
    >('UserFeatureFlagRepositoryInterface');
    logService = module.get<jest.Mocked<LogService>>(LogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(featureFlagRepository).toBeDefined();
    expect(userFeatureFlagRepository).toBeDefined();
    expect(logService).toBeDefined();
    expect(cacheService).toBeDefined();
  });

  it('should import multiple user ids successfully', async () => {
    const dto: ImportUsersIdsDto = {
      featureFlagName: 'test-flag',
      usersIds: ['user-1', 'user-2'],
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'User One',
      },
    };

    const mockFeatureFlag = new FeatureFlag(
      'flag-1-uuid',
      'test-flag',
      100,
      1,
      true,
      FeatureFlagType.PERCENTAGE,
    );

    featureFlagRepository.findByName.mockResolvedValue(mockFeatureFlag);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(
      null,
    );
    userFeatureFlagRepository.createMany.mockResolvedValue([] as any);

    const result = await useCase.execute(dto);

    expect(featureFlagRepository.findByName).toHaveBeenCalledWith('test-flag');
    expect(
      userFeatureFlagRepository.findByUserIdAndFeatureFlagId,
    ).toHaveBeenCalledTimes(2);
    expect(userFeatureFlagRepository.createMany).toHaveBeenCalled();
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'import',
        entity: 'FeatureFlag',
      }),
    );
    expect(
      cacheService.invalidateCacheEntityFlags,
    ).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw when feature flag is not found', async () => {
    const dto: ImportUsersIdsDto = {
      featureFlagName: 'non-existent',
      usersIds: ['user-1'],
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'User One',
      },
    };

    featureFlagRepository.findByName.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow(
      'Feature Flag not found',
    );
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'import',
        data: expect.objectContaining({
          error: 'FeatureFlag not found',
        }),
      }),
    );
  });

  it('should skip creation for users that already have the flag', async () => {
    const dto: ImportUsersIdsDto = {
      featureFlagName: 'test-flag',
      usersIds: ['user-existing'],
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'User One',
      },
    };

    const mockFeatureFlag = new FeatureFlag(
      'flag-1-uuid',
      'test-flag',
      100,
      1,
      true,
      FeatureFlagType.PERCENTAGE,
    );

    featureFlagRepository.findByName.mockResolvedValue(mockFeatureFlag);
    userFeatureFlagRepository.findByUserIdAndFeatureFlagId.mockResolvedValue({
      id: 'existing-id',
    } as any);
    userFeatureFlagRepository.createMany.mockResolvedValue([] as any);

    await useCase.execute(dto);

    expect(userFeatureFlagRepository.createMany).toHaveBeenCalledWith([
      { id: 'existing-id' },
    ]);
  });

  it('should throw an error and log if an exception occurs', async () => {
    const dto: ImportUsersIdsDto = {
      featureFlagName: 'test-flag',
      usersIds: ['user-1'],
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'User One',
      },
    };

    featureFlagRepository.findByName.mockRejectedValue(
      new Error('Unexpected error'),
    );

    await expect(useCase.execute(dto)).rejects.toThrow('Unexpected error');
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'import',
        entity: 'FeatureFlag',
      }),
    );
  });
});
