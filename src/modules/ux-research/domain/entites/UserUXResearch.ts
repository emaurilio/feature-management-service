export class UserUXResearch {
  constructor(
    public readonly uxResearchId: string,
    public readonly userId: string,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) { }
}
