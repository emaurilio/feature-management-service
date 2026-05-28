import { ApiProperty } from '@nestjs/swagger';

export class GetUxResearchResponseItemDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  uxResearchId: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  companyId?: string;

  @ApiProperty()
  response: unknown;

  @ApiProperty()
  responseDate: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty({ required: false })
  deleted?: boolean;
}
