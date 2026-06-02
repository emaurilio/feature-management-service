/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotImplementedException } from '@nestjs/common';
import { CheckUXResearchDto } from 'src/modules/ux-research/application/dto/check-ux-research.dto';

export class CheckUXResearchInterface {
  execute(
    checkUXResearchDto: CheckUXResearchDto,
  ): Promise<boolean> | boolean {
    throw new NotImplementedException('Method not implemented.');
  }
}
