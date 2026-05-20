import { Test, TestingModule } from '@nestjs/testing';
import { CreateUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/create-ux-research.use-case';
import { CreateUXResearchDto } from 'src/modules/ux-research/application/dto/create-ux-research.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { DeleteUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/delete-ux-research.use-case';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('CreateUXResearchUseCase', () => {
  let createUXResearchUseCase: CreateUXResearchUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let deleteUXResearchUseCase: jest.Mocked<DeleteUXResearchUseCase>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
      createUXResearch: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const mockDeleteUXResearchUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUXResearchUseCase,
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: mockUXResearchRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: DeleteUXResearchUseCase,
          useValue: mockDeleteUXResearchUseCase,
        },
      ],
    }).compile();

    createUXResearchUseCase = module.get<CreateUXResearchUseCase>(CreateUXResearchUseCase);
    uxResearchRepository = module.get('UXResearchRepositoryInterface');
    auditLogService = module.get(AuditLogService);
    deleteUXResearchUseCase = module.get(DeleteUXResearchUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockCreateUXResearchDto: CreateUXResearchDto = {
      name: 'Test UX Research',
      percentage: 50,
      type: UXResearchType.PERCENTAGE,
      featureFlagName: 'feature-1',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-31'),
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };

    const mockCreatedUXResearch: UXResearch = new UXResearch(
      'Test UX Research-1',
      'Test UX Research',
      50,
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

    it('should create new UX research successfully', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      uxResearchRepository.createUXResearch.mockResolvedValue(mockCreatedUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchUseCase.execute(mockCreateUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', true);
      expect(uxResearchRepository.createUXResearch).toHaveBeenCalledWith(
        expect.any(UXResearch)
      );
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research',
        entity: 'UXResearch',
        entityId: 'ux-research-1',
        timestamp: expect.any(String),
        data: expect.objectContaining({
          user: mockCreateUXResearchDto.userData,
          name: 'Test UX Research',
          percentage: 50,
          version: 1,
          active: true,
          type: UXResearchType.PERCENTAGE,
          featureFlagName: 'feature-1',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31'),
        }),
      });
      expect(result).toEqual(mockCreatedUXResearch);
    });

    it('should create new version when UX research already exists', async () => {
      const existingUXResearch = new UXResearch(
        'Test UX Research-1',
        'Test UX Research',
        50,
        1,
        true,
        UXResearchType.PERCENTAGE,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-existing',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const newVersionUXResearch = new UXResearch(
        'Test UX Research-2',
        'Test UX Research',
        50,
        2,
        true,
        UXResearchType.PERCENTAGE,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-new',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(existingUXResearch);
      deleteUXResearchUseCase.execute.mockResolvedValue({ deleted: true } as any);
      uxResearchRepository.createUXResearch.mockResolvedValue(newVersionUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchUseCase.execute(mockCreateUXResearchDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', true);
      expect(deleteUXResearchUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        userData: mockCreateUXResearchDto.userData,
      });
      expect(uxResearchRepository.createUXResearch).toHaveBeenCalledWith(
        expect.any(UXResearch)
      );
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research',
        entity: 'UXResearch',
        entityId: 'ux-research-new',
        timestamp: expect.any(String),
        data: {
          user: mockCreateUXResearchDto.userData,
          name: 'Test UX Research',
          percentage: 50,
          version: 2,
          active: true,
          type: UXResearchType.PERCENTAGE,
        },
      });
      expect(result).toEqual(newVersionUXResearch);
    });

    it('should create a new version when only a soft-deleted UX research exists', async () => {
      const softDeletedUXResearch = new UXResearch(
        'Test UX Research-6',
        'Test UX Research',
        50,
        6,
        true,
        UXResearchType.PERCENTAGE,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-deleted',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        new Date('2023-06-01T00:00:00Z'),
      );

      const newVersionUXResearch = new UXResearch(
        'Test UX Research-7',
        'Test UX Research',
        50,
        7,
        true,
        UXResearchType.PERCENTAGE,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-new',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(softDeletedUXResearch);
      uxResearchRepository.createUXResearch.mockResolvedValue(newVersionUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchUseCase.execute(mockCreateUXResearchDto);

      expect(deleteUXResearchUseCase.execute).not.toHaveBeenCalled();
      expect(uxResearchRepository.createUXResearch).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test UX Research',
          nameVersion: 'Test UX Research-7',
          version: 7,
        }),
      );
      expect(result).toEqual(newVersionUXResearch);
    });

    it('should throw error when percentage is required but not provided', async () => {
      const invalidDto: CreateUXResearchDto = {
        name: 'Test UX Research',
        type: UXResearchType.PERCENTAGE,
        percentage: null,
        userData: {
          userId: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchUseCase.execute(invalidDto))
        .rejects.toThrow('Percentage value is not allowed for this ux research type');

      expect(uxResearchRepository.findByName).not.toHaveBeenCalled();
      expect(uxResearchRepository.createUXResearch).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          user: invalidDto.userData,
          error: 'Percentage value is not allowed for this ux research type',
        },
      });
    });

    it('should throw error when delete old UX research fails', async () => {
      const existingUXResearch = new UXResearch(
        'Test UX Research-1',
        'Test UX Research',
        50,
        1,
        true,
        UXResearchType.PERCENTAGE,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-existing',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(existingUXResearch);
      deleteUXResearchUseCase.execute.mockResolvedValue({ deleted: false } as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchUseCase.execute(mockCreateUXResearchDto))
        .rejects.toThrow('Failed to delete old UX Research');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', true);
      expect(deleteUXResearchUseCase.execute).toHaveBeenCalledWith({
        name: 'Test UX Research',
        userData: mockCreateUXResearchDto.userData,
      });
      expect(uxResearchRepository.createUXResearch).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchRepository.findByName.mockResolvedValue(null);
      uxResearchRepository.createUXResearch.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchUseCase.execute(mockCreateUXResearchDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', true);
      expect(uxResearchRepository.createUXResearch).toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research',
        entity: 'UXResearch',
        timestamp: expect.any(String),
        data: {
          user: mockCreateUXResearchDto.userData,
          error: 'Database connection failed',
        },
      });
    });

    it('should work with non-percentage type without percentage', async () => {
      const companyDto: CreateUXResearchDto = {
        name: 'Company UX Research',
        type: UXResearchType.COMPANY,
        userData: {
          userId: 'user-2',
          email: 'company@example.com',
          name: 'Company User',
        },
      };

      const companyUXResearch = new UXResearch(
        'Company UX Research-1',
        'Company UX Research',
        0,
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

      uxResearchRepository.findByName.mockResolvedValue(null);
      uxResearchRepository.createUXResearch.mockResolvedValue(companyUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchUseCase.execute(companyDto);

      expect(result).toEqual(companyUXResearch);
      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Company UX Research', true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research',
        entity: 'UXResearch',
        entityId: 'ux-research-company',
        timestamp: expect.any(String),
        data: {
          user: companyDto.userData,
          name: 'Company UX Research',
          percentage: undefined,
          version: 1,
          active: true,
          type: UXResearchType.COMPANY,
          featureFlagName: undefined,
          startDate: undefined,
          endDate: undefined,
        },
      });
    });

    it('should work with empty string name', async () => {
      const emptyNameDto: CreateUXResearchDto = {
        name: '',
        type: UXResearchType.USER,
        userData: {
          userId: 'user-3',
          email: 'empty@example.com',
          name: 'Empty Name User',
        },
      };

      const emptyNameUXResearch = new UXResearch(
        '-1',
        '',
        0,
        1,
        true,
        UXResearchType.USER,
        undefined,
        undefined,
        undefined,
        'ux-research-empty',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(null);
      uxResearchRepository.createUXResearch.mockResolvedValue(emptyNameUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchUseCase.execute(emptyNameDto);

      expect(result).toEqual(emptyNameUXResearch);
      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('', true);
    });

    it('should work with special characters in name', async () => {
      const specialCharsDto: CreateUXResearchDto = {
        name: 'Test UX Research & Special Characters! @#$%',
        type: UXResearchType.USER_PERCENTAGE,
        percentage: 25.5,
        userData: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      const specialCharsUXResearch = new UXResearch(
        'Test UX Research & Special Characters! @#$%-1',
        'Test UX Research & Special Characters! @#$%',
        25.5,
        1,
        true,
        UXResearchType.USER_PERCENTAGE,
        undefined,
        undefined,
        undefined,
        'ux-research-special',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(null);
      uxResearchRepository.createUXResearch.mockResolvedValue(specialCharsUXResearch);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchUseCase.execute(specialCharsDto);

      expect(result).toEqual(specialCharsUXResearch);
      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research & Special Characters! @#$%', true);
    });
  });
});