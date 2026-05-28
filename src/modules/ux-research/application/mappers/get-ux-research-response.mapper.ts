import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { GetUxResearchResponseDto } from '../dto/dto-response/get-ux-research.response.dto';

export class GetUxResearchResponseMapper {
  static toResponse(
    uxResearch: UXResearch,
    options?: { deleted?: boolean },
  ): GetUxResearchResponseDto {
    return {
      id: uxResearch.id,
      name: uxResearch.name,
      nameVersion: uxResearch.nameVersion,
      type: uxResearch.type,
      percentage: uxResearch.percentage,
      version: uxResearch.version,
      isActive: uxResearch.isActive,
      featureFlagName: uxResearch.featureFlagName,
      startDate: uxResearch.startDate?.toISOString(),
      endDate: uxResearch.endDate?.toISOString(),
      createdAt: uxResearch.createdAt,
      updatedAt: uxResearch.updatedAt,
      deletedAt: uxResearch.deletedAt,
      ...(options?.deleted !== undefined && { deleted: options.deleted }),
    };
  }
}
