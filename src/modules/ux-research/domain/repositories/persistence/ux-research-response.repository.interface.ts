import { UXResearchResponse } from '../../entites/UXResearchResponse';
import { UXResearchResponseEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research-response.entity';

export interface UXResearchResponseRepositoryInterface {
    createUXResearchResponse(uxResearchResponse: UXResearchResponse): Promise<UXResearchResponseEntity>;

    searchByUXResearchIdPaginated(uxResearchId: string, page: number, limit: number): Promise<any>;

    findById(id: string): Promise<UXResearchResponse | null>;

    deleteUXResearchResponse(id: string): Promise<boolean>;

    getByUXResearchIdPaginated(uxResearchId: string, page?: number, limit?: number): Promise<{
        items: UXResearchResponse[];
        meta: {
            totalItems: number;
            itemCount: number;
            itemsPerPage: number;
            totalPages: number;
            currentPage: number;
        };
    } | null>;
}
