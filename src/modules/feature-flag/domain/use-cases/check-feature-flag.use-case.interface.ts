/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotImplementedException } from '@nestjs/common';
import { CheckFeatureFlagDto } from 'src/modules/feature-flag/application/dto/check-feature-flag.dto';

export class CheckFeatureFlagInterface {
  execute(
    checkFeatureFlagDto: CheckFeatureFlagDto,
  ): Promise<boolean> | boolean {
    throw new NotImplementedException('Method not implemented.');
  }
}
