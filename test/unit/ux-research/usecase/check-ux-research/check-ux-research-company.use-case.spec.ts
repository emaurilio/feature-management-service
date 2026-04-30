import { Test, TestingModule } from '@nestjs/testing';
import { CheckUXResearchCompanyUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-company.use-case';
import { CheckUXResearchDto } from 'src/ux-research/application/dto/check-ux-research/check-ux-research.dto';
import { CompanyFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/company-feature-flag.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { CompanyFeatureFlag } from 'src/feature-flag/domain/entities/CompanyFeatureFlag';

describe('CheckUXResearchCompanyUseCase', () => {
  let checkUXResearchCompanyUseCase: CheckUXResearchCompanyUseCase;
  let companyFeatureFlagRepository: jest.Mocked<CompanyFeatureFlagRepositoryInterface>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockCompanyFeatureFlagRepository = {
      findByCompanyIdAndFeatureFlagId: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckUXResearchCompanyUseCase,
        {
          provide: 'CompanyFeatureFlagRepositoryInterface',
          useValue: mockCompanyFeatureFlagRepository,
        },
        {
          provide: 'CacheServiceInterface',
          useValue: mockCacheService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    checkUXResearchCompanyUseCase = module.get<CheckUXResearchCompanyUseCase>(CheckUXResearchCompanyUseCase);
    companyFeatureFlagRepository = module.get('CompanyFeatureFlagRepositoryInterface');
    cacheService = module.get('CacheServiceInterface');
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockCheckUXResearchDto: CheckUXResearchDto = {
      userId: 'user-1',
      companyId: 'company-1',
      name: 'Test UX Research',
      version: 1,
      featureId: 'ux-research-1',
      percentage: 100,
    };

    const mockCompanyFeatureFlag: CompanyFeatureFlag = new CompanyFeatureFlag(
      'ux-research-1',
      'company-1',
      'company-feature-flag-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    it('should return true from cache when cache hit', async () => {
      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          featureName: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: true,
          check_method: 'cache',
        },
      });
    });

    it('should return false from cache when cache hit with false', async () => {
      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          featureName: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: false,
          check_method: 'cache',
        },
      });
    });

    it('should return false when company feature flag not found in database', async () => {
      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId).toHaveBeenCalledWith('company-1', 'ux-research-1');
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          featureName: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: false,
          check_method: 'database',
        },
      });
    });

    it('should return true and cache result when company feature flag found in database', async () => {
      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(mockCompanyFeatureFlag);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId).toHaveBeenCalledWith('company-1', 'ux-research-1');
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          featureName: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should work with empty companyId', async () => {
      const emptyCompanyDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: '',
        name: 'Test UX Research',
        version: 1,
        featureId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = '-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(emptyCompanyDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId).toHaveBeenCalledWith('', 'ux-research-1');
    });

    it('should work with empty featureId', async () => {
      const emptyFeatureIdDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        featureId: '',
        percentage: 100,
      };

      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(emptyFeatureIdDto);

      expect(result).toBe(false);
      expect(companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId).toHaveBeenCalledWith('company-1', '');
    });

    it('should work with special characters in name', async () => {
      const specialCharsDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research & Special Characters! @#$%',
        version: 1,
        featureId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = 'company-1-Test UX Research & Special Characters! @#$%-1';
      cacheService.get.mockResolvedValue(null);
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(mockCompanyFeatureFlag);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(specialCharsDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          featureName: 'Test UX Research & Special Characters! @#$%',
          version: 1,
          company_id: 'company-1',
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should work with different version numbers', async () => {
      const differentVersionDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 5,
        featureId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = 'company-1-Test UX Research-5';
      cacheService.get.mockResolvedValue(null);
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(mockCompanyFeatureFlag);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(differentVersionDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_feature_flag_company',
        entity: 'FeatureFlag',
        timestamp: expect.any(String),
        data: {
          featureName: 'Test UX Research',
          version: 5,
          company_id: 'company-1',
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      cacheService.get.mockResolvedValue(null);
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockRejectedValue(repositoryError);

      await expect(checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto))
        .rejects.toThrow('Database connection failed');

      expect(cacheService.get).toHaveBeenCalled();
      expect(companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId).toHaveBeenCalled();
    });

    it('should handle cache service errors gracefully', async () => {
      cacheService.get.mockRejectedValue(new Error('Cache service failed'));
      companyFeatureFlagRepository.findByCompanyIdAndFeatureFlagId.mockResolvedValue(mockCompanyFeatureFlag);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto))
        .rejects.toThrow('Cache service failed');

      expect(cacheService.get).toHaveBeenCalled();
    });

    it('should handle audit log errors gracefully', async () => {
      cacheService.get.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalled();
    });
  });
});
