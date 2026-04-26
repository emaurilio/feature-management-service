import { Inject, Injectable } from '@nestjs/common';
import { LogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { DisableUXResearchDto } from '../dto/desable-ux-research.dto';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';

@Injectable()
export class DisableUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly logService: LogService,
  ) { }

  async execute(disableUXResearchDto: DisableUXResearchDto) {
    try {
      const uxResearchExists = await this.uxResearchRepository.findByName(
        disableUXResearchDto.uxResearchName,
      );

      if (!uxResearchExists) {
        throw new Error('UX Research not found');
      }

      const result = await this.uxResearchRepository.update(
        uxResearchExists.id ?? '',
        {
          isActive: false,
        },
      );

      void this.logService.dispatchLog({
        action: 'disable',
        entity: 'UXResearch',
        entityId: uxResearchExists.id ?? '',
        timestamp: new Date().toISOString(),
        data: {
          user: disableUXResearchDto.userData,
          name: disableUXResearchDto.uxResearchName,
        },
      });

      return result;
    } catch (error) {
      void this.logService.dispatchLog({
        action: 'disable',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          user: disableUXResearchDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
