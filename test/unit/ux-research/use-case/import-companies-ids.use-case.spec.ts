import { Test, TestingModule } from '@nestjs/testing';
import { ImportCompaniesIdsUseCase } from 'src/modules/ux-research/application/use-cases/import-companies-ids.use-case';
import { ImportUXResearchCompaniesIdsDto } from 'src/modules/ux-research/application/dto/import-companies-ids.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import type { CacheServiceInterface } from 'src/modules/common/cache/cache-service.interface';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { CompanyUXResearch } from 'src/modules/ux-research/domain/entites/CompanyUXResearch';

describe('ImportCompaniesIdsUseCase', () => {
  let importCompaniesIdsUseCase: ImportCompaniesIdsUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let companyRepository: jest.Mocked<CompanyUXResearchRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let uxResearchCacheService: jest.Mocked<CacheServiceInterface>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
    };

    const mockCompanyRepository = {
      findByCompanyIdAndUXResearchId: jest.fn(),
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
        ImportCompaniesIdsUseCase,
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: mockUXResearchRepository,
        },
        {
          provide: 'CompanyUXResearchRepositoryInterface',
          useValue: mockCompanyRepository,
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

    importCompaniesIdsUseCase = module.get<ImportCompaniesIdsUseCase>(ImportCompaniesIdsUseCase);
    uxResearchRepository = module.get('UXResearchRepositoryInterface');
    companyRepository = module.get('CompanyUXResearchRepositoryInterface');
    auditLogService = module.get(AuditLogService);
    uxResearchCacheService = module.get('CACHE_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockImportCompaniesIdsDto: ImportUXResearchCompaniesIdsDto = {
      uxResearchName: 'Test UX Research',
      companiesIds: ['company-1', 'company-2', 'company-3'],
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };

    const mockUXResearch: UXResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'company' as any,
      'feature-1',
      new Date('2023-01-01'),
      new Date('2023-01-31'),
      'ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockExistingCompanyUXResearch = new CompanyUXResearch(
      'ux-research-1',
      'company-1',
      'existing-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockNewCompanyUXResearch = new CompanyUXResearch(
      'ux-research-1',
      'company-2',
      undefined,
    );

    const mockCreatedCompanies = [
      mockExistingCompanyUXResearch,
      mockNewCompanyUXResearch,
      new CompanyUXResearch('ux-research-1', 'company-3', undefined),
    ];

    it('should import companies IDs successfully', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      companyRepository.findByCompanyIdAndUXResearchId
        .mockResolvedValueOnce(mockExistingCompanyUXResearch)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      companyRepository.createMany.mockResolvedValue(mockCreatedCompanies);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importCompaniesIdsUseCase.execute(mockImportCompaniesIdsDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(companyRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-1', 'ux-research-1');
      expect(companyRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-2', 'ux-research-1');
      expect(companyRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-3', 'ux-research-1');
      expect(companyRepository.createMany).toHaveBeenCalledWith([
        mockNewCompanyUXResearch,
        new CompanyUXResearch('ux-research-1', 'company-3', undefined),
      ]);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_companies_ids',
        entity: 'UX Research',
        timestamp: expect.any(String),
        data: {
          user: mockImportCompaniesIdsDto.userData,
          uxResearchName: 'Test UX Research',
          companiesIds: ['company-1', 'company-2', 'company-3'],
        },
      });
      expect(uxResearchCacheService.invalidateCacheEntityFlags).toHaveBeenCalledWith(
        '1',
        'Test UX Research',
        ['company-1', 'company-2', 'company-3']
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

      await expect(importCompaniesIdsUseCase.execute(mockImportCompaniesIdsDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(companyRepository.findByCompanyIdAndUXResearchId).not.toHaveBeenCalled();
      expect(companyRepository.createMany).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_companies_ids',
        entity: 'UX Research',
        timestamp: expect.any(String),
        data: {
          user: mockImportCompaniesIdsDto.userData,
          uxResearchName: 'Test UX Research',
          error: 'UX Research not found',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      companyRepository.findByCompanyIdAndUXResearchId.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(importCompaniesIdsUseCase.execute(mockImportCompaniesIdsDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_companies_ids',
        entity: 'UX Research',
        timestamp: expect.any(String),
        data: {
          error: 'Database connection failed',
          user: mockImportCompaniesIdsDto.userData,
          uxResearchName: 'Test UX Research',
        },
      });
    });

    it('should work with empty companies array', async () => {
      const emptyCompaniesDto: ImportUXResearchCompaniesIdsDto = {
        uxResearchName: 'Test UX Research',
        companiesIds: [],
        userData: {
          userId: 'user-2',
          email: 'user2@example.com',
          name: 'Second User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      companyRepository.createMany.mockResolvedValue([]);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importCompaniesIdsUseCase.execute(emptyCompaniesDto);

      expect(companyRepository.findByCompanyIdAndUXResearchId).not.toHaveBeenCalled();
      expect(companyRepository.createMany).not.toHaveBeenCalled();
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 0,
        imported: 0,
        skipped: 0,
      });
    });

    it('should work with single company ID', async () => {
      const singleCompanyDto: ImportUXResearchCompaniesIdsDto = {
        uxResearchName: 'Test UX Research',
        companiesIds: ['company-single'],
        userData: {
          userId: 'user-3',
          email: 'user3@example.com',
          name: 'Third User',
        },
      };

      const singleCompanyUXResearch = new CompanyUXResearch(
        'ux-research-1',
        'company-single',
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      companyRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      companyRepository.createMany.mockResolvedValue([singleCompanyUXResearch]);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importCompaniesIdsUseCase.execute(singleCompanyDto);

      expect(companyRepository.findByCompanyIdAndUXResearchId).toHaveBeenCalledWith('company-single', 'ux-research-1');
      expect(companyRepository.createMany).toHaveBeenCalledWith([singleCompanyUXResearch]);
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 1,
        imported: 1,
        skipped: 0,
      });
    });

    it('should work with special characters in company IDs', async () => {
      const specialCharsDto: ImportUXResearchCompaniesIdsDto = {
        uxResearchName: 'Test UX Research',
        companiesIds: ['company-1!@#', 'company-2$%^', 'company-3&*()'],
        userData: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      const specialCompaniesUXResearch = [
        new CompanyUXResearch('ux-research-1', 'company-1!@#', undefined),
        new CompanyUXResearch('ux-research-1', 'company-2$%^', undefined),
        new CompanyUXResearch('ux-research-1', 'company-3&*()', undefined),
      ];

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      companyRepository.findByCompanyIdAndUXResearchId.mockResolvedValue(null);
      companyRepository.createMany.mockResolvedValue(specialCompaniesUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);
      uxResearchCacheService.invalidateCacheEntityFlags.mockResolvedValue(undefined);

      const result = await importCompaniesIdsUseCase.execute(specialCharsDto);

      expect(companyRepository.createMany).toHaveBeenCalledWith(specialCompaniesUXResearch);
      expect(result).toEqual({
        uxResearchName: 'Test UX Research',
        totalReceived: 3,
        imported: 3,
        skipped: 0,
      });
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_companies_ids',
        entity: 'UX Research',
        timestamp: expect.any(String),
        data: {
          uxResearchName: 'Test UX Research',
          companiesIds: ['company-1!@#', 'company-2$%^', 'company-3&*()'],
          user: specialCharsDto.userData,
        },
      });
      expect(uxResearchCacheService.invalidateCacheEntityFlags).toHaveBeenCalledWith(
        '1',
        'Test UX Research',
        ['company-1!@#', 'company-2$%^', 'company-3&*()']
      );
    });

    it('should work with UX research that has no ID', async () => {
      const mockUXResearchWithoutId = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'company' as any,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        '',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const emptyCompaniesDto: ImportUXResearchCompaniesIdsDto = {
        uxResearchName: 'Test UX Research',
        companiesIds: [],
        userData: {
          userId: 'user-2',
          email: 'user2@example.com',
          name: 'Second User',
        },
      };

      await expect(importCompaniesIdsUseCase.execute(emptyCompaniesDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(companyRepository.findByCompanyIdAndUXResearchId).not.toHaveBeenCalled();
      expect(companyRepository.createMany).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'import_companies_ids',
        entity: 'UX Research',
        timestamp: expect.any(String),
        data: {
          user: emptyCompaniesDto.userData,
          uxResearchName: 'Test UX Research',
          error: 'UX Research not found',
        },
      });
    });
  });
});
