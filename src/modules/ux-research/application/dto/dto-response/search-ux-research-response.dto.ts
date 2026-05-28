import { ApiProperty } from '@nestjs/swagger';
import { GetUxResearchResponseDto } from './get-ux-research.response.dto';

export class SearchUxResearchMetaDto {
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

export class SearchUxResearchPaginatedResponseDto {
  @ApiProperty({ type: [GetUxResearchResponseDto] })
  items: GetUxResearchResponseDto[];

  @ApiProperty({ type: SearchUxResearchMetaDto })
  meta: SearchUxResearchMetaDto;
}
