import { CheckFeatureFlagResponseDto } from 'src/modules/feature-flag/application/dto/dto-response/check-feature-flag-response.dto';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { CheckUxResearchResponseDto } from '../dto/dto-response/check-ux-research.response.dto';
import { GetUxResearchResponseMapper } from './get-ux-research-response.mapper';

export class CheckUxResearchResponseMapper {
  static toResponse(
    uxResearch: UXResearch,
    checkUxResearch: boolean,
    featureFlag?: CheckFeatureFlagResponseDto,
  ): CheckUxResearchResponseDto {
    return {
      ...GetUxResearchResponseMapper.toResponse(uxResearch),
      checkUxResearch,
      ...(featureFlag && { featureFlag }),
    };
  }
}