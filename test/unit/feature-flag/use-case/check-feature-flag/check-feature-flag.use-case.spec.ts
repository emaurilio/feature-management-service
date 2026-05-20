import { ModuleRef } from '@nestjs/core';
import { CheckFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { FeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditLogService } from 'src/modules/feature-flag/application/services/audit-log.service';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { CheckFeatureFlagUserUseCase } from 'src/modules/feature-flag/application/use-cases/check-feature-flag/check-feature-flag-user.use-case';

describe('CheckFeatureFlagUseCase', () => {
  let useCase: CheckFeatureFlagUseCase;
  let moduleRef: { get: jest.Mock };
  let featureFlagRepository: { findByName: jest.Mock };
  let auditLogService: { dispatchLog: jest.Mock };

  beforeEach(() => {
    moduleRef = {
      get: jest.fn(),
    };
    featureFlagRepository = {
      findByName: jest.fn(),
    };
    auditLogService = {
      dispatchLog: jest.fn().mockResolvedValue(true),
    };

    useCase = new CheckFeatureFlagUseCase(
      featureFlagRepository as unknown as FeatureFlagRepository,
      moduleRef as unknown as ModuleRef,
      auditLogService as unknown as AuditLogService,
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

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'user-1',
        data: expect.objectContaining({
          feature_name: 'missing-flag',
          error: 'Feature Flag not found',
          check_method: 'database',
        }),
      }),
    );
  });

  it('should return false when feature flag is inactive', async () => {
    featureFlagRepository.findByName.mockResolvedValue({
      id: 'feature-id',
      name: 'my-feature',
      nameVersion: 'my-feature-2',
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

    expect(result.checkFeatureFlag).toBe(false);
    expect(result.name).toBe('my-feature');
    expect(moduleRef.get).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          feature_name: 'my-feature',
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
      nameVersion: 'my-feature-2',
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
    expect(result.checkFeatureFlag).toBe(true);
    expect(result.id).toBe('feature-id');
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag',
        data: expect.objectContaining({
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
      nameVersion: 'my-feature-1',
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

    expect(result.checkFeatureFlag).toBe(false);

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'user-2',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          feature_name: 'my-feature',
          check_result: false,
          check_method: 'database',
        }),
      }),
    );
  });
});