import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUXResearchResponseUseCase } from 'src/modules/ux-research/application/use-cases/delete-ux-research-response.use-case';
import { DeleteUXResearchResponseDto } from 'src/modules/ux-research/application/dto/response/delete-ux-research-response.dto';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { UXResearchResponse } from 'src/modules/ux-research/domain/entites/UXResearchResponse';
import { GetUxResearchResponseItemMapper } from 'src/modules/ux-research/application/mappers/get-ux-research-response-item.mapper';
import type { UXResearchResponseRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';

describe('DeleteUXResearchResponseUseCase', () => {
  let deleteUXResearchResponseUseCase: DeleteUXResearchResponseUseCase;
  let uxResearchResponseRepository: jest.Mocked<UXResearchResponseRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUXResearchResponseRepository = {
      findById: jest.fn(),
      deleteUXResearchResponse: jest.fn(),
    };

    const mockAuditLogService = {
      dispatchLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUXResearchResponseUseCase,
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

    deleteUXResearchResponseUseCase = module.get<DeleteUXResearchResponseUseCase>(DeleteUXResearchResponseUseCase);
    uxResearchResponseRepository = module.get('UXResearchResponseRepositoryInterface');
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockDeleteUXResearchResponseDto: DeleteUXResearchResponseDto = {
      uxResponseId: 'response-1',
      userData: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
    };

    const mockUXResearchResponse = new UXResearchResponse(
      { answer: 'yes' },
      new Date('2024-01-01T00:00:00.000Z'),
      'ux-research-1',
      'user-1',
      'company-1',
      'response-1',
    );

    it('should delete UX research response successfully', async () => {
      uxResearchResponseRepository.findById.mockResolvedValue(mockUXResearchResponse);
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(mockDeleteUXResearchResponseDto);

      expect(uxResearchResponseRepository.findById).toHaveBeenCalledWith('response-1');
      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('response-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'response-1',
        timestamp: expect.any(String),
        data: {
          user: mockDeleteUXResearchResponseDto.userData,
          message: 'UX Research response deleted successfully',
        },
      });
      expect(result).toEqual(
        GetUxResearchResponseItemMapper.toResponse(mockUXResearchResponse, {
          deleted: true,
        }),
      );
    });

    it('should throw when UX research response is not found', async () => {
      uxResearchResponseRepository.findById.mockResolvedValue(null);

      await expect(
        deleteUXResearchResponseUseCase.execute(mockDeleteUXResearchResponseDto),
      ).rejects.toThrow('UX Research response not found');

      expect(uxResearchResponseRepository.deleteUXResearchResponse).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      uxResearchResponseRepository.findById.mockResolvedValue(mockUXResearchResponse);
      uxResearchResponseRepository.deleteUXResearchResponse.mockRejectedValue(repositoryError);
      auditLogService.dispatchLog.mockResolvedValue(true);

      await expect(deleteUXResearchResponseUseCase.execute(mockDeleteUXResearchResponseDto))
        .rejects.toThrow('Database connection failed');

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('response-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: expect.any(String),
        data: {
          user: mockDeleteUXResearchResponseDto.userData,
          error: 'Database connection failed',
        },
      });
    });

    
    it('should work with different response ID formats', async () => {
      const uuidDto: DeleteUXResearchResponseDto = {
        uxResponseId: 'uuid-54321-09876-fedcba',
        userData: {
          userId: 'user-2',
          email: 'user2@example.com',
          name: 'Second User',
        },
      };

      uxResearchResponseRepository.findById.mockResolvedValue(
        new UXResearchResponse({}, new Date('2024-01-01T00:00:00.000Z'), 'ux-1', undefined, undefined, 'uuid-54321-09876-fedcba'),
      );
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(uuidDto);

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('uuid-54321-09876-fedcba');
      expect(result.deleted).toBe(true);
      expect(result.id).toBe('uuid-54321-09876-fedcba');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'uuid-54321-09876-fedcba',
        timestamp: expect.any(String),
        data: {
          user: uuidDto.userData,
          message: 'UX Research response deleted successfully',
        },
      });
    });

    it('should work with empty string response ID', async () => {
      const emptyIdDto: DeleteUXResearchResponseDto = {
        uxResponseId: '',
        userData: {
          userId: 'user-3',
          email: 'user3@example.com',
          name: 'Third User',
        },
      };

      uxResearchResponseRepository.findById.mockResolvedValue(
        new UXResearchResponse({}, new Date('2024-01-01T00:00:00.000Z'), 'ux-1', undefined, undefined, ''),
      );
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(emptyIdDto);

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('');
      expect(result.deleted).toBe(false);
    });

    it('should work with special characters in response ID', async () => {
      const specialCharsDto: DeleteUXResearchResponseDto = {
        uxResponseId: 'response-123!@#$%^&*()',
        userData: {
          userId: 'user-special',
          email: 'special@example.com',
          name: 'Special User',
        },
      };

      uxResearchResponseRepository.findById.mockResolvedValue(
        new UXResearchResponse({}, new Date('2024-01-01T00:00:00.000Z'), 'ux-1', undefined, undefined, 'response-123!@#$%^&*()'),
      );
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(specialCharsDto);

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('response-123!@#$%^&*()');
      expect(result.deleted).toBe(true);
    });

    it('should work with different user data formats', async () => {
      const minimalUserDataDto: DeleteUXResearchResponseDto = {
        uxResponseId: 'response-minimal',
        userData: {
          userId: '',
          email: '',
          name: '',
        },
      };

      uxResearchResponseRepository.findById.mockResolvedValue(
        new UXResearchResponse({}, new Date('2024-01-01T00:00:00.000Z'), 'ux-1', undefined, undefined, 'response-minimal'),
      );
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(minimalUserDataDto);

      expect(result.deleted).toBe(true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'response-minimal',
        timestamp: expect.any(String),
        data: {
          user: minimalUserDataDto.userData,
          message: 'UX Research response deleted successfully',
        },
      });
    });

    it('should return false when repository returns false', async () => {
      uxResearchResponseRepository.findById.mockResolvedValue(mockUXResearchResponse);
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(mockDeleteUXResearchResponseDto);

      expect(result.deleted).toBe(false);
      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('response-1');
    });
  });
});
