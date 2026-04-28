import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { CreateUXResearchResponseDto } from '../dto/create-ux-research-response.dto';
import type { UXResearchResponseRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research-response.repository.interface';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import { UXResearchResponse } from 'src/ux-research/domain/entites/UXResearchResponse';

@Injectable()
export class CreateUXResearchResponseUseCase {
  constructor(
    @Inject('UXResearchResponseRepositoryInterface')
    private readonly uxResearchResponseRepository: UXResearchResponseRepositoryInterface,
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(createUXResearchResponseDto: CreateUXResearchResponseDto) {
    try {
      if (
        !createUXResearchResponseDto.companyId &&
        !createUXResearchResponseDto.userId
      ) {
        void this.auditLogService.dispatchLog({
          action: 'create',
          entity: 'UXResearchResponse',
          timestamp: new Date().toISOString(),
          data: {
            responseData: createUXResearchResponseDto.responseData,
            responseDate: createUXResearchResponseDto.responseDate,
            userId: createUXResearchResponseDto.userId,
            companyId: createUXResearchResponseDto.companyId,
            error: 'Company_id or user_id is required',
          }
        });

        throw new Error(
          'Company_id or user_id is required',
        );
      }

      const entityID = createUXResearchResponseDto.companyId ?
        createUXResearchResponseDto.companyId :
        createUXResearchResponseDto.userId

      if (
        !createUXResearchResponseDto.uxResearchName &&
        !createUXResearchResponseDto.featureFlagName
      ) {
        void this.auditLogService.dispatchLog({
          action: 'create',
          entity: 'UXResearchResponse',
          timestamp: new Date().toISOString(),
          data: {
            responseData: createUXResearchResponseDto.responseData,
            responseDate: createUXResearchResponseDto.responseDate,
            userId: createUXResearchResponseDto.userId,
            companyId: createUXResearchResponseDto.companyId,
            error: 'UX research must exists in database',
          }
        });
        throw new Error(
          'UX research name or feature flag name is required',
        );
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
          action: 'create',
          entity: 'UXResearchResponse',
          timestamp: new Date().toISOString(),
          data: {
            responseData: createUXResearchResponseDto.responseData,
            responseDate: createUXResearchResponseDto.responseDate,
            userId: createUXResearchResponseDto.userId,
            companyId: createUXResearchResponseDto.companyId,
            error: 'UX research must exists in database',
        },
      });
        throw new Error(
          'UX research must exists in database',
        );
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
          action: 'create',
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

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'create',
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

      throw new Error(getErrorMessage(error));
    }
  }
}
