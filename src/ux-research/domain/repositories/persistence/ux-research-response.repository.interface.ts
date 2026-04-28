import { UXResearchResponse } from '../../entites/UXResearchResponse';
import { UXResearchResponseEntity } from 'src/ux-research/infraestructure/persistence/entities/ux-research-response.entity';

export interface UXResearchResponseRepositoryInterface {
    createUXResearchResponse(uxResearchResponse: UXResearchResponse): Promise<UXResearchResponseEntity>;

    searchByUXResearchIdPaginated(uxResearchId: string, page: number, limit: number): Promise<any>;

    deleteUXResearchResponse(id: string): Promise<boolean>;
}
