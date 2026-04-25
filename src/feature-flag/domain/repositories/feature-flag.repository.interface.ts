import type { UpdateResult } from 'typeorm';
import { FeatureFlag } from '../entities/FeatureFlag';

export interface FeatureFlagRepositoryInterface {
  createFeatureFlag(featureFlag: FeatureFlag): Promise<FeatureFlag>;

  findByName(name: string, withDeleted?: boolean): Promise<FeatureFlag | null>;

  searchByNamePaginated(
    name: string,
    page: number,
    limit: number,
  ): Promise<{ data: FeatureFlag[]; total: number }>;

  update(
    id: string,
    partialEntity: Partial<FeatureFlag>,
  ): Promise<UpdateResult>;

  updateFeatureFlag(
    id: string,
    partialEntity: Partial<FeatureFlag>,
  ): Promise<FeatureFlag>;

  softDelete(id: string): Promise<UpdateResult>;
}
