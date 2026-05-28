import { ApiProperty } from '@nestjs/swagger';
import { GetFeatureFlagResponseDto } from './get-feature-flag-response.dto';

export class CheckFeatureFlagResponseDto extends GetFeatureFlagResponseDto {
  @ApiProperty()
  checkFeatureFlag: boolean;
}
