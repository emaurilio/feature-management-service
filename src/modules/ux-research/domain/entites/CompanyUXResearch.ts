export class CompanyUXResearch {
  constructor(
    public readonly uxResearchId: string,
    public readonly companyId: string,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) { }
}
