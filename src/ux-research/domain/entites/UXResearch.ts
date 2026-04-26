import { UXResearchType } from "../enums/ux-research-type.enum";

export class UXResearch {
  constructor(
    public readonly nameVersion: string,
    public readonly name: string,
    public readonly percentage: number,
    public readonly version: number,
    public readonly isActive: boolean,
    public readonly type: UXResearchType,
    public readonly featureFlagName?: string,
    public readonly id?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
  ) {
    this.nameVersion = nameVersion;
    this.name = name;
    this.featureFlagName = featureFlagName;
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
