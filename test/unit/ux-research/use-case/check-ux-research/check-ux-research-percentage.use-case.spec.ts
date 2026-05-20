import { Test, TestingModule } from '@nestjs/testing';
import { CheckUXResearchPercentageUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research-percentage.use-case';
import { CheckUXResearchDto } from 'src/modules/ux-research/application/dto/check-ux-research.dto';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { HashUXResearchService } from 'src/modules/ux-research/application/services/hash-ux-research.service';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';

describe('CheckUXResearchPercentageUseCase', () => {
  let checkUXResearchPercentageUseCase: CheckUXResearchPercentageUseCase;
  let hashUXResearchService: jest.Mocked<HashUXResearchService>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
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
        CheckUXResearchPercentageUseCase,
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

    checkUXResearchPercentageUseCase = module.get<CheckUXResearchPercentageUseCase>(CheckUXResearchPercentageUseCase);
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
      uxResearchId: 'ux-research-1',
      percentage: 50,
    };

    it('should return true from cache when cache hit', async () => {
      const entityId = 'company-1'; // Uses companyId when available
      const hashName = `${entityId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
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
      const entityId = 'company-1';
      const hashName = `${entityId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
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

    it('should return true when hash is less than percentage', async () => {
      const entityId = 'company-1';
      const hashName = `${entityId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(25); // Less than 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
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

    it('should return false when hash is greater than percentage', async () => {
      const entityId = 'company-1';
      const hashName = `${entityId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(75); // Greater than 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, false);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
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

    it('should return false when hash equals percentage', async () => {
      const entityId = 'company-1';
      const hashName = `${entityId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(50); // Equal to 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false); // 50 < 50 is false
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, false);
    });

    it('should work with different percentage values', async () => {
      const highPercentageDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 90,
      };

      const entityId = 'company-1';
      const hashName = `${entityId}-${highPercentageDto.name}-${highPercentageDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(85); // Less than 90%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(highPercentageDto);

      expect(result).toBe(true);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
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

    it('should work with zero percentage', async () => {
      const zeroPercentageDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 0,
      };

      const entityId = 'company-1';
      const hashName = `${entityId}-${zeroPercentageDto.name}-${zeroPercentageDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(zeroPercentageDto);

      expect(result).toBe(false); // 25 < 0 is false
      expect(cacheService.set).toHaveBeenCalledWith(hashName, false);
    });

    it('should work with 100% percentage', async () => {
      const fullPercentageDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 100,
      };

      const entityId = 'company-1';
      const hashName = `${entityId}-${fullPercentageDto.name}-${fullPercentageDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(99);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(fullPercentageDto);

      expect(result).toBe(true); // 99 < 100 is true
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
    });

    it('should use userId when companyId is empty', async () => {
      const userOnlyDto: CheckUXResearchDto = {
        userId: 'user-only',
        companyId: '',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 50,
      };

      const entityId = 'user-only'; // Uses userId when companyId is empty
      const hashName = `${entityId}-${userOnlyDto.name}-${userOnlyDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(userOnlyDto);

      expect(result).toBe(true);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
        entity: 'UXResearch',
        entityId: 'user-only',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: true,
          check_method: 'cache',
        },
      });
    });

    it('should use companyId when both are provided (companyId priority)', async () => {
      const bothProvidedDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-priority',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 50,
      };

      const entityId = 'company-priority'; // Uses companyId when both are available
      const hashName = `${entityId}-${bothProvidedDto.name}-${bothProvidedDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(bothProvidedDto);

      expect(result).toBe(true);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
        entity: 'UXResearch',
        entityId: 'company-priority',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: true,
          check_method: 'cache',
        },
      });
    });

    it('should work with special characters in name', async () => {
      const specialCharsDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research & Special Characters! @#$%',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 50,
      };

      const entityId = 'company-1';
      const hashName = `${entityId}-${specialCharsDto.name}-${specialCharsDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(specialCharsDto);

      expect(result).toBe(true);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research & Special Characters! @#$%',
          version: 1,
          check_result: true,
          check_method: 'cache',
        },
      });
    });

    it('should work with different version numbers', async () => {
      const differentVersionDto: CheckUXResearchDto = {
        userId: 'user-1',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 3,
        uxResearchId: 'ux-research-1',
        percentage: 50,
      };

      const entityId = 'company-1';
      const hashName = `${entityId}-${differentVersionDto.name}-${differentVersionDto.version}`;
      cacheService.get.mockResolvedValue(null);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchPercentageUseCase.execute(differentVersionDto);

      expect(result).toBe(true);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_percentage',
        entity: 'UXResearch',
        entityId: 'company-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 3,
          check_result: true,
          check_method: 'cache',
        },
      });
    });

      });
});
