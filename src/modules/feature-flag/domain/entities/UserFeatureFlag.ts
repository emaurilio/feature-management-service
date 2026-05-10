export class UserFeatureFlag {
  constructor(
    public readonly featureId: string,
    public readonly userId: string,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) {}
}
