import { UXResearchResponse } from "src/ux-research/domain/entites/UXResearchResponse";
import { UXResearchResponseEntity } from "../entities/ux-research-response.entity";

export class UXResearchResponseMapper {
    static toDomain(entity: UXResearchResponseEntity): UXResearchResponse {
        return new UXResearchResponse(
            entity.response,
            entity.responseDate,
            entity.uxResearchId,
            entity.userId,
            entity.companyId,
            entity.id,
        );
    }

    static toEntity(domain: UXResearchResponse): Partial<UXResearchResponseEntity> {
        return {
            response: domain.response,
            responseDate: domain.responseDate,
            uxResearchId: domain.uxResearchId,
            userId: domain.userId,
            companyId: domain.companyId,
            id: domain.id,
        };
    }
}