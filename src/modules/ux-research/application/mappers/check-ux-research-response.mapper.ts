import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { CheckUxResearchResponseDto } from '../dto/response/check-ux-research-response.dto';

export class CheckUxResearchResponseMapper {
  static toResponse(
    uxResearch: UXResearch,
    checkUxResearch: boolean,
  ): CheckUxResearchResponseDto {
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
      checkUxResearch,
    };
  }
}
