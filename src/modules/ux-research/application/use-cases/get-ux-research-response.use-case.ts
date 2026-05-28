import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { GetUxResearchResponsesPaginatedResponseDto } from '../dto/dto-response/response/get-ux-research-responses-paginated-response.dto';
import { GetUxResearchResponsesResponseMapper } from '../mappers/get-ux-research-responses-response.mapper';
import { GetUXResearchResponsesDto } from '../dto/response/get-ux-research-response.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { UXResearchResponseRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';

@Injectable()
export class GetUXResearchResponseUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    @Inject('UXResearchResponseRepositoryInterface')
    private readonly uxResearchResponseRepository: UXResearchResponseRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(
    getUXResearchDto: GetUXResearchResponsesDto,
  ): Promise<GetUxResearchResponsesPaginatedResponseDto> {
    try {
      const getUxResearch = await this.uxResearchRepository.findByName(
        getUXResearchDto.name,
      );

      if (!getUxResearch) {
       void this.auditLogService.dispatchLog({
        action: 'get_ux_research_response',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          user: getUXResearchDto.userData,
          name: getUXResearchDto.name,
          error: 'UX Research not found',
        },
      });

        throw new Error('UX Research not found');
      }

      if (!getUxResearch.id) {
        throw new Error('UX Research ID is undefined');
      }

      const getUXResearchResponse = await this.uxResearchResponseRepository.getByUXResearchIdPaginated(
        getUxResearch.id,
        getUXResearchDto.page,
        getUXResearchDto.limit,
      );

      if (!getUXResearchResponse) {
        void this.auditLogService.dispatchLog({
          action: 'get_ux_research_response',
          entity: 'UXResearch',
          timestamp: new Date().toISOString(),
          data: {
            user: getUXResearchDto.userData,
            name: getUXResearchDto.name,
            error: 'UX Research Response not found',
          },
        });

        throw new Error('UX Research Response not found');
      }

      void this.auditLogService.dispatchLog({
        action: 'get_ux_research_response',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          user: getUXResearchDto.userData,
          name: getUXResearchDto.name,
        },
      });

      return GetUxResearchResponsesResponseMapper.toResponse(
        getUXResearchResponse,
      );
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'get_ux_research_response',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          user: getUXResearchDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
