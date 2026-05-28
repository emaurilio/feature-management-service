import { UXResearchResponse } from 'src/modules/ux-research/domain/entites/UXResearchResponse';
import { GetUxResearchResponseItemDto } from '../dto/dto-response/response/get-ux-research-response-item.dto';

export class GetUxResearchResponseItemMapper {
  static toResponse(
    uxResearchResponse: UXResearchResponse,
    options?: { deleted?: boolean },
  ): GetUxResearchResponseItemDto {
    return {
      id: uxResearchResponse.id,
      uxResearchId: uxResearchResponse.uxResearchId,
      userId: uxResearchResponse.userId,
      companyId: uxResearchResponse.companyId,
      response: uxResearchResponse.response,
      responseDate: uxResearchResponse.responseDate.toISOString(),
      createdAt: uxResearchResponse.createdAt,
      updatedAt: uxResearchResponse.updatedAt,
      deletedAt: uxResearchResponse.deletedAt,
      ...(options?.deleted !== undefined && { deleted: options.deleted }),
    };
  }
}
