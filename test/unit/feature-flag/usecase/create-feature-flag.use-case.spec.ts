/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeatureFlagDto } from 'src/feature-flag/application/dto/create-feature-flag.dto';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { CreateFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/create-feature-flag.use-case';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';

describe('CreateFeatureFlagUseCase', () => {
  let useCase: CreateFeatureFlagUseCase;
  let repository: jest.Mocked<FeatureFlagRepository>;
  let logService: jest.Mocked<LogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateFeatureFlagUseCase,
        {
          provide: FeatureFlagRepository,
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
      ],
    }).compile();

    useCase = module.get<CreateFeatureFlagUseCase>(CreateFeatureFlagUseCase);
    repository = module.get(FeatureFlagRepository);
    logService = module.get(LogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(repository).toBeDefined();
    expect(logService).toBeDefined();
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
});
