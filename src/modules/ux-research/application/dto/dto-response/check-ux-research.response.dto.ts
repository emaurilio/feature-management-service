import { ApiProperty } from '@nestjs/swagger';
import { CheckFeatureFlagResponseDto } from 'src/modules/feature-flag/application/dto/dto-response/check-feature-flag-response.dto';
import { GetUxResearchResponseDto } from './get-ux-research.response.dto';

export class CheckUxResearchResponseDto extends GetUxResearchResponseDto {
  @ApiProperty()
  checkUxResearch: boolean;

  @ApiProperty({ type: CheckFeatureFlagResponseDto, required: false })
  featureFlag?: CheckFeatureFlagResponseDto;
}