import { Inject, Injectable } from '@nestjs/common';
import { LogService } from '../services/log.service';
import { getErrorMessage } from 'src/common/utils/error.utils';
import { DeleteUXResearchDto } from '../dto/delete-ux-research.dto';
import type { UXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/ux-research.repository.interface';
import type { CompanyUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/company-ux-research.repository.interface';
import type { UserUXResearchRepositoryInterface } from 'src/ux-research/domain/repositories/persistence/user-ux-research.repository.interface';
import { isCompanyType, isUserType } from 'src/ux-research/domain/enums/ux-research-type.enum';

@Injectable()
export class DeleteUXResearchUseCase {
  constructor(
    @Inject('UXResearchRepositoryInterface')
    private readonly uxResearchRepository: UXResearchRepositoryInterface,
    @Inject('CompanyUXResearchRepositoryInterface')
    private readonly companyUXResearchRepository: CompanyUXResearchRepositoryInterface,
    @Inject('UserUXResearchRepositoryInterface')
    private readonly userUXResearchRepository: UserUXResearchRepositoryInterface,
    private readonly logService: LogService,
  ) { }

  async execute(deleteUXResearchDto: DeleteUXResearchDto) {
    try {
      const uxResearchExists = await this.uxResearchRepository.findByName(
        deleteUXResearchDto.name,
      );

      if (!uxResearchExists) {
        throw new Error('UX Research not found');
      }

      const result = await this.uxResearchRepository.softDelete(
        uxResearchExists.id ?? '',
      );

      if (isCompanyType(uxResearchExists.type)) {
        await this.companyUXResearchRepository.deleteByUXResearchId(
          uxResearchExists.id ?? '',
        );
      }

      if (isUserType(uxResearchExists.type)) {
        await this.userUXResearchRepository.deleteByUXResearchId(
          uxResearchExists.id ?? '',
        );
      }

      void this.logService.dispatchLog({
        action: 'delete',
        entity: 'UXResearch',
        entityId: uxResearchExists.id,
        timestamp: new Date().toISOString(),
        data: {
          user: deleteUXResearchDto.userData,
          name: deleteUXResearchDto.name,
          type: uxResearchExists.type,
          error: 'UX Research deleted successfully',
        },
      });

      return result;
    } catch (error) {
      void this.logService.dispatchLog({
        action: 'delete',
        entity: 'UXResearch',
        timestamp: new Date().toISOString(),
        data: {
          user: deleteUXResearchDto.userData,
          error: getErrorMessage(error),
        },
      });

      throw new Error(getErrorMessage(error));
    }
  }
}
