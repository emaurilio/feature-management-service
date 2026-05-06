import { Test, TestingModule } from '@nestjs/testing';
import { CheckUXResearchUserUseCase } from 'src/ux-research/application/use-cases/check-feature-flag/check-ux-research-user.use-case';
import { CheckUXResearchDto } from 'src/ux-research/application/dto/check-ux-research/check-ux-research.dto';
import type { UserUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { UserUXResearch } from 'src/ux-research/domain/entites/UserUXResearch';

describe('CheckUXResearchUserUseCase', () => {
  let checkUXResearchUserUseCase: CheckUXResearchUserUseCase;
  let userUXResearchRepository: jest.Mocked<UserUXResearchRepositoryInterface>;
  let cacheService: jest.Mocked<CacheServiceInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUserUXResearchRepository = {
      findByUserIdAndUXResearchId: jest.fn(),
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
        CheckUXResearchUserUseCase,
        {
          provide: 'UserUXResearchRepositoryInterface',
          useValue: mockUserUXResearchRepository,
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

    checkUXResearchUserUseCase = module.get<CheckUXResearchUserUseCase>(CheckUXResearchUserUseCase);
    userUXResearchRepository = module.get('UserUXResearchRepositoryInterface');
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

    const mockUserUXResearch: UserUXResearch = new UserUXResearch(
      'ux-research-1',
      'user-1',
      'user-ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    it('should return true from cache when cache hit', async () => {
      const cacheKey = `user-1-
      Test UX Research-
      1`;
      cacheService.get.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user',
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
      const cacheKey = `user-1-
      Test UX Research-
      1`;
      cacheService.get.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user',
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
      const cacheKey = `user-1-
      Test UX Research-
      1`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-1', 'ux-research-1');
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user',
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

    it('should return true and cache result when user UX research found in database', async () => {
      const cacheKey = `user-1-
      Test UX Research-
      1`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserUseCase.execute(mockCheckUXResearchDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-1', 'ux-research-1');
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        entityId: 'user-1',
        data: {
          ux_research_name: 'Test UX Research',
          version: 1,
          check_result: true,
          check_method: 'database',
        },
      });
    });

    it('should work with empty userId', async () => {
      const emptyUserDto: CheckUXResearchDto = {
        userId: '',
        companyId: 'company-1',
        name: 'Test UX Research',
        version: 1,
        uxResearchId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = `-
      Test UX Research-
      1`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(checkUXResearchUserUseCase.execute(emptyUserDto))
        .rejects.toThrow('User ID is required');

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('', 'ux-research-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user',
        entity: 'UXResearch',
        entityId: '',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          ux_research_name: 'Test UX Research',
          version: 1,
          user_id: '',
          check_result: false,
          check_method: 'database',
        }),
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

      const cacheKey = `user-1-
      Test UX Research-
      1`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserUseCase.execute(emptyFeatureIdDto);

      expect(result).toBe(false);
      expect(userUXResearchRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-1', '');
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

      const cacheKey = `user-1-
      Test UX Research & Special Characters! @#$%-
      1`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserUseCase.execute(specialCharsDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user',
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
        version: 5,
        uxResearchId: 'ux-research-1',
        percentage: 100,
      };

      const cacheKey = `user-1-
      Test UX Research-
      5`;
      cacheService.get.mockResolvedValue(null);
      userUXResearchRepository.findByUserIdAndUXResearchId.mockResolvedValue(mockUserUXResearch);
      cacheService.set.mockResolvedValue(undefined);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await checkUXResearchUserUseCase.execute(differentVersionDto);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(cacheService.set).toHaveBeenCalledWith(cacheKey, true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'check_ux_research_user',
        entity: 'UXResearch',
        entityId: 'user-1',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          ux_research_name: 'Test UX Research',
          version: 5,
          check_result: true,
          check_method: 'database',
        }),
      });
    });
  });
});
