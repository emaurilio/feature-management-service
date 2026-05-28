import { ApiProperty } from '@nestjs/swagger';
import { GetUxResearchResponseItemDto } from './get-ux-research-response-item.dto';

export class GetUxResearchResponsesMetaDto {
  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  currentPage: number;
}

export class GetUxResearchResponsesPaginatedResponseDto {
  @ApiProperty({ type: [GetUxResearchResponseItemDto] })
  items: GetUxResearchResponseItemDto[];

  @ApiProperty({ type: GetUxResearchResponsesMetaDto })
  meta: GetUxResearchResponsesMetaDto;
}
