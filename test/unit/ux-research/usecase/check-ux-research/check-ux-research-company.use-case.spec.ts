import { Test, TestingModule } from '@nestjs/testing';
import { CheckUXResearchCompanyUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-company.use-case';
import { CheckUXResearchDto } from 'src/ux-research/application/dto/check-ux-research/check-ux-research.dto';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import { CompanyUXResearch } from 'src/ux-research/domain/entites/CompanyUXResearch';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';

describe('CheckUXResearchCompanyUseCase', () => {
  let checkUXResearchCompanyUseCase: CheckUXResearchCompanyUseCase;
  let companyUXResearchRepository: jest.Mocked<CompanyUXResearchRepositoryInterface>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockCompanyUXResearchRepository = {
      findByCompanyIdAndUXResearchId: jest.fn(),
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
          provide: 'CompanyUXResearchRepositoryInterface',
          useValue: mockCompanyUXResearchRepository,
        },
        {
          provide: 'CACHE_SERVICE',
          useValue: mockCacheService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    checkUXResearchCompanyUseCase = module.get<CheckUXResearchCompanyUseCase>(CheckUXResearchCompanyUseCase);
    companyUXResearchRepository = module.get('CompanyUXResearchRepositoryInterface');
    cacheService = module.get('CACHE_SERVICE');
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
      uxResearchId: 'ux-research-1',
      percentage: 100,
    };

    const mockCompanyFeatureFlag: CompanyUXResearch = new CompanyUXResearch(
      'company-ux-research-1',
      'company-1',
      'company-ux-research-1',
    );

    it('should return true from cache when cache hit', async () => {
      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
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
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: false,
          check_method: 'cache',
        },
      });
    });

    it('should return false when company feature flag not found in database', async () => {
      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-1', 'ux-research-1');
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
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
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(new CompanyUXResearch(
        'company-ux-research-1',
        'company-1',
        'ux-research-1',
      ));
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-1', 'ux-research-1');
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
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
        uxResearchId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = '-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(checkUXResearchCompanyUseCase.execute(emptyCompanyDto))
        .rejects.toThrow('Company ID is required');


      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('', 'ux-research-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: false,
          check_method: 'database',
        },
      });
    });

    it('should work with empty featureId', async () => {
      const emptyFeatureIdDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: '',
        percentage: 100,
      };

      const cacheKey = 'company-1-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(emptyFeatureIdDto);

      expect(result).toBe(false);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-1', '');
    });

    it('should work with special characters in name', async () => {
      const specialCharsDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research & Special Characters! @#$%',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = 'company-1-Test UX Research & Special Characters! @#$%-1';
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(new CompanyUXResearch(
        'company-ux-research-1',
        'company-1',
        'ux-research-1',
      ));
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(specialCharsDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research & Special Characters! @#$%',
          version: 1,
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
        uxResearchId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = 'company-1-Test UX Research-5';
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(new CompanyUXResearch(
        'company-ux-research-1',
        'company-1',
        'ux-research-1',
      ));
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyUseCase.execute(differentVersionDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 5,
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockRejectedValue(repositoryError);

      await expect(checkUXResearchCompanyUseCase.execute(mockCheckUXResearchDto))
        .rejects.toThrow('Database connection failed');

      expect(cacheService.get).toHaveBeenCalled();
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalled();
    });

    it('should handle cache service errors gracefully', async () => {
      cacheService.get.mockRejectedValue(new Error('Cache service failed'));
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(new CompanyUXResearch(
        'company-ux-research-1',
        'company-1',
        'ux-research-1',
      ));
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
