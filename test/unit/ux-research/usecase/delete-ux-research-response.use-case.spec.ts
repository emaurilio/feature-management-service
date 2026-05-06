import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUXResearchResponseUseCase } from 'src/ux-research/application/use-cases/delete-ux-research-response.use-case';
import { DeleteUXResearchResponseDto } from 'src/ux-research/application/dto/delete-ux-research-response.dto';
import type { UXResearchResponseRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';
import { AuditLogService } from 'src/ux-research/application/services/log.service';

describe('DeleteUXResearchResponseUseCase', () => {
  let deleteUXResearchResponseUseCase: DeleteUXResearchResponseUseCase;
  let uxResearchResponseRepository: jest.Mocked<UXResearchResponseRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const mockUXResearchResponseRepository = {
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

    it('should delete UX research response successfully', async () => {
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(mockDeleteUXResearchResponseDto);

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('response-1');
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'response-1',
        timestamp: expect.any(String),
        data: {
          user: mockDeleteUXResearchResponseDto.userData,
          message: 'UX Research deleted successfully',
        },
      });
      expect(result).toBe(true);
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
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

      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(uuidDto);

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('uuid-54321-09876-fedcba');
      expect(result).toBe(true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'uuid-54321-09876-fedcba',
        timestamp: expect.any(String),
        data: {
          user: uuidDto.userData,
          message: 'UX Research deleted successfully',
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

      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(emptyIdDto);

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('');
      expect(result).toBe(false);
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

      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(specialCharsDto);

      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('response-123!@#$%^&*()');
      expect(result).toBe(true);
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

      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(true);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(minimalUserDataDto);

      expect(result).toBe(true);
      expect(auditLogService.dispatchLog).toHaveBeenCalledWith({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: 'response-minimal',
        timestamp: expect.any(String),
        data: {
          user: minimalUserDataDto.userData,
          message: 'UX Research deleted successfully',
        },
      });
    });

    it('should return false when repository returns false', async () => {
      uxResearchResponseRepository.deleteUXResearchResponse.mockResolvedValue(false);
      auditLogService.dispatchLog.mockResolvedValue(true);

      const result = await deleteUXResearchResponseUseCase.execute(mockDeleteUXResearchResponseDto);

      expect(result).toBe(false);
      expect(uxResearchResponseRepository.deleteUXResearchResponse).toHaveBeenCalledWith('response-1');
    });
  });
});
