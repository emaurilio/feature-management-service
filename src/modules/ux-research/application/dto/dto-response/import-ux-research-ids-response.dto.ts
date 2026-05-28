import { ApiProperty } from '@nestjs/swagger';

export class ImportUxResearchIdsResponseDto {
  @ApiProperty()
  uxResearchName: string;

  @ApiProperty()
  totalReceived: number;

  @ApiProperty()
  imported: number;

  @ApiProperty()
  skipped: number;
}
