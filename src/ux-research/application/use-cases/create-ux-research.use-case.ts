import { Inject, Injectable } from '@nestjs/common';
import { CreateUXResearchDto } from '../dto/create-ux-research.dto';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import { isPercentageType } from 'src/ux-research/domain/enums/ux-research-type.enum';
import { UXResearch } from 'src/ux-research/domain/entites/UXResearch';
import { DeleteUXResearchUseCase } from './delete-ux-research.use-case';

@Injectable()
export class CreateUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
    private readonly deleteUXResearchUseCase: DeleteUXResearchUseCase,
  ) { }

  async execute(createUXResearchDto: CreateUXResearchDto) {
    try {
      if (
        isPercentageType(createUXResearchDto.type) &&
        createUXResearchDto.percentage == null
      ) {
        throw new Error(
          'Percentage value is not allowed for this ux research type',
        );
      }
      const uxResearchExists = await this.uxResearchRepository.findByName(
        createUXResearchDto.name,
        true,
      );

      if (uxResearchExists) {
        const newVersion = uxResearchExists.version + 1;
        const newUXResearch = new UXResearch(
          `${createUXResearchDto.name}-${newVersion}`,
          createUXResearchDto.name,
          createUXResearchDto.percentage || 0,
          newVersion,
          true,
          createUXResearchDto.type,
          createUXResearchDto.featureFlagName,
          createUXResearchDto.startDate,
          createUXResearchDto.endDate,
        );

        const deleteOldUXResearch =
          await this.deleteUXResearchUseCase.execute({
            name: createUXResearchDto.name!,
            userData: createUXResearchDto.userData,
          });

        if (!deleteOldUXResearch) {
          throw new Error('Failed to delete old UX Research');
        }

        const result =
          await this.uxResearchRepository.createUXResearch(newUXResearch);

        void this.auditLogService.dispatchLog({
          action: 'create_ux_research',
          entity: 'UXResearch',
          entityId: result.id,
          timestamp: new Date().toISOString(),
          data: {
            user: createUXResearchDto.userData,
            name: createUXResearchDto.name,
            percentage: createUXResearchDto.percentage,
            version: newVersion,
            active: true,
            type: createUXResearchDto.type,
          },
        });

        return result;
      }
      const newUXResearch = new UXResearch(
        `${createUXResearchDto.name}-1`,
        createUXResearchDto.name,
        createUXResearchDto.percentage || 0,
        1,
        true,
        createUXResearchDto.type,
        createUXResearchDto.featureFlagName,
        createUXResearchDto.startDate,
        createUXResearchDto.endDate,
      );
      const result =
        await this.uxResearchRepository.createUXResearch(newUXResearch);

      void this.auditLogService.dispatchLog({
        action: 'create_ux_research',
        entity: 'UXResearch',
        entityId: result.id,
        timestamp: new Date().toISOString(),
        data: {
          user: createUXResearchDto.userData,
          name: createUXResearchDto.name,
          percentage: createUXResearchDto.percentage,
          version: 1,
          active: true,
          type: createUXResearchDto.type,
          featureFlagName: createUXResearchDto.featureFlagName,
          startDate: createUXResearchDto.startDate,
          endDate: createUXResearchDto.endDate,
        },
      });

      return result;
    } catch (error) {
      void this.auditLogService.dispatchLog({
        action: 'create_ux_research',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          user: createUXResearchDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
