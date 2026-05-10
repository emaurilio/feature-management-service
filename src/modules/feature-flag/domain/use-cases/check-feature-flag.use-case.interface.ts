/* eslint-disable @typescript-eslint/no-unused-vars */
import { CheckFeatureFlagDto } from 'src/modules/feature-flag/application/dto/check-feature-flag/check-feature-flag.dto';

export class CheckFeatureFlagInterface {
  execute(
    checkFeatureFlagDto: CheckFeatureFlagDto,
  ): Promise<boolean> | boolean {
    throw new Error('Method not implemented.');
  }
}
