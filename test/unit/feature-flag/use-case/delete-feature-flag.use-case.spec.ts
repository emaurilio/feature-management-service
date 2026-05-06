/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteFeatureFlagDto } from 'src/feature-flag/application/dto/delete-feature-flag.dto';
import { AuditLogService } from 'src/feature-flag/application/services/audit-log.service';
import { DeleteFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';

describe('DeleteFeatureFlagUseCase', () => {
  let useCase: DeleteFeatureFlagUseCase;
  let repository: jest.Mocked<FeatureFlagRepository>;
  let companyRepository: jest.Mocked<CompanyFeatureFlagRepositoryInterface>;
  let userRepository: jest.Mocked<UserFeatureFlagRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteFeatureFlagUseCase,
        {
          provide: 'FeatureFlagRepositoryInterface',
          useValue: {
            findByName: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            dispatchLog: jest.fn(),
          },
        },
        {
          provide: 'CompanyFeatureFlagRepositoryInterface',
          useValue: {
            deleteByFeatureFlagId: jest.fn(),
          },
        },
        {
          provide: 'UserFeatureFlagRepositoryInterface',
          useValue: {
            deleteByFeatureFlagId: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<DeleteFeatureFlagUseCase>(DeleteFeatureFlagUseCase);
    repository = module.get('FeatureFlagRepositoryInterface');
    companyRepository = module.get('CompanyFeatureFlagRepositoryInterface');
    userRepository = module.get('UserFeatureFlagRepositoryInterface');
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(repository).toBeDefined();
    expect(auditLogService).toBeDefined();
  });

  it('should delete a feature flag with percentage type', async () => {
    const deleteFeatureFlagDto: DeleteFeatureFlagDto = {
      name: 'test-flag',
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
      true,
      FeatureFlagType.PERCENTAGE,
      'flag-123',
      new Date('2023-01-01'),
      new Date('2023-01-01'),
    );

    const mockUpdateResult = { affected: 1 };
    repository.findByName.mockResolvedValue(existingFeatureFlag);
    repository.softDelete.mockResolvedValue(mockUpdateResult as any);

    const result = await useCase.execute(deleteFeatureFlagDto);

    expect(result).toEqual(mockUpdateResult);
    expect(repository.findByName).toHaveBeenCalledWith('test-flag');
    expect(repository.softDelete).toHaveBeenCalledWith('flag-123');
    expect(companyRepository.deleteByFeatureFlagId).not.toHaveBeenCalled();
    expect(userRepository.deleteByFeatureFlagId).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'flag-123',
      }),
    );
  });

  it('should delete a feature flag with company type', async () => {
    const deleteFeatureFlagDto: DeleteFeatureFlagDto = {
      name: 'company-flag',
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const companyFeatureFlag = new FeatureFlag(
      'company-flag-1',
      'company-flag',
      0,
      1,
      true,
      FeatureFlagType.COMPANY,
      'flag-456',
      new Date('2023-01-01'),
      new Date('2023-01-01'),
    );

    const mockUpdateResult = { affected: 1 };
    repository.findByName.mockResolvedValue(companyFeatureFlag);
    repository.softDelete.mockResolvedValue(mockUpdateResult as any);
    companyRepository.deleteByFeatureFlagId.mockResolvedValue({} as any);

    const result = await useCase.execute(deleteFeatureFlagDto);

    expect(result).toEqual(mockUpdateResult);
    expect(repository.findByName).toHaveBeenCalledWith('company-flag');
    expect(repository.softDelete).toHaveBeenCalledWith('flag-456');
    expect(companyRepository.deleteByFeatureFlagId).toHaveBeenCalledWith(
      'flag-456',
    );
    expect(userRepository.deleteByFeatureFlagId).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'flag-456',
      }),
    );
  });

  it('should throw when feature flag not found', async () => {
    const deleteFeatureFlagDto: DeleteFeatureFlagDto = {
      name: 'non-existent-flag',
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    repository.findByName.mockResolvedValue(null);

    await expect(useCase.execute(deleteFeatureFlagDto)).rejects.toThrow(
      'Feature flag not found',
    );
    expect(repository.findByName).toHaveBeenCalledWith('non-existent-flag');
    expect(repository.softDelete).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_feature_flag',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          user: {
            userId: 'user-123',
            email: 'maurilio@teste.com',
            name: 'Maurilio',
          },
          error: 'Feature flag not found',
        }),
      }),
    );
  });

  it('should throw when softDelete fails', async () => {
    const deleteFeatureFlagDto: DeleteFeatureFlagDto = {
      name: 'test-flag',
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
      true,
      FeatureFlagType.PERCENTAGE,
      'flag-123',
      new Date('2023-01-01'),
      new Date('2023-01-01'),
    );

    repository.findByName.mockResolvedValue(existingFeatureFlag);
    repository.softDelete.mockRejectedValue(new Error('Delete failed'));

    await expect(useCase.execute(deleteFeatureFlagDto)).rejects.toThrow(
      'Delete failed',
    );
    expect(repository.findByName).toHaveBeenCalledWith('test-flag');
    expect(repository.softDelete).toHaveBeenCalledWith('flag-123');
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_feature_flag',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          error: 'Delete failed',
        }),
      }),
    );
  });

  it('should delete a feature flag with user type', async () => {
    const deleteFeatureFlagDto: DeleteFeatureFlagDto = {
      name: 'user-flag',
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const userFeatureFlag = new FeatureFlag(
      'user-flag-1',
      'user-flag',
      0,
      1,
      true,
      FeatureFlagType.USER,
      'flag-789',
      new Date('2023-01-01'),
      new Date('2023-01-01'),
    );

    const mockUpdateResult = { affected: 1 };
    repository.findByName.mockResolvedValue(userFeatureFlag);
    repository.softDelete.mockResolvedValue(mockUpdateResult as any);
    userRepository.deleteByFeatureFlagId.mockResolvedValue({} as any);

    const result = await useCase.execute(deleteFeatureFlagDto);

    expect(result).toEqual(mockUpdateResult);
    expect(repository.findByName).toHaveBeenCalledWith('user-flag');
    expect(repository.softDelete).toHaveBeenCalledWith('flag-789');
    expect(userRepository.deleteByFeatureFlagId).toHaveBeenCalledWith(
      'flag-789',
    );
    expect(companyRepository.deleteByFeatureFlagId).not.toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'flag-789',
      }),
    );
  });
});
