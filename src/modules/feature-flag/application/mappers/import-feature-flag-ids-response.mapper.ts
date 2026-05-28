import { ImportFeatureFlagIdsResponseDto } from '../dto/dto-response/import-feature-flag-ids-response.dto';

export interface ImportFeatureFlagIdsSummary {
  featureFlagName: string;
  totalReceived: number;
  imported: number;
  skipped: number;
}

export class ImportFeatureFlagIdsResponseMapper {
  static toResponse(
    summary: ImportFeatureFlagIdsSummary,
  ): ImportFeatureFlagIdsResponseDto {
    return {
      featureFlagName: summary.featureFlagName,
      totalReceived: summary.totalReceived,
      imported: summary.imported,
      skipped: summary.skipped,
    };
  }
}
