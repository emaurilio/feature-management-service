import { Body, Controller, Post, UseGuards, Version } from '@nestjs/common';
import { CheckFeatureFlagValidateDto } from './application/dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagUseCase } from './application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Controller('api/feature-flags')
export class FeatureFlagController {
  constructor(
    private readonly checkFeatureFlagUseCase: CheckFeatureFlagUseCase,
  ) {}
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Post('check-feature-flag')
  async checkValidate(@Body() checkValidate: CheckFeatureFlagValidateDto) {
    return await this.checkFeatureFlagUseCase.execute(checkValidate);
  }
}
