import { ApiProperty } from "@nestjs/swagger";

export class CheckFeatureFlagDto {
  @ApiProperty()
  userId?: string;

  @ApiProperty()
  companyId?: string;
  @ApiProperty()
  featureName: string;
  @ApiProperty()
  version: number;
  @ApiProperty()
  featureId: string;
  percentage: number;
}
