/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DisableFeatureFlagDto } from 'src/feature-flag/application/dto/desable-feature-flag.dto';
import { AuditLogService } from 'src/feature-flag/application/services/audit-log.service';
import { DisableFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/disable-feature-flag.use-case';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';

describe('DisableFeatureFlagUseCase', () => {
  let useCase: DisableFeatureFlagUseCase;
  let repository: jest.Mocked<FeatureFlagRepository>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisableFeatureFlagUseCase,
        {
          provide: 'FeatureFlagRepositoryInterface',
          useValue: {
            findByName: jest.fn(),
            updateFeatureFlag: jest.fn(),
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

    useCase = module.get<DisableFeatureFlagUseCase>(DisableFeatureFlagUseCase);
    repository = module.get('FeatureFlagRepositoryInterface');
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(repository).toBeDefined();
    expect(auditLogService).toBeDefined();
  });

  it('should disable a feature flag', async () => {
    const disableFeatureFlagDto: DisableFeatureFlagDto = {
      featureFlagName: 'test-flag',
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const existingFeatureFlag = new FeatureFlag(
      'test-flag-1',
      'test-flag',
      50,
      1,
      false,
      FeatureFlagType.PERCENTAGE,
      'flag-123',
      new Date('2023-01-01'),
      new Date('2023-01-01'),
    );

    const updatedFeatureFlag = new FeatureFlag(
      'test-flag-1',
      'test-flag',
      50,
      1,
      true,
      FeatureFlagType.PERCENTAGE,
      'flag-123',
      new Date('2023-01-01'),
      new Date(),
    );

    repository.findByName.mockResolvedValue(existingFeatureFlag);
    repository.updateFeatureFlag.mockResolvedValue(updatedFeatureFlag);

    const result = await useCase.execute(disableFeatureFlagDto);

    expect(result).toEqual(updatedFeatureFlag);
    expect(repository.findByName).toHaveBeenCalledWith('test-flag');
    expect(repository.updateFeatureFlag).toHaveBeenCalledWith('flag-123', {
      isActive: false,
    });
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'disable_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'flag-123',
      }),
    );
  });

  it('should throw when feature flag not found', async () => {
    const disableFeatureFlagDto: DisableFeatureFlagDto = {
      featureFlagName: 'non-existent-flag',
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    repository.findByName.mockResolvedValue(null);

    await expect(useCase.execute(disableFeatureFlagDto)).rejects.toThrow(
      'Feature Flag not found',
    );
    expect(repository.findByName).toHaveBeenCalledWith('non-existent-flag');
    expect(repository.updateFeatureFlag).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'disable_feature_flag',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          error: 'Feature Flag not found',
        }),
      }),
    );
  });

  it('should throw when update fails', async () => {
    const disableFeatureFlagDto: DisableFeatureFlagDto = {
      featureFlagName: 'test-flag',
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const existingFeatureFlag = new FeatureFlag(
      'test-flag-1',
      'test-flag',
      50,
      1,
      false,
      FeatureFlagType.PERCENTAGE,
      'flag-123',
      new Date('2023-01-01'),
      new Date('2023-01-01'),
    );

    repository.findByName.mockResolvedValue(existingFeatureFlag);
    repository.updateFeatureFlag.mockRejectedValue(new Error('Update failed'));

    await expect(useCase.execute(disableFeatureFlagDto)).rejects.toThrow(
      'Update failed',
    );
    expect(repository.findByName).toHaveBeenCalledWith('test-flag');
    expect(repository.updateFeatureFlag).toHaveBeenCalledWith('flag-123', {
      isActive: false,
    });
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'disable_feature_flag',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          error: 'Update failed',
        }),
      }),
    );
  });
});
