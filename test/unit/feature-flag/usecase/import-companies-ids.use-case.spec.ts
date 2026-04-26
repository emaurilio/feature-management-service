/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { CACHE_SERVICE } from 'src/common/cache/cache-service.interface';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import { ImportCompaniesIdsUseCase } from 'src/feature-flag/application/use-cases/import-companies-ids.use-case';
import { ImportCompaniesIdsDto } from 'src/feature-flag/application/dto/import-companies-ids.dto';

describe('ImportCompaniesIdsUseCase', () => {
  let useCase: ImportCompaniesIdsUseCase;
  let featureFlagRepository: jest.Mocked<FeatureFlagRepositoryInterface>;
  let companyFeatureFlagRepository: jest.Mocked<CompanyFeatureFlagRepositoryInterface>;
  let logService: jest.Mocked<LogService>;
  let cacheService: jest.Mocked<CacheServiceInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportCompaniesIdsUseCase,
        {
          provide: 'FeatureFlagRepositoryInterface',
          useValue: {
            findByName: jest.fn(),
          },
        },
        {
          provide: 'CompanyFeatureFlagRepositoryInterface',
          useValue: {
            findByCompanyIdAndFeatureFlagId: jest.fn(),
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

    useCase = module.get<ImportCompaniesIdsUseCase>(ImportCompaniesIdsUseCase);
    cacheService = module.get<jest.Mocked<CacheServiceInterface>>(
      CACHE_SERVICE,
    );
    featureFlagRepository = module.get<
      jest.Mocked<FeatureFlagRepositoryInterface>
    >('FeatureFlagRepositoryInterface');
    companyFeatureFlagRepository = module.get<
      jest.Mocked<CompanyFeatureFlagRepositoryInterface>
    >('CompanyFeatureFlagRepositoryInterface');
    logService = module.get<jest.Mocked<LogService>>(LogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(featureFlagRepository).toBeDefined();
    expect(companyFeatureFlagRepository).toBeDefined();
    expect(logService).toBeDefined();
    expect(cacheService).toBeDefined();
  });

  it('should import multiple company ids successfully', async () => {
    const dto: ImportCompaniesIdsDto = {
      featureFlagName: 'test-flag',
      companiesIds: ['company-1', 'company-2'],
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
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      null,
    );
    companyFeatureFlagRepository.createMany.mockResolvedValue([] as any);

    const result = await useCase.execute(dto);

    expect(featureFlagRepository.findByName).toHaveBeenCalledWith('test-flag');
    expect(
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId,
    ).toHaveBeenCalledTimes(2);
    expect(companyFeatureFlagRepository.createMany).toHaveBeenCalled();
    expect(logService.dispatchLog).toHaveBeenCalledWith({
      action: 'import',
      entity: 'FeatureFlag',
      timestamp: expect.any(String),
      data: {
        featureFlagName: 'test-flag',
        companiesIds: ['company-1', 'company-2'],
        user: {
          userId: 'user-1',
          email: 'user@example.com',
          name: 'User One',
        },
      },
    });
    expect(
      cacheService.invalidateCacheEntityFlags,
    ).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should skip creation for companies that already have the flag', async () => {
    const dto: ImportCompaniesIdsDto = {
      featureFlagName: 'test-flag',
      companiesIds: ['company-existing'],
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
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      {
        id: 'existing-id',
      } as any,
    );
    companyFeatureFlagRepository.createMany.mockResolvedValue([] as any);

    await useCase.execute(dto);

    expect(companyFeatureFlagRepository.createMany).toHaveBeenCalledWith([
      { id: 'existing-id' },
    ]);
  });

  it('should throw when feature flag is not found', async () => {
    const dto: ImportCompaniesIdsDto = {
      featureFlagName: 'non-existent',
      companiesIds: ['company-1'],
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
          error: 'Feature Flag not found',
        }),
      }),
    );
  });

  it('should skip creation for companies that already have the flag', async () => {
    const dto: ImportCompaniesIdsDto = {
      featureFlagName: 'test-flag',
      companiesIds: ['company-existing'],
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
    companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(
      {
        id: 'existing-id',
      } as any,
    );
    companyFeatureFlagRepository.createMany.mockResolvedValue([] as any);

    await useCase.execute(dto);

    expect(companyFeatureFlagRepository.createMany).toHaveBeenCalledWith([
      { id: 'existing-id' },
    ]);
  });

  it('should throw an error and log if an exception occurs', async () => {
    const dto: ImportCompaniesIdsDto = {
      featureFlagName: 'test-flag',
      companiesIds: ['company-1'],
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
