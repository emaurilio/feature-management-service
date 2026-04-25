/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeatureFlagDto } from 'src/feature-flag/application/dto/create-feature-flag.dto';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { CreateFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/create-feature-flag.use-case';
import { DeleteFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/delete-feature-flag.use-case';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';

describe('CreateFeatureFlagUseCase', () => {
  let useCase: CreateFeatureFlagUseCase;
  let deleteFeatureFlagUseCase: jest.Mocked<DeleteFeatureFlagUseCase>;
  let repository: jest.Mocked<FeatureFlagRepository>;
  let logService: jest.Mocked<LogService>;

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
          provide: LogService,
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
    logService = module.get(LogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(repository).toBeDefined();
    expect(logService).toBeDefined();
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

    const mockResult = { id: 'flag-123', ...createFeatureFlagDto };
    repository.findByName.mockResolvedValue(null);
    repository.createFeatureFlag.mockResolvedValue(mockResult as any);

    const result = await useCase.execute(createFeatureFlagDto);

    expect(result).toEqual(mockResult);
    expect(repository.createFeatureFlag).toHaveBeenCalled();
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entity: 'FeatureFlag',
        entityId: 'flag-123',
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

    const mockResult = { id: 'flag-123', ...createFeatureFlagDto };
    repository.findByName.mockResolvedValue(existingFeatureFlag);
    repository.createFeatureFlag.mockResolvedValue(mockResult as any);
    deleteFeatureFlagUseCase.execute.mockResolvedValue(true as any);

    const result = await useCase.execute(createFeatureFlagDto);

    expect(result).toEqual(mockResult);
    expect(repository.createFeatureFlag).toHaveBeenCalled();
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entity: 'FeatureFlag',
        entityId: 'flag-123',
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
    deleteFeatureFlagUseCase.execute.mockResolvedValue(false as any);

    await expect(useCase.execute(createFeatureFlagDto)).rejects.toThrow(
      'Failed to delete old feature flag',
    );
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          error: 'Failed to delete old feature flag',
        }),
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
      'Percentage value is not allowed for this feature flag type',
    );
    expect(logService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entity: 'FeatureFlag',
        data: expect.objectContaining({
          error: 'Percentage value is not allowed for this feature flag type',
        }),
      }),
    );
  });
});
