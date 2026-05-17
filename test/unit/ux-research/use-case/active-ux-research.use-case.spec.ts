import { Test, TestingModule } from '@nestjs/testing';
import { ActiveUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/active-ux-research.use-case';
import { ActiveUXResearchDto } from 'src/modules/ux-research/application/dto/active-ux-research.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';

describe('ActiveUXResearchUseCase', () => {
  let activeUXResearchUseCase: ActiveUXResearchUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
      updateUXResearch: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActiveUXResearchUseCase,
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: mockUXResearchRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    activeUXResearchUseCase = module.get<ActiveUXResearchUseCase>(ActiveUXResearchUseCase);
    uxResearchRepository = module.get('UXResearchRepositoryInterface');
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockUXResearch: UXResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      false,
      'percentage' as any,
      'feature-1',
      new Date('2023-01-01'),
      new Date('2023-01-31'),
      'ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockActiveUXResearchDto: ActiveUXResearchDto = {
      uxResearchName: 'Test UX Research',
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };

    it('should activate UX research successfully', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchRepository.updateUXResearch.mockResolvedValue({
        ...mockUXResearch,
        isActive: true,
      });
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await activeUXResearchUseCase.execute(mockActiveUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.updateUXResearch).toHaveBeenCalledWith('ux-research-1', {
        isActive: true,
      });
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'activate_ux_research',
        entity: 'UXResearch',
        entityId: 'ux-research-1',
        timestamp: expect.any(String),
        data: {
          user: mockActiveUXResearchDto.userData,
          name: 'Test UX Research',
        },
      });
      expect(result).toEqual({
        ...mockUXResearch,
        isActive: true,
      });
    });

    it('should throw error when UX research not found', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(activeUXResearchUseCase.execute(mockActiveUXResearchDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.updateUXResearch).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'activate_ux_research',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          user: mockActiveUXResearchDto.userData,
          error: 'UX Research not found',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchRepository.updateUXResearch.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(activeUXResearchUseCase.execute(mockActiveUXResearchDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchRepository.updateUXResearch).toHaveBeenCalledWith('ux-research-1', {
        isActive: true,
      });
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'activate_ux_research',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          user: mockActiveUXResearchDto.userData,
          error: 'Database connection failed',
        },
      });
    });

    it('should work with different UX research types', async () => {
      const mockCompanyUXResearch = new UXResearch(
        'company-v1',
        'Company UX Research',
        50,
        1,
        false,
        'company' as any,
        'feature-2',
        new Date('2023-02-01'),
        new Date('2023-02-28'),
        'ux-research-2',
        new Date('2023-02-01T10:00:00Z'),
        new Date('2023-02-02T10:00:00Z'),
        undefined,
      );

      const companyDto: ActiveUXResearchDto = {
        uxResearchName: 'Company UX Research',
        userData: {
          userId: 'user-2',
          email: 'company@example.com',
          name: 'Company User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockCompanyUXResearch);
      uxResearchRepository.updateUXResearch.mockResolvedValue({
        ...mockCompanyUXResearch,
        isActive: true,
      });
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await activeUXResearchUseCase.execute(companyDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Company UX Research');
      expect(uxResearchRepository.updateUXResearch).toHaveBeenCalledWith('ux-research-2', {
        isActive: true,
      });
      expect(result.isActive).toBe(true);
    });

    it('should work with empty user data fields', async () => {
      const dtoWithEmptyUserData: ActiveUXResearchDto = {
        uxResearchName: 'Test UX Research',
        userData: {
          userId: '',
          email: '',
          name: '',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchRepository.updateUXResearch.mockResolvedValue({
        ...mockUXResearch,
        isActive: true,
      });
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await activeUXResearchUseCase.execute(dtoWithEmptyUserData);

      expect(result.isActive).toBe(true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'activate_ux_research',
        entity: 'UXResearch',
        entityId: 'ux-research-1',
        timestamp: expect.any(String),
        data: {
          user: dtoWithEmptyUserData.userData,
          name: 'Test UX Research',
        },
      });
    });

    it('should handle UX research with empty id', async () => {
      const mockUXResearchWithEmptyId = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        false,
        'percentage' as any,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        '',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearchWithEmptyId);
      uxResearchRepository.updateUXResearch.mockResolvedValue({
        ...mockUXResearchWithEmptyId,
        isActive: true,
      });
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await activeUXResearchUseCase.execute(mockActiveUXResearchDto);

      expect(uxResearchRepository.updateUXResearch).toHaveBeenCalledWith('', {
        isActive: true,
      });
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'activate_ux_research',
        entity: 'UXResearch',
        entityId: '',
        timestamp: expect.any(String),
        data: {
          user: mockActiveUXResearchDto.userData,
          name: 'Test UX Research',
        },
      });
      expect(result.isActive).toBe(true);
    });

    it('should work with special characters in UX research name', async () => {
      const dtoWithSpecialChars: ActiveUXResearchDto = {
        uxResearchName: 'Test UX Research & Special Characters! @#$%',
        userData: {
          userId: 'user-3',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      const mockSpecialUXResearch = new UXResearch(
        'special-v1',
        'Test UX Research & Special Characters! @#$%',
        75,
        1,
        false,
        'user' as any,
        'feature-3',
        new Date('2023-03-01'),
        new Date('2023-03-31'),
        'ux-research-3',
        new Date('2023-03-01T10:00:00Z'),
        new Date('2023-03-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockSpecialUXResearch);
      uxResearchRepository.updateUXResearch.mockResolvedValue({
        ...mockSpecialUXResearch,
        isActive: true,
      });
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await activeUXResearchUseCase.execute(dtoWithSpecialChars);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith(
        'Test UX Research & Special Characters! @#$%',
      );
      expect(result.isActive).toBe(true);
    });
  });
});
