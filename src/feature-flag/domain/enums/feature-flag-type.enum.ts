export enum FeatureFlagType {
  PERCENTAGE = 'percentage',
  COMPANY = 'company',
  USER = 'user',
  USER_PERCENTAGE = 'user_percentage',
  COMPANY_PERCENTAGE = 'company_percentage',
}

export function isCompanyType(type: FeatureFlagType): boolean {
  return [FeatureFlagType.COMPANY, FeatureFlagType.COMPANY_PERCENTAGE].includes(
    type,
  );
}

export function isUserType(type: FeatureFlagType): boolean {
  return [FeatureFlagType.USER, FeatureFlagType.USER_PERCENTAGE].includes(type);
}
