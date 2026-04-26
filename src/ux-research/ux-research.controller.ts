import { Body, Controller, Post, UseGuards, Version } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckUXResearchUseCase } from './application/use-cases/check-feature-flag/check-ux-research.use-case';
import { CheckUXResearchDto } from './application/dto/check-feature-flag/check-ux-research.dto';

@ApiTags('Public')
@ApiBearerAuth('JWT-auth')
@Controller('api/ux-research')
@UseGuards(JwtAuthGuard)
export class UXResearchController {
    constructor(
        private readonly checkFeatureFlagUseCase: CheckUXResearchUseCase,
    ) { }
    @Version('1')
    @Post('check')
    async checkValidate(@Body() checkValidate: CheckUXResearchDto) {
        return await this.checkFeatureFlagUseCase.execute(checkValidate);
    }
}
