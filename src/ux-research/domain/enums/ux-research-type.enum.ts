export enum UXResearchType {
  PERCENTAGE = 'percentage',
  COMPANY = 'company',
  USER = 'user',
  USER_PERCENTAGE = 'user_percentage',
  COMPANY_PERCENTAGE = 'company_percentage',
}

export function isCompanyType(type: UXResearchType): boolean {
  return [UXResearchType.COMPANY, UXResearchType.COMPANY_PERCENTAGE].includes(
    type,
  );
}

export function isUserType(type: UXResearchType): boolean {
  return [UXResearchType.USER, UXResearchType.USER_PERCENTAGE].includes(type);
}

export function isPercentageType(type: UXResearchType): boolean {
  return [
    UXResearchType.PERCENTAGE,
    UXResearchType.USER_PERCENTAGE,
    UXResearchType.COMPANY_PERCENTAGE,
  ].includes(type);
}
