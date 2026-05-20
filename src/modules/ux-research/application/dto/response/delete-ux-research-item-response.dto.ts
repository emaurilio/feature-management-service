import { ApiProperty } from '@nestjs/swagger';

export class DeleteUxResearchItemResponseDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  uxResearchId: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  companyId?: string;

  @ApiProperty()
  responseDate: string;

  @ApiProperty()
  deleted: boolean;
}
