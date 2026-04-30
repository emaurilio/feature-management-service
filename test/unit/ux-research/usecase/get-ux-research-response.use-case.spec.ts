import { Test, TestingModule } from '@nestjs/testing';
import { GetUXResearchResponseUseCase } from 'src/ux-research/application/use-cases/get-ux-research-response.use-case';
import { GetUXResearchResponseDto } from 'src/ux-research/application/dto/get-ux-research-response.dto';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { UXResearchResponseRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import { UXResearch } from 'src/ux-research/domain/entites/UXResearch';
import { UXResearchResponse } from 'src/ux-research/domain/entites/UXResearchResponse';

describe('SearchUXResearchUseCase', () => {
  let getUXResearchUseCase: GetUXResearchResponseUseCase;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let uxResearchResponseRepository: jest.Mocked<UXResearchResponseRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUXResearchRepository = {
      findByName: jest.fn(),
    };

    const mockUXResearchResponseRepository = {
      getByUXResearchIdPaginated: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUXResearchResponseUseCase,
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: mockUXResearchRepository,
        },
        {
          provide: 'UXResearchResponseRepositoryInterface',
          useValue: mockUXResearchResponseRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    getUXResearchUseCase = module.get<GetUXResearchResponseUseCase>(GetUXResearchResponseUseCase);
    uxResearchRepository = module.get('UXResearchRepositoryInterface');
    uxResearchResponseRepository = module.get('UXResearchResponseRepositoryInterface');
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockGetUXResearchResponseDto: GetUXResearchResponseDto = {
      name: 'Test UX Research',
      page: 1,
      limit: 15,
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
      'percentage' as any,
      'feature-1',
      new Date('2023-01-01'),
      new Date('2023-01-31'),
      'ux-research-1',
      new Date('2023-01-01T10:00:00Z'),
      new Date('2023-01-02T10:00:00Z'),
      undefined,
    );

    const mockUXResearchResponse: UXResearchResponse = new UXResearchResponse(
      '{"rating": 5, "feedback": "Great experience"}',
      new Date('2023-01-15T10:00:00Z'),
      'ux-research-1',
      'user-1',
      undefined,
      'response-1',
      new Date('2023-01-15T10:00:00Z'),
      new Date('2023-01-15T10:00:00Z'),
      undefined,
    );

    const mockPaginatedResponse = {
      items: [mockUXResearchResponse],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 15,
        totalPages: 1,
        currentPage: 1,
      },
    };

    it('should get UX research responses successfully', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.getByUXResearchIdPaginated.mockResolvedValue(mockPaginatedResponse);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await getUXResearchUseCase.execute(mockGetUXResearchResponseDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchResponseRepository.getByUXResearchIdPaginated).toHaveBeenCalledWith(
        'ux-research-1',
        1,
        15
      );
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'get',
        entity: 'UX-Research-Response',
        timestamp: expect.any(String),
        data: {
          user: mockGetUXResearchResponseDto.userData,
          name: 'Test UX Research',
        },
      });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should throw error when UX research not found', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(getUXResearchUseCase.execute(mockGetUXResearchResponseDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchResponseRepository.getByUXResearchIdPaginated).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'get',
        entity: 'UX-Research-Response',
        timestamp: expect.any(String),
        data: {
          user: mockGetUXResearchResponseDto.userData,
          name: 'Test UX Research',
          error: 'UX Research not found',
        },
      });
    });

    it('should throw error when UX research has no ID', async () => {
      const mockUXResearchWithoutId = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as any,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        '',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearchWithoutId);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(getUXResearchUseCase.execute(mockGetUXResearchResponseDto))
        .rejects.toThrow('UX Research ID is undefined');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchResponseRepository.getByUXResearchIdPaginated).not.toHaveBeenCalled();
    });

    it('should throw error when UX research responses not found', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.getByUXResearchIdPaginated.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(getUXResearchUseCase.execute(mockGetUXResearchResponseDto))
        .rejects.toThrow('UX Research Response not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(uxResearchResponseRepository.getByUXResearchIdPaginated).toHaveBeenCalledWith(
        'ux-research-1',
        1,
        15
      );
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'get',
        entity: 'UX-Research-Response',
        timestamp: expect.any(String),
        data: {
          user: mockGetUXResearchResponseDto.userData,
          name: 'Test UX Research',
          error: 'UX Research Response not found',
        },
      });
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchRepository.findByName.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(getUXResearchUseCase.execute(mockGetUXResearchResponseDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'search',
        entity: 'UX-Research',
        timestamp: expect.any(String),
        data: {
          user: mockGetUXResearchResponseDto.userData,
          error: 'Database connection failed',
        },
      });
    });

    it('should work with custom pagination', async () => {
      const customPaginationDto: GetUXResearchResponseDto = {
        name: 'Test UX Research',
        page: 2,
        limit: 25,
        userData: {
          userId: 'user-2',
          email: 'user2@example.com',
          name: 'Second User',
        },
      };

      const customPaginatedResponse = {
        items: [mockUXResearchResponse],
        meta: {
          totalItems: 50,
          itemCount: 1,
          itemsPerPage: 25,
          totalPages: 2,
          currentPage: 2,
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.getByUXResearchIdPaginated.mockResolvedValue(customPaginatedResponse);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await getUXResearchUseCase.execute(customPaginationDto);

      expect(uxResearchResponseRepository.getByUXResearchIdPaginated).toHaveBeenCalledWith(
        'ux-research-1',
        2,
        25
      );
      expect(result).toEqual(customPaginatedResponse);
    });

    it('should work with default pagination values', async () => {
      const dtoWithoutPagination = {
        name: 'Test UX Research',
        userData: {
          userId: 'user-3',
          email: 'user3@example.com',
          name: 'Third User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.getByUXResearchIdPaginated.mockResolvedValue(mockPaginatedResponse);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await getUXResearchUseCase.execute(dtoWithoutPagination);

      expect(uxResearchResponseRepository.getByUXResearchIdPaginated).toHaveBeenCalledWith(
        'ux-research-1',
        undefined,
        undefined
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should work with empty string name', async () => {
      const emptyNameDto: GetUXResearchResponseDto = {
        name: '',
        page: 1,
        limit: 15,
        userData: {
          userId: 'user-4',
          email: 'user4@example.com',
          name: 'Fourth User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(getUXResearchUseCase.execute(emptyNameDto))
        .rejects.toThrow('UX Research not found');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('');
    });

    it('should work with special characters in name', async () => {
      const specialCharsDto: GetUXResearchResponseDto = {
        name: 'Test UX Research & Special Characters! @#$%',
        page: 1,
        limit: 15,
        userData: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.getByUXResearchIdPaginated.mockResolvedValue(mockPaginatedResponse);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await getUXResearchUseCase.execute(specialCharsDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research & Special Characters! @#$%');
      expect(result).toEqual(mockPaginatedResponse);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'get',
        entity: 'UX-Research-Response',
        timestamp: expect.any(String),
        data: {
          user: specialCharsDto.userData,
          name: 'Test UX Research & Special Characters! @#$%',
        },
      });
    });

    it('should work with empty response data', async () => {
      const emptyResponseDto: GetUXResearchResponseDto = {
        name: 'Empty UX Research',
        page: 1,
        limit: 15,
        userData: {
          userId: 'user-5',
          email: 'user5@example.com',
          name: 'Fifth User',
        },
      };

      const emptyPaginatedResponse = {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 15,
          totalPages: 0,
          currentPage: 1,
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.getByUXResearchIdPaginated.mockResolvedValue(emptyPaginatedResponse);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await getUXResearchUseCase.execute(emptyResponseDto);

      expect(result).toEqual(emptyPaginatedResponse);
      expect(result.items).toEqual([]);
    });
  });
});
