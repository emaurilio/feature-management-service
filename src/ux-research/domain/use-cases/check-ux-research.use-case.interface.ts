/* eslint-disable @typescript-eslint/no-unused-vars */
import { CheckUXResearchDto } from 'src/ux-research/application/dto/check-feature-flag/check-ux-research.dto';

export class CheckUXResearchInterface {
  execute(
    checkUXResearchDto: CheckUXResearchDto,
  ): Promise<boolean> | boolean {
    throw new Error('Method not implemented.');
  }
}
