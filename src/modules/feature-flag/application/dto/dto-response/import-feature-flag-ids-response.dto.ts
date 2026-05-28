import { ApiProperty } from '@nestjs/swagger';

export class ImportFeatureFlagIdsResponseDto {
  @ApiProperty()
  featureFlagName: string;

  @ApiProperty()
  totalReceived: number;

  @ApiProperty()
  imported: number;

  @ApiProperty()
  skipped: number;
}
