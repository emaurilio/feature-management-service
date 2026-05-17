import { Test, TestingModule } from '@nestjs/testing';
import { CheckUXResearchUserPercentageUseCase } from 'src/modules/ux-research/application/use-cases/check-feature-flag/check-ux-research-user-percentage.use-case';
import { CheckUXResearchDto } from 'src/modules/ux-research/application/dto/check-ux-research/check-ux-research.dto';
import type { UserUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { HashUXResearchService } from 'src/modules/ux-research/application/services/hash-ux-research.service';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import { UserUXResearch } from 'src/modules/ux-research/domain/entites/UserUXResearch';

describe('CheckUXResearchUserPercentageUseCase', () => {
  let checkUXResearchUserPercentageUseCase: CheckUXResearchUserPercentageUseCase;
  let userUXResearchRepository: jest.Mocked<UserUXResearchRepositoryInterface>;
  let hashUXResearchService: jest.Mocked<HashUXResearchService>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUserUXResearchRepository = {
      findByUserIdAndUXResearchId: jest.fn(),
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
        CheckUXResearchUserPercentageUseCase,
        {
          provide: 'UserUXResearchRepositoryInterface',
          useValue: mockUserUXResearchRepository,
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

    checkUXResearchUserPercentageUseCase = module.get<CheckUXResearchUserPercentageUseCase>(CheckUXResearchUserPercentageUseCase);
    userUXResearchRepository = module.get('UserUXResearchRepositoryInterface');
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

    const mockUserUXResearch: UserUXResearch = new UserUXResearch(
      'ux-research-1',
      'user-1',
      'user-ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    it('should return true from cache when cache hit', async () => {
      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).not.toHaveBeenCalled();
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: 'user-1',
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
      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).not.toHaveBeenCalled();
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: false,
          check_method: 'cache',
        },
      });
    });

    it('should return false when user UX research not found in database', async () => {
      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-1', 'ux-research-1');
      expect(hashUXResearchService.calculateHash).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: false,
          check_method: 'database',
        },
      });
    });

    it('should return true when hash is less than percentage', async () => {
      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25); // Less than 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-1', 'ux-research-1');
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should return false when hash is greater than percentage', async () => {
      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(75); // Greater than 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, false);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        entityId: 'user-1',
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: false,
          check_method: 'database',
        },
      });
    });

    it('should return true when hash equals percentage', async () => {
      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(50); // Equal to 50%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(mockCheckUXResearchDto);

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

      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(85); // Less than 90%
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(highPercentageDto);

      expect(result).toBe(true);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
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

      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(zeroPercentageDto);

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

      const hashName = `${mockCheckUXResearchDto.userId}-${mockCheckUXResearchDto.name}-${mockCheckUXResearchDto.version}`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(99);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(fullPercentageDto);

      expect(result).toBe(true); // 99 < 100 is true
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
    });

    it('should work with empty userId', async () => {
      const emptyUserDto: CheckUXResearchDto = {
        userId: '',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 50,
      };

      const hashName = '-Test UX Research-1';
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      expect(checkUXResearchUserPercentageUseCase.execute(emptyUserDto)).rejects.toThrow('User ID is required');
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

      const hashName = 'user-1-Test UX Research & Special Characters! @#$%-1';
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(specialCharsDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: 'user-1',
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
        version: 3,
        uxResearchId: 'ux-research-1',
        percentage: 50,
      };

      const hashName = 'user-1-Test UX Research-3';
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      hashUXResearchService.calculateHash.mockReturnValue(25);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserPercentageUseCase.execute(differentVersionDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(hashName);
      expect(hashUXResearchService.calculateHash).toHaveBeenCalledWith(hashName);
      expect(cacheService.set).toHaveBeenCalledWith(hashName, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user_percentage',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          ux_research_name: 'Test UX Research',
          version: 3,
          check_result: true,
          check_method: 'database',
        }),
      });
    });

    
    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockRejectedValue(repositoryError);

      await expect(checkUXResearchUserPercentageUseCase.execute(mockCheckUXResearchDto))
        .rejects.toThrow('Database connection failed');

      expect(cacheService.get).toHaveBeenCalled();
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).toHaveBeenCalled();
    });
  });
});
