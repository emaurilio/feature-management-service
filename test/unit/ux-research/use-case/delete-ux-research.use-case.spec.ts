import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/delete-ux-research.use-case';
import { DeleteUXResearchDto } from 'src/modules/ux-research/application/dto/delete-ux-research.dto';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';
import type { UserUXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';

describe('DeleteUXResearchUseCase', () => {
  let deleteUXResearchUseCase: DeleteUXResearchUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let companyUXResearchRepository: jest.Mocked<CompanyUXResearchRepositoryInterface>;
  let userUXResearchRepository: jest.Mocked<UserUXResearchRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockCompanyUXResearchRepository = {
      deleteByUXResearchId: jest.fn(),
    };

    const mockUserUXResearchRepository = {
      deleteByUXResearchId: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUXResearchUseCase,
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: mockUXResearchRepository,
        },
        {
          provide: 'CompanyUXResearchRepositoryInterface',
          useValue: mockCompanyUXResearchRepository,
        },
        {
          provide: 'UserUXResearchRepositoryInterface',
          useValue: mockUserUXResearchRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    deleteUXResearchUseCase = module.get<DeleteUXResearchUseCase>(DeleteUXResearchUseCase);
    uxResearchRepository = module.get('UXResearchRepositoryInterface');
    companyUXResearchRepository = module.get('CompanyUXResearchRepositoryInterface');
    userUXResearchRepository = module.get('UserUXResearchRepositoryInterface');
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockDeleteUXResearchDto: DeleteUXResearchDto = {
      name: 'Test UX Research',
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
      UXResearchType.PERCENTAGE,
      'feature-1',
      new Date('2023-01-01'),
      new Date('2023-01-31'),
      'ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    it('should delete UX research successfully', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchRepository.softDelete.mockResolvedValue({ affected: 1 } as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchUseCase.execute(mockDeleteUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.softDelete).toHaveBeenCalledWith('ux-research-1');
      expect(companyUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(userUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research',
        entity: 'UXResearch',
        entityId: 'ux-research-1',
        timestamp: expect.any(String),
        data: {
          user: mockDeleteUXResearchDto.userData,
          name: 'Test UX Research',
          type: UXResearchType.PERCENTAGE,
          message: 'UX Research deleted successfully',
        },
      });
      expect(result.deleted).toBe(true);
      expect(result.name).toBe('Test UX Research');
    });

    it('should delete UX research and company relations for company type', async () => {
      const companyUXResearch = new UXResearch(
        'company-v1',
        'Company UX Research',
        50,
        1,
        true,
        UXResearchType.COMPANY,
        undefined,
        undefined,
        undefined,
        'ux-research-company',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(companyUXResearch);
      uxResearchRepository.softDelete.mockResolvedValue({ affected: 1 } as any);
      companyUXResearchRepository.deleteByUXResearchId.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchUseCase.execute(mockDeleteUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.softDelete).toHaveBeenCalledWith('ux-research-company');
      expect(companyUXResearchRepository.deleteByUXResearchId).toHaveBeenCalledWith('ux-research-company');
      expect(userUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(result.deleted).toBe(true);
      expect(result.name).toBe('Company UX Research');
    });

    it('should delete UX research and user relations for user type', async () => {
      const userUXResearch = new UXResearch(
        'user-v1',
        'User UX Research',
        25,
        1,
        true,
        UXResearchType.USER,
        undefined,
        undefined,
        undefined,
        'ux-research-user',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(userUXResearch);
      uxResearchRepository.softDelete.mockResolvedValue({ affected: 1 } as any);
      userUXResearchRepository.deleteByUXResearchId.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchUseCase.execute(mockDeleteUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.softDelete).toHaveBeenCalledWith('ux-research-user');
      expect(companyUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(userUXResearchRepository.deleteByUXResearchId).toHaveBeenCalledWith('ux-research-user');
      expect(result.deleted).toBe(true);
      expect(result.name).toBe('User UX Research');
    });

    it('should delete UX research and user relations for user_percentage type', async () => {
      const userPercentageUXResearch = new UXResearch(
        'user-percentage-v1',
        'User Percentage UX Research',
        75,
        1,
        true,
        UXResearchType.USER_PERCENTAGE,
        undefined,
        undefined,
        undefined,
        'ux-research-user-percentage',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(userPercentageUXResearch);
      uxResearchRepository.softDelete.mockResolvedValue({ affected: 1 } as any);
      userUXResearchRepository.deleteByUXResearchId.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchUseCase.execute(mockDeleteUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.softDelete).toHaveBeenCalledWith('ux-research-user-percentage');
      expect(companyUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(userUXResearchRepository.deleteByUXResearchId).toHaveBeenCalledWith('ux-research-user-percentage');
      expect(result.deleted).toBe(true);
      expect(result.name).toBe('User Percentage UX Research');
    });

    it('should delete UX research and company relations for company_percentage type', async () => {
      const companyPercentageUXResearch = new UXResearch(
        'company-percentage-v1',
        'Company Percentage UX Research',
        50,
        1,
        true,
        UXResearchType.COMPANY_PERCENTAGE,
        undefined,
        undefined,
        undefined,
        'ux-research-company-percentage',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(companyPercentageUXResearch);
      uxResearchRepository.softDelete.mockResolvedValue({ affected: 1 } as any);
      companyUXResearchRepository.deleteByUXResearchId.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchUseCase.execute(mockDeleteUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.softDelete).toHaveBeenCalledWith('ux-research-company-percentage');
      expect(companyUXResearchRepository.deleteByUXResearchId).toHaveBeenCalledWith('ux-research-company-percentage');
      expect(userUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(result.deleted).toBe(true);
      expect(result.name).toBe('Company Percentage UX Research');
    });

    it('should throw error when UX research not found', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(deleteUXResearchUseCase.execute(mockDeleteUXResearchDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.softDelete).not.toHaveBeenCalled();
      expect(companyUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(userUXResearchRepository.deleteByUXResearchId).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          user: mockDeleteUXResearchDto.userData,
          error: 'UX Research not found',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchRepository.softDelete.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(deleteUXResearchUseCase.execute(mockDeleteUXResearchDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.softDelete).toHaveBeenCalledWith('ux-research-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          user: mockDeleteUXResearchDto.userData,
          error: 'Database connection failed',
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
        UXResearchType.PERCENTAGE,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        '',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearchWithoutId);
      uxResearchRepository.softDelete.mockResolvedValue({ affected: 0 } as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchUseCase.execute(mockDeleteUXResearchDto);

      expect(uxResearchRepository.softDelete).toHaveBeenCalledWith('');
      expect(result.deleted).toBe(false);
    });

    it('should work with special characters in UX research name', async () => {
      const specialCharsDto: DeleteUXResearchDto = {
        name: 'Test UX Research & Special Characters! @#$%',
        userData: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchRepository.softDelete.mockResolvedValue({ affected: 1 } as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchUseCase.execute(specialCharsDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research & Special Characters! @#$%');
      expect(result.deleted).toBe(true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research',
        entity: 'UXResearch',
        entityId: 'ux-research-1',
        timestamp: expect.any(String),
        data: {
          user: specialCharsDto.userData,
          type: UXResearchType.PERCENTAGE,
          name: 'Test UX Research & Special Characters! @#$%',
          message: 'UX Research deleted successfully',
        },
      });
    });
  });
});
