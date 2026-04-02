/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { UserFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/user-feature-flag.repository';
import { LogService } from 'src/feature-flag/application/services/log.service';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { ImportUsersIdsUseCase } from 'src/feature-flag/application/use-cases/import-users-ids.use-case';
import { ImportUsersIdsDto } from 'src/feature-flag/application/dto/import-users-ids.dto';

describe('ImportUsersIdsUseCase', () => {
  let useCase: ImportUsersIdsUseCase;
  let featureFlagRepository: jest.Mocked<FeatureFlagRepository>;
  let userFeatureFlagRepository: jest.Mocked<UserFeatureFlagRepository>;
  let logService: jest.Mocked<LogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportUsersIdsUseCase,
        {
          provide: FeatureFlagRepository,
          useValue: {
            findByName: jest.fn(),
          },
        },
        {
          provide: UserFeatureFlagRepository,
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
      ],
    }).compile();

    useCase = module.get<ImportUsersIdsUseCase>(ImportUsersIdsUseCase);
    featureFlagRepository = module.get(FeatureFlagRepository);
    userFeatureFlagRepository = module.get(UserFeatureFlagRepository);
    logService = module.get(LogService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
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
    expect(result).toBeDefined();
  });

  it('should return null if feature flag is not found', async () => {
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

    const result = await useCase.execute(dto);

    expect(result).toBeNull();
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
