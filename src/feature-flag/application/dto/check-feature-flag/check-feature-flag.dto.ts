export class CheckFeatureFlagDto {
  userId?: string;
  companyId?: string;
  featureName: string;
  version: number;
  featureId: string;
  percentage: number;
}
