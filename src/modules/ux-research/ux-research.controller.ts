import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Version } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/common/guards/jwt.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CheckUxResearchResponseDto } from './application/dto/dto-response/check-ux-research.response.dto';
import { CheckUXResearchUseCase } from './application/use-cases/check-feature-flag/check-ux-research.use-case';
import { CheckUXResearchValidateDto } from './application/dto/check-ux-research-validate.dto';

@ApiTags('Public')
@ApiBearerAuth('JWT-auth')
@Controller('ux-research')
@UseGuards(JwtAuthGuard)
export class UXResearchController {
    constructor(
        private readonly checkFeatureFlagUseCase: CheckUXResearchUseCase,
    ) { }
    @Version('1')
    @Post('check')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: CheckUxResearchResponseDto })
    async checkValidate(@Body() checkValidate: CheckUXResearchValidateDto) {
        return await this.checkFeatureFlagUseCase.execute(checkValidate);
    }
}
