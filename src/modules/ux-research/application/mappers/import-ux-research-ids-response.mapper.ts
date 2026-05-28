import { ImportUxResearchIdsResponseDto } from '../dto/dto-response/import-ux-research-ids-response.dto';

export interface ImportUxResearchIdsSummary {
  uxResearchName: string;
  totalReceived: number;
  imported: number;
  skipped: number;
}

export class ImportUxResearchIdsResponseMapper {
  static toResponse(
    summary: ImportUxResearchIdsSummary,
  ): ImportUxResearchIdsResponseDto {
    return {
      uxResearchName: summary.uxResearchName,
      totalReceived: summary.totalReceived,
      imported: summary.imported,
      skipped: summary.skipped,
    };
  }
}
