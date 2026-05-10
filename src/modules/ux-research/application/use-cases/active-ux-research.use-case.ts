import { Inject, Injectable } from '@nestjs/common';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { ActiveUXResearchDto } from '../dto/active-ux-research.dto';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';

@Injectable()
export class ActiveUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
  ) { }

  async execute(activeUXResearchDto: ActiveUXResearchDto) {
    try {
      const uxResearchExists = await this.uxResearchRepository.findByName(
        activeUXResearchDto.uxResearchName,
      );

      if (!uxResearchExists) {
        throw new Error('UX Research not found');
      }

      const result = await this.uxResearchRepository.updateUXResearch(
        uxResearchExists.id ?? '',
        {
          isActive: true,
        },
      );

      void this.auditLogService.dispatchLog({
        action: 'activate_ux_research',
        entity: 'UXResearch',
        entityId: uxResearchExists.id ?? '',
        timestamp: new Date().toISOString(),
        data: {
          user: activeUXResearchDto.userData,
          name: activeUXResearchDto.uxResearchName,
        },
      });

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'activate_ux_research',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          user: activeUXResearchDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
