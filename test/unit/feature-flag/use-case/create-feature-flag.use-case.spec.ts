/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeatureFlagDto } from 'src/modules/feature-flag/application/dto/create-feature-flag.dto';
import { AuditLogService } from 'src/modules/feature-flag/application/services/audit-log.service';
import { GetFeatureFlagResponseMapper } from 'src/modules/feature-flag/application/mappers/get-feature-flag-response.mapper';
import { CreateFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/create-feature-flag.use-case';
import { DeleteFeatureFlagUseCase } from 'src/modules/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { FeatureFlag } from 'src/modules/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/modules/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';

describe('CreateFeatureFlagUseCase', () => {
  let useCase: CreateFeatureFlagUseCase;
  let deleteFeatureFlagUseCase: jest.Mocked<DeleteFeatureFlagUseCase>;
  let repository: jest.Mocked<FeatureFlagRepository>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateFeatureFlagUseCase,
        {
          provide: 'FeatureFlagRepositoryInterface',
          useValue: {
            findByName: jest.fn(),
            createFeatureFlag: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            dispatchLog: jest.fn(),
          },
        },
        {
          provide: DeleteFeatureFlagUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateFeatureFlagUseCase>(CreateFeatureFlagUseCase);
    deleteFeatureFlagUseCase = module.get(DeleteFeatureFlagUseCase);
    repository = module.get('FeatureFlagRepositoryInterface');
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(repository).toBeDefined();
    expect(auditLogService).toBeDefined();
    expect(deleteFeatureFlagUseCase).toBeDefined();
  });

  it('should create a feature flag', async () => {
    const createFeatureFlagDto: CreateFeatureFlagDto = {
      name: 'test-flag',
      type: FeatureFlagType.PERCENTAGE,
      percentage: 100,
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const createdFeatureFlag = new FeatureFlag(
      'test-flag-1',
      'test-flag',
      100,
      1,
      true,
      FeatureFlagType.PERCENTAGE,
      'flag-123',
    );
    repository.findByName.mockResolvedValue(null);
    repository.createFeatureFlag.mockResolvedValue(createdFeatureFlag);

    const result = await useCase.execute(createFeatureFlagDto);

    expect(result).toEqual(
      GetFeatureFlagResponseMapper.toResponse(createdFeatureFlag),
    );
    expect(repository.createFeatureFlag).toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'flag-123',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          user: {
            userId: 'user-123',
            email: 'maurilio@teste.com',
            name: 'Maurilio',
          },
          name: 'test-flag',
          type: 'percentage',
          percentage: 100,
          version: 1,
          active: true,
        }),
      }),
    );
  });

  it('should create a feature flag when another exists with same name', async () => {
    const createFeatureFlagDto: CreateFeatureFlagDto = {
      name: 'test-flag',
      type: FeatureFlagType.PERCENTAGE,
      percentage: 100,
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const existingFeatureFlag: FeatureFlag = {
      id: 'existing-flag',
      nameVersion: 'test-flag-1',
      name: 'test-flag',
      version: 1,
      percentage: 50,
      isActive: true,
      type: FeatureFlagType.PERCENTAGE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdFeatureFlag = new FeatureFlag(
      'test-flag-2',
      'test-flag',
      100,
      2,
      true,
      FeatureFlagType.PERCENTAGE,
      'flag-123',
    );
    repository.findByName.mockResolvedValue(existingFeatureFlag);
    repository.createFeatureFlag.mockResolvedValue(createdFeatureFlag);
    deleteFeatureFlagUseCase.execute.mockResolvedValue({ deleted: true } as any);

    const result = await useCase.execute(createFeatureFlagDto);

    expect(result).toEqual(
      GetFeatureFlagResponseMapper.toResponse(createdFeatureFlag),
    );
    expect(deleteFeatureFlagUseCase.execute).toHaveBeenCalled();
    expect(repository.createFeatureFlag).toHaveBeenCalled();
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_feature_flag',
        entity: 'FeatureFlag',
        entityId: 'flag-123',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          user: {
            userId: 'user-123',
            email: 'maurilio@teste.com',
            name: 'Maurilio',
          },
          name: 'test-flag',
          type: 'percentage',
          percentage: 100,
          version: 2,
          active: true,
        }),
      }),
    );
  });

  it('should create a new version when only a soft-deleted feature flag exists', async () => {
    const createFeatureFlagDto: CreateFeatureFlagDto = {
      name: 'test-flag',
      type: FeatureFlagType.PERCENTAGE,
      percentage: 100,
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const softDeletedFeatureFlag = new FeatureFlag(
      'test-flag-6',
      'test-flag',
      50,
      6,
      true,
      FeatureFlagType.PERCENTAGE,
      'existing-flag',
      new Date('2023-01-01'),
      new Date('2023-01-01'),
      new Date('2023-06-01'),
    );

    const createdFeatureFlag = new FeatureFlag(
      'test-flag-7',
      'test-flag',
      100,
      7,
      true,
      FeatureFlagType.PERCENTAGE,
      'flag-new',
    );
    repository.findByName.mockResolvedValue(softDeletedFeatureFlag);
    repository.createFeatureFlag.mockResolvedValue(createdFeatureFlag);

    const result = await useCase.execute(createFeatureFlagDto);

    expect(result).toEqual(
      GetFeatureFlagResponseMapper.toResponse(createdFeatureFlag),
    );
    expect(deleteFeatureFlagUseCase.execute).not.toHaveBeenCalled();
    expect(repository.createFeatureFlag).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-flag',
        nameVersion: 'test-flag-7',
        version: 7,
      }),
    );
  });

  it('should throw when delete feature flag throws an error', async () => {
    const createFeatureFlagDto: CreateFeatureFlagDto = {
      name: 'test-flag',
      type: FeatureFlagType.PERCENTAGE,
      percentage: 100,
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    const existingFeatureFlag: FeatureFlag = {
      id: 'existing-flag',
      nameVersion: 'test-flag-1',
      name: 'test-flag',
      version: 1,
      percentage: 50,
      isActive: true,
      type: FeatureFlagType.PERCENTAGE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResult = { id: 'flag-123', ...createFeatureFlagDto };
    repository.findByName.mockResolvedValue(existingFeatureFlag);
    repository.createFeatureFlag.mockResolvedValue(mockResult as any);
    deleteFeatureFlagUseCase.execute.mockResolvedValue({ deleted: false } as any);

    await expect(useCase.execute(createFeatureFlagDto)).rejects.toThrow(
      'Failed to delete old feature flag',
    );
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_feature_flag',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          user: {
            userId: 'user-123',
            email: 'maurilio@teste.com',
            name: 'Maurilio',
          },
          error: 'Failed to delete old feature flag',
        },
      }),
    );
  });

  it('should throw an error when feature flag with type percentage has 0 percentage', async () => {
    const createFeatureFlagDto: CreateFeatureFlagDto = {
      name: 'test-flag',
      type: FeatureFlagType.PERCENTAGE,
      percentage: null,
      userData: {
        userId: 'user-123',
        email: 'maurilio@teste.com',
        name: 'Maurilio',
      },
    };

    await expect(useCase.execute(createFeatureFlagDto)).rejects.toThrow(
      'Percentage is required for this feature flag type',
    );
    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_feature_flag',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          user: {
            userId: 'user-123',
            email: 'maurilio@teste.com',
            name: 'Maurilio',
          },
          error: 'Percentage is required for this feature flag type',
        },
      }),
    );
  });
});
