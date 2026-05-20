import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { DeleteUxResearchResponseDto } from '../dto/response/delete-ux-research-response.dto';

export class DeleteUxResearchResponseMapper {
  static toResponse(
    uxResearch: UXResearch,
    deleted: boolean,
  ): DeleteUxResearchResponseDto {
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
      deleted,
    };
  }
}
