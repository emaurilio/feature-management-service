import { ApiProperty } from '@nestjs/swagger';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

export class GetUxResearchResponseDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nameVersion: string;

  @ApiProperty({ enum: UXResearchType })
  type: UXResearchType;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  version: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  featureFlagName?: string;

  @ApiProperty({ required: false })
  startDate?: string;

  @ApiProperty({ required: false })
  endDate?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty({ required: false })
  deleted?: boolean;
}
