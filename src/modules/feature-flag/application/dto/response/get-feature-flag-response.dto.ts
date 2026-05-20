import { ApiProperty } from '@nestjs/swagger';
import { FeatureFlagType } from 'src/modules/feature-flag/domain/enums/feature-flag-type.enum';

export class GetFeatureFlagResponseDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nameVersion: string;

  @ApiProperty({ enum: FeatureFlagType })
  type: FeatureFlagType;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  version: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}