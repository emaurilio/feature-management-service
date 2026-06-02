import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { CreateUXResearchResponseDto } from '../dto/response/create-ux-research-response.dto';
import { UXResearchResponse } from 'src/modules/ux-research/domain/entites/UXResearchResponse';
import { GetUxResearchResponseItemDto } from '../dto/dto-response/response/get-ux-research-response-item.dto';
import { GetUxResearchResponseItemMapper } from '../mappers/get-ux-research-response-item.mapper';
import { UXResearchResponseMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research-response.mapper';
import type { UXResearchResponseRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';

@Injectable()
export class CreateUXResearchResponseUseCase {
  constructor(
    @Inject('UXResearchResponseRepositoryInterface')
    private readonly uxResearchResponseRepository: UXResearchResponseRepositoryInterface,
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(
    createUXResearchResponseDto: CreateUXResearchResponseDto,
  ): Promise<GetUxResearchResponseItemDto> {
    try {
      if (
        !createUXResearchResponseDto.companyId &&
        !createUXResearchResponseDto.userId
      ) {
        void this.auditLogService.dispatchLog({
          action: 'create_ux_research_response',
          entity: 'UXResearchResponse',
          timestamp: new Date().toISOString(),
          data: {
            responseData: createUXResearchResponseDto.responseData,
            responseDate: createUXResearchResponseDto.responseDate,
            userId: createUXResearchResponseDto.userId,
            companyId: createUXResearchResponseDto.companyId,
            error: 'Company ID or User ID is required',
          }
        });

        throw new BadRequestException('Company ID or User ID is required');
      }

      const entityID = createUXResearchResponseDto.companyId ?
        createUXResearchResponseDto.companyId :
        createUXResearchResponseDto.userId

      if (
        !createUXResearchResponseDto.uxResearchName &&
        !createUXResearchResponseDto.featureFlagName
      ) {
        void this.auditLogService.dispatchLog({
          action: 'create_ux_research_response',
          entity: 'UXResearchResponse',
          timestamp: new Date().toISOString(),
          data: {
            responseData: createUXResearchResponseDto.responseData,
            responseDate: createUXResearchResponseDto.responseDate,
            userId: createUXResearchResponseDto.userId,
            companyId: createUXResearchResponseDto.companyId,
            error: 'UX Research or Feature Flag must exists in database',
          }
        });
        throw new BadRequestException('UX Research or Feature Flag must exists in database');
      }

      const uxResearchExists = createUXResearchResponseDto.uxResearchName ?
        await this.uxResearchRepository.findByName(
            createUXResearchResponseDto.uxResearchName || '',
            false,
        ) :
        await this.uxResearchRepository.findByName(
            createUXResearchResponseDto.featureFlagName || '',
            false,
        );

      if (!uxResearchExists || !uxResearchExists.id) {
        void this.auditLogService.dispatchLog({
          action: 'create_ux_research_response',
          entity: 'UXResearchResponse',
          timestamp: new Date().toISOString(),
          data: {
            responseData: createUXResearchResponseDto.responseData,
            responseDate: createUXResearchResponseDto.responseDate,
            userId: createUXResearchResponseDto.userId,
            companyId: createUXResearchResponseDto.companyId,
            error: 'UX Research or Feature Flag must exists in database',
        },
      });
        throw new BadRequestException('UX Research or Feature Flag must exists in database');
      }

      const newUXResearchResponse = new UXResearchResponse(
        createUXResearchResponseDto.responseData,
        createUXResearchResponseDto.responseDate,
        uxResearchExists.id,
        createUXResearchResponseDto.userId,
        createUXResearchResponseDto.companyId,
      );

      const result = await this.uxResearchResponseRepository.createUXResearchResponse(newUXResearchResponse);

        void this.auditLogService.dispatchLog({
          action: 'create_ux_research_response',
          entity: 'UXResearchResponse',
          entityId: result.id,
          timestamp: new Date().toISOString(),
          data: {
            responseData: createUXResearchResponseDto.responseData,
            responseDate: createUXResearchResponseDto.responseDate,
            uxResearchId: uxResearchExists.id,
            userId: createUXResearchResponseDto.userId,
            companyId: createUXResearchResponseDto.companyId,
          },
        });

      const uxResearchResponse =
        result instanceof UXResearchResponse
          ? result
          : UXResearchResponseMapper.toDomain(result);

      return GetUxResearchResponseItemMapper.toResponse(uxResearchResponse);
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'create_ux_research_response',
        entity: 'UXResearchResponse',
        timestamp: new Date().toISOString(),
        data: {
          responseData: createUXResearchResponseDto.responseData,
          responseDate: createUXResearchResponseDto.responseDate,
          userId: createUXResearchResponseDto.userId,
          companyId: createUXResearchResponseDto.companyId,
          error: getErrorMessage(error),
        },
      });

      throw error;
    }
  }
}
