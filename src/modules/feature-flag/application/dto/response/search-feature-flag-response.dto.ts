import { ApiProperty } from "@nestjs/swagger";
import { GetFeatureFlagResponseDto } from "./get-feature-flag-response.dto";

export class SearchFeatureFlagMetaDto {
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
  
  export class SearchFeatureFlagPaginatedResponseDto {
    @ApiProperty({ type: [GetFeatureFlagResponseDto] })
    items: GetFeatureFlagResponseDto[];
  
    @ApiProperty({ type: SearchFeatureFlagMetaDto })
    meta: SearchFeatureFlagMetaDto;
  }