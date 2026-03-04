export class FeatureFlag {
  constructor(
    public readonly nameVersion: string,
    public readonly name: string,
    public readonly percentage: number,
    public readonly version: string,
    public readonly isActive: boolean,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) {}
}
