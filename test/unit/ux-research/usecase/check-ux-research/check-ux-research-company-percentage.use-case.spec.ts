import { Test, TestingModule } from '@nestjs/testing';
import { CheckUXResearchCompanyPercentageUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-company-percentage.use-case';
import { CheckUXResearchDto } from 'src/ux-research/application/dto/check-ux-research/check-ux-research.dto';
import type { CompanyUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import { HashUXResearchService } from 'src/ux-research/application/services/hash-ux-research.service';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { CompanyUXResearch } from 'src/ux-research/domain/entites/CompanyUXResearch';

describe('CheckUXResearchCompanyPercentageUseCase', () => {
  let checkUXResearchCompanyPercentageUseCase: CheckUXResearchCompanyPercentageUseCase;
  let companyUXResearchRepository: jest.Mocked<CompanyUXResearchRepositoryInterface>;
  let hashUXResearchService: jest.Mocked<HashUXResearchService>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockCompanyUXResearchRepository = {
      findByCompanyIdAndUXResearchId: jest.fn(),
    };

    const mockHashUXResearchService = {
      calculateHash: jest.fn(),
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
        CheckUXResearchCompanyPercentageUseCase,
        {
          provide: 'CompanyUXResearchRepositoryInterface',
          useValue: mockCompanyUXResearchRepository,
        },
        {
          provide: HashUXResearchService,
          useValue: mockHashUXResearchService,
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

    checkUXResearchCompanyPercentageUseCase = module.get<CheckUXResearchCompanyPercentageUseCase>(CheckUXResearchCompanyPercentageUseCase);
    companyUXResearchRepository = module.get('CompanyUXResearchRepositoryInterface');
    hashUXResearchService = module.get(HashUXResearchService);
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
      featureId: 'ux-research-1',
      percentage: 50,
    };

    const mockCompanyUXResearch: CompanyUXResearch = new CompanyUXResearch(
      'ux-research-1',
      'company-1',
      'company-ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    it('should return true from cache when cache hit', async () => {
      const hashName = `${mockCheckUXResearchDto.companyId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).not.toHaveBeenCalled();
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: true,
          check_method: 'cache',
        },
      });
    });

    it('should return false from cache when cache hit with false', async () => {
      const hashName = `${mockCheckUXResearchDto.companyId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).not.toHaveBeenCalled();
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: false,
          check_method: 'cache',
        },
      });
    });

    it('should return false when company UX research not found in database', async () => {
      const hashName = `${mockCheckUXResearchDto.companyId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-1', 'ux-research-1');
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
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

    it('should return true when hash is less than percentage', async () => {
      const hashName = `${mockCheckUXResearchDto.companyId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25); // Less than 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-1', 'ux-research-1');
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should return false when hash is greater than percentage', async () => {
      const hashName = `${mockCheckUXResearchDto.companyId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(75); // Greater than 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, false);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
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

    it('should return false when hash equals percentage', async () => {
      const hashName = `${mockCheckUXResearchDto.companyId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(50); // Equal to 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false); // 50 < 50 is false
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, false);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
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

    it('should work with different percentage values', async () => {
      const highPercentageDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        featureId: 'ux-research-1',
        percentage: 90,
      };

      const hashName = `${highPercentageDto.companyId}-${highPercentageDto.name}-${highPercentageDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(85); // Less than 90%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(highPercentageDto);

      expect(result).toBe(true);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          company_id: 'company-1',
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should work with zero percentage', async () => {
      const zeroPercentageDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        featureId: 'ux-research-1',
        percentage: 0,
      };

      const hashName = `${zeroPercentageDto.companyId}-${zeroPercentageDto.name}-${zeroPercentageDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(zeroPercentageDto);

      expect(result).toBe(false); // 25 < 0 is false
      expect(cacheService.set).toHaveBeenCalledWith(hashName, false);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
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

    it('should work with 100% percentage', async () => {
      const fullPercentageDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        featureId: 'ux-research-1',
        percentage: 100,
      };

      const hashName = `${fullPercentageDto.companyId}-${fullPercentageDto.name}-${fullPercentageDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(99);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(fullPercentageDto);

      expect(result).toBe(true); // 99 < 100 is true
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
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
        percentage: 50,
      };

      const hashName = `${emptyCompanyDto.companyId}-${emptyCompanyDto.name}-${emptyCompanyDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(emptyCompanyDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('', 'ux-research-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          company_id: '',
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
        featureId: '',
        percentage: 50,
      };

      const hashName = `${emptyFeatureIdDto.companyId}-${emptyFeatureIdDto.name}-${emptyFeatureIdDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(emptyFeatureIdDto);

      expect(result).toBe(false);
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-1', '');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
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

    it('should work with special characters in name', async () => {
      const specialCharsDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research & Special Characters! @#$%',
        version: 1,
        featureId: 'ux-research-1',
        percentage: 50,
      };

      const hashName = `${specialCharsDto.companyId}-${specialCharsDto.name}-${specialCharsDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(specialCharsDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research & Special Characters! @#$%',
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
        version: 3,
        featureId: 'ux-research-1',
        percentage: 50,
      };

      const hashName = `${differentVersionDto.companyId}-${differentVersionDto.name}-${differentVersionDto.version}`;
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(mockCompanyUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchCompanyPercentageUseCase.execute(differentVersionDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_company_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 3,
          company_id: 'company-1',
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      cacheService.get.mockResolvedValue(null);
      companyUXResearchRepository.findByCompanyIdAndUXResearchId.mockRejectedValue(repositoryError);

      await expect(checkUXResearchCompanyPercentageUseCase.execute(mockCheckUXResearchDto))
        .rejects.toThrow('Database connection failed');

      expect(cacheService.get).toHaveBeenCalled();
      expect(companyUXResearchRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalled();
    });
  });
});
