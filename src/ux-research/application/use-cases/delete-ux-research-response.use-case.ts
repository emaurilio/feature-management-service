import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { DeleteUXResearchResponseDto } from '../dto/delete-ux-research-response.dto';
import type { UXResearchResponseRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';

@Injectable()
export class DeleteUXResearchResponseUseCase {
  constructor(
    @Inject('UXResearchResponseRepositoryInterface')
    private readonly uxResearchResponseRepository: UXResearchResponseRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(deleteUXResearchResponseDto: DeleteUXResearchResponseDto) {
    try {
      const result = await this.uxResearchResponseRepository.deleteUXResearchResponse(
        deleteUXResearchResponseDto.uxResponseId,
      );

      void this.auditLogService.dispatchLog({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: deleteUXResearchResponseDto.uxResponseId,
        timestamp: new Date().toISOString(),
        data: {
          user: deleteUXResearchResponseDto.userData,
          message: 'UX Research deleted successfully',
        },
      });

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: new Date().toISOString(),
        data: {
          user: deleteUXResearchResponseDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
