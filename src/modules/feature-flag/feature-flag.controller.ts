import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Version } from '@nestjs/common';
import { CheckFeatureFlagValidateDto } from './application/dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagUseCase } from './application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { JwtAuthGuard } from 'src/modules/common/guards/jwt.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CheckFeatureFlagResponseDto } from './application/dto/dto-response/check-feature-flag-response.dto';

@ApiTags('Public')
@ApiBearerAuth('JWT-auth')
@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  constructor(
    private readonly checkFeatureFlagUseCase: CheckFeatureFlagUseCase,
  ) { }
  @Version('1')
  @Post('check-feature-flag')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CheckFeatureFlagResponseDto })
  async checkValidate(@Body() checkValidate: CheckFeatureFlagValidateDto) {
    return await this.checkFeatureFlagUseCase.execute(checkValidate);
  }
}
