/* eslint-disable @typescript-eslint/no-unused-vars */
import { CheckUXResearchDto } from 'src/modules/ux-research/application/dto/check-ux-research/check-ux-research.dto';

export class CheckUXResearchInterface {
  execute(
    checkUXResearchDto: CheckUXResearchDto,
  ): Promise<boolean> | boolean {
    throw new Error('Method not implemented.');
  }
}
