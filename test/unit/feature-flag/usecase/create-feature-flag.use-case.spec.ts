/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeatureFlagDto } from 'src/FeatureFlagModule/application/dto/create-feature-flag.dto';
import { AuditService } from 'src/FeatureFlagModule/application/services/audit.service';
import { CreateFeatureFlagUseCase } from 'src/FeatureFlagModule/application/usecase/create-feature-flag.use-case';
import { FeatureFlagType } from 'src/FeatureFlagModule/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/FeatureFlagModule/infraestructure/persistence/repositories/feature-flag.repository';

describe('CreateFeatureFlagUseCase', () => {
  let useCase: CreateFeatureFlagUseCase;
  let repository: jest.Mocked<FeatureFlagRepository>;
  let auditService: jest.Mocked<AuditService>;

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
          provide: AuditService,
          useValue: {
            dispatchLog: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateFeatureFlagUseCase>(CreateFeatureFlagUseCase);
    repository = module.get(FeatureFlagRepository);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
    expect(repository).toBeDefined();
    expect(auditService).toBeDefined();
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
    expect(auditService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entity: 'FeatureFlag',
        entityId: 'flag-123',
      }),
    );
  });
});
