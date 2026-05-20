import { UXResearchResponse } from 'src/modules/ux-research/domain/entites/UXResearchResponse';
import { DeleteUxResearchItemResponseDto } from '../dto/response/delete-ux-research-item-response.dto';

export class DeleteUxResearchItemResponseMapper {
  static toResponse(
    uxResearchResponse: UXResearchResponse,
    deleted: boolean,
  ): DeleteUxResearchItemResponseDto {
    return {
      id: uxResearchResponse.id,
      uxResearchId: uxResearchResponse.uxResearchId,
      userId: uxResearchResponse.userId,
      companyId: uxResearchResponse.companyId,
      responseDate: uxResearchResponse.responseDate.toISOString(),
      deleted,
    };
  }
}
