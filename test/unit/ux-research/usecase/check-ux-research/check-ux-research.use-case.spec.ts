import { Test, TestingModule } from '@nestjs/testing';
import { CheckUXResearchUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research.use-case';
import { CheckUXResearchValidateDto } from 'src/ux-research/application/dto/check-ux-research-validate.dto';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { FeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/feature-flag.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import { CheckFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { ModuleRef } from '@nestjs/core';
import { UXResearch } from 'src/ux-research/domain/entites/UXResearch';
import { FeatureFlag } from 'src/feature-flag/domain/entities/FeatureFlag';
import { CheckUXResearchCompanyUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-company.use-case';
import { CheckUXResearchUserUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-user.use-case';
import { CheckUXResearchPercentageUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-percentage.use-case';
import { CheckUXResearchUserPercentageUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-user-percentage.use-case';
import { CheckUXResearchCompanyPercentageUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-company-percentage.use-case';

describe('CheckUXResearchUseCase', () => {
  let checkUXResearchUseCase: CheckUXResearchUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let featureFlagRepository: jest.Mocked<FeatureFlagRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let checkFeatureFlagUseCase: jest.Mocked<CheckFeatureFlagUseCase>;
  let moduleRef: jest.Mocked<ModuleRef>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
    };

    const mockFeatureFlagRepository = {
      findByName: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const mockCheckFeatureFlagUseCase = {
      execute: jest.fn(),
    };

    const mockModuleRef = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckUXResearchUseCase,
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: mockUXResearchRepository,
        },
        {
          provide: 'FeatureFlagRepositoryInterface',
          useValue: mockFeatureFlagRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: CheckFeatureFlagUseCase,
          useValue: mockCheckFeatureFlagUseCase,
        },
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
      ],
    }).compile();

    checkUXResearchUseCase = module.get<CheckUXResearchUseCase>(CheckUXResearchUseCase);
    uxResearchRepository = module.get('UXResearchRepositoryInterface');
    featureFlagRepository = module.get('FeatureFlagRepositoryInterface');
    auditLogService = module.get(AuditLogService);
    checkFeatureFlagUseCase = module.get(CheckFeatureFlagUseCase);
    moduleRef = module.get(ModuleRef);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockCheckUXResearchValidateDto: CheckUXResearchValidateDto = {
      name: 'Test UX Research',
      userId: 'user-1',
      companyId: 'company-1',
    };

    const mockUXResearch: UXResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'percentage' as any,
      'feature-1',
      new Date('2023-01-01'),
      new Date('2023-01-31'),
      'ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockFeatureFlag: FeatureFlag = new FeatureFlag(
      'feature-1-v1',
      'feature-1',
      100,
      1,
      true,
      'boolean' as any,
      'feature-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    it('should throw error when neither userId nor companyId is provided', async () => {
      const invalidDto: CheckUXResearchValidateDto = {
        name: 'Test UX Research',
      };

      await expect(checkUXResearchUseCase.execute(invalidDto))
        .rejects.toThrow('User ID or Company ID is required');
    });

    it('should throw error when UX research not found', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto))
        .rejects.toThrow('UX Research Test UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          error: 'UX Research not found',
          check_method: 'database',
        },
      });
    });

    it('should return false when UX research is not active', async () => {
      const inactiveUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        false,
        'percentage' as any,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(inactiveUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(result).toBe(false);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          check_result: false,
          check_method: 'database',
        },
      });
    });

    it('should throw error when UX research is not within research period (before start)', async () => {
      const futureStartDateUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        'feature-1',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(futureStartDateUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto))
        .rejects.toThrow('UX Research Test UX Research is not within the research period');

      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          error: 'UX Research is not within the research period',
          check_method: 'database',
        },
      });
    });

    it('should throw error when UX research is not within research period (after end)', async () => {
      const pastEndDateUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        'feature-1',
        new Date('2020-01-01'),
        new Date('2020-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(pastEndDateUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto))
        .rejects.toThrow('UX Research Test UX Research is not within the research period');
    });

    it('should throw error when feature flag is not found', async () => {
      const uxResearchWithFeatureFlag = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(uxResearchWithFeatureFlag);
      featureFlagRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto))
        .rejects.toThrow('Feature Flag Test UX Research not found');

      expect(featureFlagRepository.findByName).toHaveBeenCalledWith('feature-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          error: 'Feature Flag not found',
          check_method: 'database',
        },
      });
    });

    it('should return feature flag check result when feature flag exists', async () => {
      const uxResearchWithFeatureFlag = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(uxResearchWithFeatureFlag);
      featureFlagRepository.findByName.mockResolvedValue(mockFeatureFlag);
      checkFeatureFlagUseCase.execute.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(result).toBe(true);
      expect(checkFeatureFlagUseCase.execute).toHaveBeenCalledWith({
        name: 'feature-1',
        userId: 'user-1',
        companyId: 'company-1',
      });
    });

    it('should throw error when strategy is not found', async () => {
      const uxResearchWithUnknownType = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'unknown_type' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(uxResearchWithUnknownType);

      await expect(checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto))
        .rejects.toThrow('Strategy for unknown_type not found');
    });

    it('should execute company strategy correctly', async () => {
      const companyUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'company' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockCompanyUseCase = {
        execute: jest.fn().mockResolvedValue(true),
      };

      uxResearchRepository.findByName.mockResolvedValue(companyUXResearch);
      moduleRef.get.mockReturnValue(mockCompanyUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(moduleRef.get).toHaveBeenCalledWith(CheckUXResearchCompanyUseCase, { strict: false });
      expect(mockCompanyUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 100,
        userId: 'user-1',
        companyId: 'company-1',
      });
      expect(result).toBe(true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should execute user strategy correctly', async () => {
      const userUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'user' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockUserUseCase = {
        execute: jest.fn().mockResolvedValue(false),
      };

      uxResearchRepository.findByName.mockResolvedValue(userUXResearch);
      moduleRef.get.mockReturnValue(mockUserUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(moduleRef.get).toHaveBeenCalledWith(CheckUXResearchUserUseCase, { strict: false });
      expect(mockUserUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 100,
        userId: 'user-1',
        companyId: 'company-1',
      });
      expect(result).toBe(false);
    });

    it('should execute percentage strategy correctly', async () => {
      const percentageUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        75,
        1,
        true,
        'percentage' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockPercentageUseCase = {
        execute: jest.fn().mockResolvedValue(true),
      };

      uxResearchRepository.findByName.mockResolvedValue(percentageUXResearch);
      moduleRef.get.mockReturnValue(mockPercentageUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(moduleRef.get).toHaveBeenCalledWith(CheckUXResearchPercentageUseCase, { strict: false });
      expect(mockPercentageUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 75,
        userId: 'user-1',
        companyId: 'company-1',
      });
      expect(result).toBe(true);
    });

    it('should execute user_percentage strategy correctly', async () => {
      const userPercentageUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        50,
        1,
        true,
        'user_percentage' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockUserPercentageUseCase = {
        execute: jest.fn().mockResolvedValue(false),
      };

      uxResearchRepository.findByName.mockResolvedValue(userPercentageUXResearch);
      moduleRef.get.mockReturnValue(mockUserPercentageUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(moduleRef.get).toHaveBeenCalledWith(CheckUXResearchUserPercentageUseCase, { strict: false });
      expect(mockUserPercentageUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 50,
        userId: 'user-1',
        companyId: 'company-1',
      });
      expect(result).toBe(false);
    });

    it('should execute company_percentage strategy correctly', async () => {
      const companyPercentageUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        25,
        1,
        true,
        'company_percentage' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockCompanyPercentageUseCase = {
        execute: jest.fn().mockResolvedValue(true),
      };

      uxResearchRepository.findByName.mockResolvedValue(companyPercentageUXResearch);
      moduleRef.get.mockReturnValue(mockCompanyPercentageUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(moduleRef.get).toHaveBeenCalledWith(CheckUXResearchCompanyPercentageUseCase, { strict: false });
      expect(mockCompanyPercentageUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 25,
        userId: 'user-1',
        companyId: 'company-1',
      });
      expect(result).toBe(true);
    });

    it('should work with only userId provided', async () => {
      const userOnlyDto: CheckUXResearchValidateDto = {
        name: 'Test UX Research',
        userId: 'user-only',
      };

      const validPeriodUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockCompanyUseCase = {
        execute: jest.fn().mockResolvedValue(true),
      };

      uxResearchRepository.findByName.mockResolvedValue(validPeriodUXResearch);
      moduleRef.get.mockReturnValue(mockCompanyUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(userOnlyDto);

      expect(result).toBe(true);
      expect(mockCompanyUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 100,
        userId: 'user-only',
      });
    });

    it('should work with only companyId provided', async () => {
      const companyOnlyDto: CheckUXResearchValidateDto = {
        name: 'Test UX Research',
        companyId: 'company-only',
      };

      const validPeriodUXResearch = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockCompanyUseCase = {
        execute: jest.fn().mockResolvedValue(true),
      };

      uxResearchRepository.findByName.mockResolvedValue(validPeriodUXResearch);
      moduleRef.get.mockReturnValue(mockCompanyUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(companyOnlyDto);

      expect(result).toBe(true);
      expect(mockCompanyUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 100,
        companyId: 'company-only',
      });
    });

    it('should work with UX research that has no dates', async () => {
      const uxResearchWithoutDates = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        undefined,
        undefined,
        undefined,
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockPercentageUseCase = {
        execute: jest.fn().mockResolvedValue(true),
      };

      uxResearchRepository.findByName.mockResolvedValue(uxResearchWithoutDates);
      moduleRef.get.mockReturnValue(mockPercentageUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(result).toBe(true);
    });

    it('should work with UX research that has no ID', async () => {
      const uxResearchWithoutId = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        undefined,
        new Date('2023-01-01'),
        new Date('2030-01-31'),
        '',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const mockPercentageUseCase = {
        execute: jest.fn().mockResolvedValue(true),
      };

      uxResearchRepository.findByName.mockResolvedValue(uxResearchWithoutId);
      moduleRef.get.mockReturnValue(mockPercentageUseCase);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUseCase.execute(mockCheckUXResearchValidateDto);

      expect(result).toBe(true);
      expect(mockPercentageUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        version: 1,
        percentage: 100,
        uxResearchId: '',
        userId: 'user-1',
        companyId: 'company-1',
      });
    });
  });
});
