import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { DeleteUXResearchResponseDto } from '../dto/response/delete-ux-research-response.dto';
import { GetUxResearchResponseItemDto } from '../dto/dto-response/response/get-ux-research-response-item.dto';
import { GetUxResearchResponseItemMapper } from '../mappers/get-ux-research-response-item.mapper';
import type { UXResearchResponseRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';

@Injectable()
export class DeleteUXResearchResponseUseCase {
  constructor(
    @Inject('UXResearchResponseRepositoryInterface')
    private readonly uxResearchResponseRepository: UXResearchResponseRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(
    deleteUXResearchResponseDto: DeleteUXResearchResponseDto,
  ): Promise<GetUxResearchResponseItemDto> {
    try {
      const uxResearchResponse = await this.uxResearchResponseRepository.findById(
        deleteUXResearchResponseDto.uxResponseId,
      );

      if (!uxResearchResponse) {
        throw new Error('UX Research response not found');
      }

      const deleted = await this.uxResearchResponseRepository.deleteUXResearchResponse(
        deleteUXResearchResponseDto.uxResponseId,
      );

      void this.auditLogService.dispatchLog({
        action: 'delete_ux_research_response',
        entity: 'UXResearchResponse',
        entityId: deleteUXResearchResponseDto.uxResponseId,
        timestamp: new Date().toISOString(),
        data: {
          user: deleteUXResearchResponseDto.userData,
          message: 'UX Research response deleted successfully',
        },
      });

      return GetUxResearchResponseItemMapper.toResponse(
        uxResearchResponse,
        { deleted: deleted },
      );
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
