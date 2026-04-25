import { ModuleRef } from '@nestjs/core';
import { CheckFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { CheckFeatureFlagUserUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-user.use-case';

describe('CheckFeatureFlagUseCase', () => {
  let useCase: CheckFeatureFlagUseCase;
  let moduleRef: { get: jest.Mock };
  let featureFlagRepository: { findByName: jest.Mock };
  let logService: { dispatchLog: jest.Mock };

  beforeEach(() => {
    moduleRef = {
      get: jest.fn(),
    };
    featureFlagRepository = {
      findByName: jest.fn(),
    };
    logService = {
      dispatchLog: jest.fn().mockResolvedValue(true),
    };

    useCase = new CheckFeatureFlagUseCase(
      moduleRef as unknown as ModuleRef,
      featureFlagRepository as unknown as FeatureFlagRepository,
      logService as unknown as LogService,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw when feature flag does not exist', async () => {
    featureFlagRepository.findByName.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'missing-flag',
        userId: 'user-1',
        companyId: 'company-1',
      }),
    ).rejects.toThrow('Feature Flag missing-flag not found');

    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          featureName: 'missing-flag',
          user_id: 'user-1',
          check_result: false,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should return false when feature flag is inactive', async () => {
    featureFlagRepository.findByName.mockResolvedValue({
      id: 'feature-id',
      name: 'my-feature',
      version: 2,
      percentage: 50,
      isActive: false,
      type: FeatureFlagType.USER,
    });

    const result = await useCase.execute({
      name: 'my-feature',
      userId: 'user-1',
      companyId: 'company-1',
    });

    expect(result).toBe(false);
    expect(moduleRef.get).not.toHaveBeenCalled();
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag',
        data: expect.objectContaining({
          featureName: 'my-feature',
          user_id: 'user-1',
          check_result: false,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should throw when strategy for type is not found', async () => {
    featureFlagRepository.findByName.mockResolvedValue({
      id: 'feature-id',
      name: 'my-feature',
      version: 2,
      percentage: 50,
      isActive: true,
      type: 'invalid_type',
    });

    await expect(
      useCase.execute({
        name: 'my-feature',
        userId: 'user-1',
        companyId: 'company-1',
      }),
    ).rejects.toThrow('Strategy for invalid_type not found');
  });

  it('should resolve strategy, execute it and return result', async () => {
    const strategyExecute = jest.fn().mockResolvedValue(true);
    const strategy = { execute: strategyExecute };

    featureFlagRepository.findByName.mockResolvedValue({
      id: 'feature-id',
      name: 'my-feature',
      version: 2,
      percentage: 25,
      isActive: true,
      type: FeatureFlagType.USER,
    });
    moduleRef.get.mockReturnValue(strategy);

    const result = await useCase.execute({
      name: 'my-feature',
      userId: 'user-1',
      companyId: 'company-1',
    });

    expect(moduleRef.get).toHaveBeenCalledWith(CheckFeatureFlagUserUseCase, {
      strict: false,
    });
    expect(strategyExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        companyId: 'company-1',
        name: 'my-feature',
        featureName: 'my-feature',
        version: 2,
        featureId: 'feature-id',
        percentage: 25,
      }),
    );
    expect(result).toBe(true);
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag',
        data: expect.objectContaining({
          featureName: 'my-feature',
          check_result: true,
          check_method: 'database',
        }),
      }),
    );
  });

  it('should use empty featureId when repository returns undefined id', async () => {
    const strategyExecute = jest.fn().mockResolvedValue(false);
    moduleRef.get.mockReturnValue({ execute: strategyExecute });
    featureFlagRepository.findByName.mockResolvedValue({
      name: 'my-feature',
      version: 1,
      percentage: 10,
      isActive: true,
      type: FeatureFlagType.USER,
    });

    const result = await useCase.execute({
      name: 'my-feature',
      userId: 'user-2',
      companyId: 'company-9',
    });

    expect(strategyExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        featureId: '',
      }),
    );
    expect(result).toBe(false);
  });
});
