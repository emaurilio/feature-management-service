import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';

export class FeatureFlag {
  constructor(
    public readonly nameVersion: string,
    public readonly name: string,
    public readonly percentage: number,
    public readonly version: number,
    public readonly isActive: boolean,
    public readonly type: FeatureFlagType,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) {
    this.nameVersion = nameVersion;
    this.name = name;
    this.percentage = percentage;
    this.version = version;
    this.isActive = isActive;
    this.type = type;
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
}
