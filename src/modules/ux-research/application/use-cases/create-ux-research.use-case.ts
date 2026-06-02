import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUXResearchDto } from '../dto/create-ux-research.dto';
import { AuditLogService } from '../services/log.service';
import { getErrorMessage } from 'src/modules/common/utils/error.utils';
import { isPercentageType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { GetUxResearchResponseDto } from '../dto/dto-response/get-ux-research.response.dto';
import { GetUxResearchResponseMapper } from '../mappers/get-ux-research-response.mapper';
import { DeleteUXResearchUseCase } from './delete-ux-research.use-case';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';

@Injectable()
export class CreateUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    private readonly auditLogService: AuditLogService,
    private readonly deleteUXResearchUseCase: DeleteUXResearchUseCase,
  ) { }

  async execute(
    createUXResearchDto: CreateUXResearchDto,
  ): Promise<GetUxResearchResponseDto> {
    try {
      if (
        isPercentageType(createUXResearchDto.type) &&
        createUXResearchDto.percentage == null
      ) {
        throw new BadRequestException(
          'Percentage is required for this ux research type',
        );
      }
      const uxResearchExists = await this.uxResearchRepository.findByName(
        createUXResearchDto.name,
        true,
      );

      if (uxResearchExists) {
        return await this.createNewVersion(createUXResearchDto, uxResearchExists);
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

      return GetUxResearchResponseMapper.toResponse(result);
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

      throw error;
    }
  }

  private async createNewVersion(
    createUXResearchDto: CreateUXResearchDto,
    existingUXResearch: UXResearch,
  ): Promise<GetUxResearchResponseDto> {
    const newVersion = existingUXResearch.version + 1;
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

    const isAlreadySoftDeleted = existingUXResearch.deletedAt != null;

    if (!isAlreadySoftDeleted) {
      const deleteOldUXResearch = await this.deleteUXResearchUseCase.execute({
        name: createUXResearchDto.name!,
        userData: createUXResearchDto.userData,
      });

      if (!deleteOldUXResearch.deleted) {
        throw new InternalServerErrorException('Failed to delete old UX Research');
      }
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

    return GetUxResearchResponseMapper.toResponse(result);
  }
}
