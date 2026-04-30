import { Test, TestingModule } from '@nestjs/testing';
import { ImportUsersIdsUseCase } from 'src/ux-research/application/use-cases/import-users-ids.use-case';
import { ImportUXResearchUsersIdsDto } from 'src/ux-research/application/dto/import-users-ids.dto';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { UserFeatureFlagRepositoryInterface } from 'src/feature-flag/domain/repositories/user-feature-flag.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import type { CacheServiceInterface } from 'src/common/cache/cache-service.interface';
import { UXResearch } from 'src/ux-research/domain/entites/UXResearch';
import { UserFeatureFlag } from 'src/feature-flag/domain/entities/UserFeatureFlag';

describe('ImportUsersIdsUseCase', () => {
  let importUsersIdsUseCase: ImportUsersIdsUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let userRepository: jest.Mocked<UserFeatureFlagRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let uxResearchCacheService: jest.Mocked<CacheServiceInterface>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
    };

    const mockUserRepository = {
      findByUserIdAndFeatureFlagId: jest.fn(),
      createMany: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const mockUXResearchCacheService = {
      invalidateCacheEntityFlags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportUsersIdsUseCase,
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: mockUXResearchRepository,
        },
        {
          provide: 'UserUXResearchRepositoryInterface',
          useValue: mockUserRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: 'CACHE_SERVICE',
          useValue: mockUXResearchCacheService,
        },
      ],
    }).compile();

    importUsersIdsUseCase = module.get<ImportUsersIdsUseCase>(ImportUsersIdsUseCase);
    uxResearchRepository = module.get('UXResearchRepositoryInterface');
    userRepository = module.get('UserUXResearchRepositoryInterface');
    auditLogService = module.get(AuditLogService);
    uxResearchCacheService = module.get('CACHE_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockImportUsersIdsDto: ImportUXResearchUsersIdsDto = {
      uxResearchName: 'Test UX Research',
      usersIds: ['user-1', 'user-2', 'user-3'],
      userData: {
        userId: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
      },
    };

    const mockUXResearch: UXResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'user' as any,
      'feature-1',
      new Date('2023-01-01'),
      new Date('2023-01-31'),
      'ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockExistingUserFeatureFlag = new UserFeatureFlag(
      'ux-research-1',
      'user-1',
      'existing-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockNewUserFeatureFlag = new UserFeatureFlag(
      'ux-research-1',
      'user-2',
      undefined,
    );

    const mockCreatedUsers = [
      mockExistingUserFeatureFlag,
      mockNewUserFeatureFlag,
      new UserFeatureFlag('ux-research-1', 'user-3', undefined),
    ];

    it('should import users IDs successfully', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndFeatureFlagId
        .mockResolvedValueOnce(mockExistingUserFeatureFlag)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      userRepository.createMany.mockResolvedValue(mockCreatedUsers);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(mockImportUsersIdsDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(userRepository.findByUserIdAndFeatureFlagId).toHaveBeenCalledWith('user-1', 'ux-research-1');
      expect(userRepository.findByUserIdAndFeatureFlagId).toHaveBeenCalledWith('user-2', 'ux-research-1');
      expect(userRepository.findByUserIdAndFeatureFlagId).toHaveBeenCalledWith('user-3', 'ux-research-1');
      expect(userRepository.createMany).toHaveBeenCalledWith(mockCreatedUsers);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import',
        entity: 'UX-Research',
        timestamp: expect.any(String),
        data: {
          uxResearchName: 'Test UX Research',
          usersIds: ['user-1', 'user-2', 'user-3'],
          user: mockImportUsersIdsDto.userData,
        },
      });
      expect(uxResearchCacheService.invalidateCacheEntityFlags).toHaveBeenCalledWith(
        '1',
        'Test UX Research',
        ['user-1', 'user-2', 'user-3']
      );
      expect(result).toEqual(mockCreatedUsers);
    });

    it('should throw error when UX research not found', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(importUsersIdsUseCase.execute(mockImportUsersIdsDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(userRepository.findByUserIdAndFeatureFlagId).not.toHaveBeenCalled();
      expect(userRepository.createMany).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import',
        entity: 'UX-Research',
        timestamp: expect.any(String),
        data: {
          user: mockImportUsersIdsDto.userData,
          uxResearchName: 'Test UX Research',
          error: 'UX Research not found',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndFeatureFlagId.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(importUsersIdsUseCase.execute(mockImportUsersIdsDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import',
        entity: 'UX-Research',
        timestamp: expect.any(String),
        data: {
          uxResearchName: 'Test UX Research',
          error: 'Database connection failed',
          user: mockImportUsersIdsDto.userData,
        },
      });
    });

    it('should work with empty users array', async () => {
      const emptyUsersDto: ImportUXResearchUsersIdsDto = {
        uxResearchName: 'Test UX Research',
        usersIds: [],
        userData: {
          userId: 'admin-2',
          email: 'admin2@example.com',
          name: 'Second Admin',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.createMany.mockResolvedValue([]);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(emptyUsersDto);

      expect(userRepository.findByUserIdAndFeatureFlagId).not.toHaveBeenCalled();
      expect(userRepository.createMany).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should work with single user ID', async () => {
      const singleUserDto: ImportUXResearchUsersIdsDto = {
        uxResearchName: 'Test UX Research',
        usersIds: ['user-single'],
        userData: {
          userId: 'admin-3',
          email: 'admin3@example.com',
          name: 'Third Admin',
        },
      };

      const singleUserFeatureFlag = new UserFeatureFlag(
        'ux-research-1',
        'user-single',
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue([singleUserFeatureFlag]);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(singleUserDto);

      expect(userRepository.findByUserIdAndFeatureFlagId).toHaveBeenCalledWith('user-single', 'ux-research-1');
      expect(userRepository.createMany).toHaveBeenCalledWith([singleUserFeatureFlag]);
      expect(result).toEqual([singleUserFeatureFlag]);
    });

    it('should work with special characters in user IDs', async () => {
      const specialCharsDto: ImportUXResearchUsersIdsDto = {
        uxResearchName: 'Test UX Research',
        usersIds: ['user-1!@#', 'user-2$%^', 'user-3&*()'],
        userData: {
          userId: 'admin-special',
          email: 'special@example.com',
          name: 'Special Admin',
        },
      };

      const specialUsersFeatureFlag = [
        new UserFeatureFlag('ux-research-1', 'user-1!@#', undefined),
        new UserFeatureFlag('ux-research-1', 'user-2$%^', undefined),
        new UserFeatureFlag('ux-research-1', 'user-3&*()', undefined),
      ];

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue(specialUsersFeatureFlag);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(specialCharsDto);

      expect(userRepository.createMany).toHaveBeenCalledWith(specialUsersFeatureFlag);
      expect(result).toEqual(specialUsersFeatureFlag);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import',
        entity: 'UX-Research',
        timestamp: expect.any(String),
        data: {
          uxResearchName: 'Test UX Research',
          usersIds: ['user-1!@#', 'user-2$%^', 'user-3&*()'],
          user: specialCharsDto.userData,
        },
      });
    });

    it('should work with UX research that has no ID', async () => {
      const mockUXResearchWithoutId = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'user' as any,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        '',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const usersWithEmptyId = [
        new UserFeatureFlag('', 'user-1', undefined),
        new UserFeatureFlag('', 'user-2', undefined),
      ];

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearchWithoutId);
      userRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue(usersWithEmptyId);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(mockImportUsersIdsDto);

      expect(userRepository.findByUserIdAndFeatureFlagId).toHaveBeenCalledWith('user-1', '');
      expect(userRepository.findByUserIdAndFeatureFlagId).toHaveBeenCalledWith('user-2', '');
      expect(result).toEqual(usersWithEmptyId);
    });

    
    it('should work with different user data formats', async () => {
      const minimalUserDataDto: ImportUXResearchUsersIdsDto = {
        uxResearchName: 'Test UX Research',
        usersIds: ['user-minimal'],
        userData: {
          userId: '',
          email: '',
          name: '',
        },
      };

      const minimalUserFeatureFlag = new UserFeatureFlag(
        'ux-research-1',
        'user-minimal',
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndFeatureFlagId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue([minimalUserFeatureFlag]);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(minimalUserDataDto);

      expect(result).toEqual([minimalUserFeatureFlag]);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import',
        entity: 'UX-Research',
        timestamp: expect.any(String),
        data: {
          uxResearchName: 'Test UX Research',
          usersIds: ['user-minimal'],
          user: minimalUserDataDto.userData,
        },
      });
    });
  });
});
