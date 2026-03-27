/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { AuditService } from 'src/feature-flag/application/services/audit.service';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { CompanyFeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/company-feature-flag.repository';
import { ImportCompaniesIdsUseCase } from 'src/feature-flag/application/use-cases/import-companies-ids.use-case';
import { ImportCompaniesIdsDto } from 'src/feature-flag/application/dto/import-companies-ids.dto';

describe('ImportCompaniesIdsUseCase', () => {
  let useCase: ImportCompaniesIdsUseCase;
  let featureFlagRepository: jest.Mocked<FeatureFlagRepository>;
  let companyFeatureFlagRepository: jest.Mocked<CompanyFeatureFlagRepository>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportCompaniesIdsUseCase,
        {
          provide: FeatureFlagRepository,
          useValue: {
            findByName: jest.fn(),
          },
        },
        {
          provide: CompanyFeatureFlagRepository,
          useValue: {
            findByCompanyIdAndFeatureFlagId: jest.fn(),
            createMany: jest.fn(),
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

    useCase = module.get<ImportCompaniesIdsUseCase>(ImportCompaniesIdsUseCase);
    featureFlagRepository = module.get(FeatureFlagRepository);
    companyFeatureFlagRepository = module.get(CompanyFeatureFlagRepository);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
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
    expect(auditService.dispatchLog).toHaveBeenCalledWith({
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
    expect(result).toBeDefined();
  });

  it('should return null if feature flag is not found', async () => {
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

    const result = await useCase.execute(dto);

    expect(result).toBeNull();
    expect(auditService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'import',
        data: expect.objectContaining({
          error: 'FeatureFlag not found',
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
    expect(auditService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'import',
        entity: 'FeatureFlag',
      }),
    );
  });
});
