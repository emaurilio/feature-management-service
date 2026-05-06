import { Test, TestingModule } from '@nestjs/testing';
import { CreateUXResearchResponseUseCase } from 'src/ux-research/application/use-cases/create-ux-research-response.use-case';
import { CreateUXResearchResponseDto } from 'src/ux-research/application/dto/create-ux-research-response.dto';
import type { UXResearchResponseRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';
import { UXResearchResponse } from 'src/ux-research/domain/entites/UXResearchResponse';
import { UXResearch } from 'src/ux-research/domain/entites/UXResearch';

describe('CreateUXResearchResponseUseCase', () => {
  let createUXResearchResponseUseCase: CreateUXResearchResponseUseCase;
  let uxResearchResponseRepository: jest.Mocked<UXResearchResponseRepositoryInterface>;
  let uxResearchRepository: jest.Mocked<UXResearchRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUXResearchResponseRepository = {
      createUXResearchResponse: jest.fn(),
    };

    const mockUXResearchRepository = {
      findByName: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUXResearchResponseUseCase,
        {
          provide: 'UXResearchResponseRepositoryInterface',
          useValue: mockUXResearchResponseRepository,
        },
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

    createUXResearchResponseUseCase = module.get<CreateUXResearchResponseUseCase>(CreateUXResearchResponseUseCase);
    uxResearchResponseRepository = module.get('UXResearchResponseRepositoryInterface');
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

    const mockCreateUXResearchResponseDto: CreateUXResearchResponseDto = {
      uxResearchName: 'Test UX Research',
      responseData: '{"rating": 5, "feedback": "Great experience"}',
      responseDate: new Date('2023-01-15T10:00:00Z'),
      userId: 'user-1',
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };

    const mockCreatedUXResearchResponse: UXResearchResponse = new UXResearchResponse(
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

    it('should create UX research response successfully with user ID', async () => {
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.createUXResearchResponse.mockResolvedValue(mockCreatedUXResearchResponse as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchResponseUseCase.execute(mockCreateUXResearchResponseDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', false);
      expect(uxResearchResponseRepository.createUXResearchResponse).toHaveBeenCalledWith(
        expect.any(UXResearchResponse)
      );
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'response-1',
        timestamp: expect.any(String),
        data: {
          responseData: mockCreateUXResearchResponseDto.responseData,
          responseDate: mockCreateUXResearchResponseDto.responseDate,
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
          companyId: undefined,
        },
      });
      expect(result).toEqual(mockCreatedUXResearchResponse);
    });

    it('should create UX research response successfully with company ID', async () => {
      const companyDto: CreateUXResearchResponseDto = {
        uxResearchName: 'Test UX Research',
        responseData: '{"rating": 4, "feedback": "Good experience"}',
        responseDate: new Date('2023-01-16T10:00:00Z'),
        companyId: 'company-1',
        userData: {
          userId: 'user-2',
          email: 'company@example.com',
          name: 'Company User',
        },
      };

      const mockCompanyResponse: UXResearchResponse = new UXResearchResponse(
        '{"rating": 4, "feedback": "Good experience"}',
        new Date('2023-01-16T10:00:00Z'),
        'ux-research-1',
        undefined,
        'company-1',
        'response-2',
        new Date('2023-01-16T10:00:00Z'),
        new Date('2023-01-16T10:00:00Z'),
        undefined,
      );

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.createUXResearchResponse.mockResolvedValue(mockCompanyResponse as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchResponseUseCase.execute(companyDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', false);
      expect(uxResearchResponseRepository.createUXResearchResponse).toHaveBeenCalledWith(
        expect.any(UXResearchResponse)
      );
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'response-2',
        timestamp: expect.any(String),
        data: {
          responseData: companyDto.responseData,
          responseDate: companyDto.responseDate,
          uxResearchId: 'ux-research-1',
          userId: undefined,
          companyId: 'company-1',
        },
      });
      expect(result).toEqual(mockCompanyResponse);
    });

    it('should create UX research response using feature flag name', async () => {
      const featureFlagDto: CreateUXResearchResponseDto = {
        featureFlagName: 'feature-1',
        responseData: '{"rating": 3, "feedback": "Average experience"}',
        responseDate: new Date('2023-01-17T10:00:00Z'),
        userId: 'user-3',
        userData: {
          userId: 'user-3',
          email: 'user3@example.com',
          name: 'Third User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.createUXResearchResponse.mockResolvedValue(mockCreatedUXResearchResponse as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchResponseUseCase.execute(featureFlagDto);

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('feature-1', false);
      expect(result).toEqual(mockCreatedUXResearchResponse);
    });

    it('should throw error when both user ID and company ID are missing', async () => {
      const invalidDto: CreateUXResearchResponseDto = {
        uxResearchName: 'Test UX Research',
        responseData: '{"rating": 5}',
        responseDate: new Date('2023-01-15T10:00:00Z'),
        userData: {
          userId: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchResponseUseCase.execute(invalidDto))
        .rejects.toThrow('Company_id or user_id is required');

      expect(uxResearchRepository.findByName).not.toHaveBeenCalled();
      expect(uxResearchResponseRepository.createUXResearchResponse).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: expect.any(String),
        data: {
          responseData: invalidDto.responseData,
          responseDate: invalidDto.responseDate,
          userId: undefined,
          companyId: undefined,
          error: 'Company_id or user_id is required',
        },
      });
    });

    it('should throw error when both UX research name and feature flag name are missing', async () => {
      const invalidDto: CreateUXResearchResponseDto = {
        responseData: '{"rating": 5}',
        responseDate: new Date('2023-01-15T10:00:00Z'),
        userId: 'user-1',
        userData: {
          userId: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchResponseUseCase.execute(invalidDto))
        .rejects.toThrow('UX Research name or feature flag name is required');

      expect(uxResearchRepository.findByName).not.toHaveBeenCalled();
      expect(uxResearchResponseRepository.createUXResearchResponse).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: expect.any(String),
        data: {
          responseData: invalidDto.responseData,
          responseDate: invalidDto.responseDate,
          userId: 'user-1',
          companyId: undefined,
          error: 'UX Research must exists in database',
        },
      });
    });

    it('should throw error when UX research does not exist', async () => {
      uxResearchRepository.findByName.mockResolvedValue(null);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchResponseUseCase.execute(mockCreateUXResearchResponseDto))
        .rejects.toThrow('UX Research must exists in database');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', false);
      expect(uxResearchResponseRepository.createUXResearchResponse).not.toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: expect.any(String),
        data: {
          responseData: mockCreateUXResearchResponseDto.responseData,
          responseDate: mockCreateUXResearchResponseDto.responseDate,
          userId: 'user-1',
          companyId: undefined,
          error: 'UX Research must exists in database',
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

      await expect(createUXResearchResponseUseCase.execute(mockCreateUXResearchResponseDto))
        .rejects.toThrow('UX Research must exists in database');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', false);
      expect(uxResearchResponseRepository.createUXResearchResponse).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.createUXResearchResponse.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchResponseUseCase.execute(mockCreateUXResearchResponseDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', false);
      expect(uxResearchResponseRepository.createUXResearchResponse).toHaveBeenCalled();
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: expect.any(String),
        data: {
          responseData: mockCreateUXResearchResponseDto.responseData,
          responseDate: mockCreateUXResearchResponseDto.responseDate,
          userId: 'user-1',
          companyId: undefined,
          error: 'Database connection failed',
        },
      });
    });

    it('should work with percentage field', async () => {
      const dtoWithPercentage: CreateUXResearchResponseDto = {
        uxResearchName: 'Test UX Research',
        responseData: '{"rating": 5}',
        responseDate: new Date('2023-01-15T10:00:00Z'),
        userId: 'user-1',
        percentage: 75.5,
        userData: {
          userId: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.createUXResearchResponse.mockResolvedValue(mockCreatedUXResearchResponse as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchResponseUseCase.execute(dtoWithPercentage);

      expect(result).toEqual(mockCreatedUXResearchResponse);
      expect(uxResearchRepository.findByName).toHaveBeenCalledWith('Test UX Research', false);
    });

    it('should work with empty string user ID and company ID', async () => {
      const dtoWithEmptyIds: CreateUXResearchResponseDto = {
        uxResearchName: 'Test UX Research',
        responseData: '{"rating": 5}',
        responseDate: new Date('2023-01-15T10:00:00Z'),
        userId: '',
        companyId: '',
        userData: {
          userId: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(createUXResearchResponseUseCase.execute(dtoWithEmptyIds))
        .rejects.toThrow('Company_id or user_id is required');

      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: expect.any(String),
        data: {
          responseData: dtoWithEmptyIds.responseData,
          responseDate: dtoWithEmptyIds.responseDate,
          userId: '',
          companyId: '',
          error: 'Company_id or user_id is required',
        },
      });
    });

    it('should work with special characters in response data', async () => {
      const dtoWithSpecialChars: CreateUXResearchResponseDto = {
        uxResearchName: 'Test UX Research',
        responseData: '{"feedback": "Great experience! @#$%^&*()"}',
        responseDate: new Date('2023-01-15T10:00:00Z'),
        userId: 'user-special',
        userData: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      uxResearchRepository.findByName.mockResolvedValue(mockUXResearch);
      uxResearchResponseRepository.createUXResearchResponse.mockResolvedValue(mockCreatedUXResearchResponse as any);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await createUXResearchResponseUseCase.execute(dtoWithSpecialChars);

      expect(result).toEqual(mockCreatedUXResearchResponse);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'create_ux_research_response',
        entityId: 'response-1',
        entity: 'UXResearchResponse',
        timestamp: expect.any(String),
        data: {
          responseData: dtoWithSpecialChars.responseData,
          responseDate: dtoWithSpecialChars.responseDate,
          uxResearchId: 'ux-research-1',
          userId: 'user-special',
          companyId: undefined,
        },
      });
    });
  });
});
