import { Test, TestingModule } from '@nestjs/testing';
import { ImportUsersIdsUseCase } from 'src/modules/ux-research/application/use-cases/import-users-ids.use-case';
import { ImportUXResearchUsersIdsDto } from 'src/modules/ux-research/application/dto/import-users-ids.dto';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UserUXResearch } from 'src/modules/ux-research/domain/entites/UserUXResearch';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { UserUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';

describe('ImportUsersIdsUseCase', () => {
  let importUsersIdsUseCase: ImportUsersIdsUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let userRepository: jest.Mocked<UserUXResearchRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let uxResearchCacheService: jest.Mocked<CacheServiceInterface>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
    };

    const mockUserRepository = {
      findByUserIdAndUXResearchId: jest.fn(),
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

    const mockExistingUserUXResearch = new UserUXResearch(
      'ux-research-1',
      'user-1',
      'existing-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockNewUserUXResearch = new UserUXResearch(
      'ux-research-1',
      'user-2',
      undefined,
    );

    const mockCreatedUsers = [
      mockExistingUserUXResearch,
      mockNewUserUXResearch,
      new UserUXResearch('ux-research-1', 'user-3', undefined),
    ];

    it('should import users IDs successfully', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndUXResearchId
        .mockResolvedValueOnce(mockExistingUserUXResearch)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      userRepository.createMany.mockResolvedValue(mockCreatedUsers);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(mockImportUsersIdsDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(userRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-1', 'ux-research-1');
      expect(userRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-2', 'ux-research-1');
      expect(userRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-3', 'ux-research-1');
      expect(userRepository.createMany).toHaveBeenCalledWith([
        mockNewUserUXResearch,
        new UserUXResearch('ux-research-1', 'user-3', undefined),
      ]);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_users_ids',
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
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 3,
        imported: 2,
        skipped: 1,
      });
    });

    it('should throw error when UX research not found', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(importUsersIdsUseCase.execute(mockImportUsersIdsDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(userRepository.findByUserIdAndUXResearchId).not.toHaveBeenCalled();
      expect(userRepository.createMany).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_users_ids',
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
      userRepository.findByUserIdAndUXResearchId.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(importUsersIdsUseCase.execute(mockImportUsersIdsDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_users_ids',
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

      expect(userRepository.findByUserIdAndUXResearchId).not.toHaveBeenCalled();
      expect(userRepository.createMany).not.toHaveBeenCalled();
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 0,
        imported: 0,
        skipped: 0,
      });
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

      const singleUserUXResearch = new UserUXResearch(
        'ux-research-1',
        'user-single',
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue([singleUserUXResearch]);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(singleUserDto);

      expect(userRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-single', 'ux-research-1');
      expect(userRepository.createMany).toHaveBeenCalledWith([singleUserUXResearch]);
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 1,
        imported: 1,
        skipped: 0,
      });
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

      const specialUsersUXResearch = [
        new UserUXResearch('ux-research-1', 'user-1!@#', undefined),
        new UserUXResearch('ux-research-1', 'user-2$%^', undefined),
        new UserUXResearch('ux-research-1', 'user-3&*()', undefined),
      ];

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue(specialUsersUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(specialCharsDto);

      expect(userRepository.createMany).toHaveBeenCalledWith(specialUsersUXResearch);
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 3,
        imported: 3,
        skipped: 0,
      });
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_users_ids',
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
        new UserUXResearch('', 'user-1', undefined),
        new UserUXResearch('', 'user-2', undefined),
      ];

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearchWithoutId);
      userRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue(usersWithEmptyId);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(mockImportUsersIdsDto);

      expect(userRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-1', '');
      expect(userRepository.findByUserIdAndUXResearchId).toHaveBeenCalledWith('user-2', '');
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 3,
        imported: 3,
        skipped: 0,
      });
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

      const minimalUserUXResearch = new UserUXResearch(
        'ux-research-1',
        'user-minimal',
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      userRepository.findByUserIdAndUXResearchId.mockResolvedValue(null);
      userRepository.createMany.mockResolvedValue([minimalUserUXResearch]);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importUsersIdsUseCase.execute(minimalUserDataDto);

      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 1,
        imported: 1,
        skipped: 0,
      });
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_users_ids',
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
