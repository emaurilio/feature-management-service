import type { UpdateResult } from 'typeorm';
import { UXResearchResponse } from '../../entites/UXResearchResponse';

export interface UXResearchResponseRepositoryInterface {
    createUXResearchResponse(uxResearchResponse: UXResearchResponse): Promise<UXResearchResponse>;

    searchByNamePaginated(
        name: string,
        page: number,
        limit: number,
    ): Promise<{ data: UXResearchResponse[]; total: number }>;

    softDelete(id: string): Promise<UpdateResult>;
}
