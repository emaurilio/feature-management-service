import { UXResearch } from 'src/ux-research/domain/entites/UXResearch';
import type { UpdateResult } from 'typeorm';

export interface UXResearchRepositoryInterface {
  createUXResearch(uxResearch: UXResearch): Promise<UXResearch>;

  findByName(name: string, withDeleted?: boolean): Promise<UXResearch | null>;

  searchByNamePaginated(
    name: string,
    page: number,
    limit: number,
  ): Promise<{ data: UXResearch[]; total: number }>;

  update(
    id: string,
    partialEntity: Partial<UXResearch>,
  ): Promise<UpdateResult>;

  updateUXResearch(
    id: string,
    partialEntity: Partial<UXResearch>,
  ): Promise<UXResearch>;

  softDelete(id: string): Promise<UpdateResult>;
}
