import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateFeatureFlagDto } from './application/dto/CreateFeatureFlag.dto';
import { CreateFeatureFlagUseCase } from './application/usecase/create-feature-flag.use-case';
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';

@Controller('feature-flags')
export class FeatureFlagController {
  constructor(
    private readonly createFeatureFlagUseCase: CreateFeatureFlagUseCase,
  ) {}

  @UseGuards(SimpleTokenGuard)
  @Post('create')
  async create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    return this.createFeatureFlagUseCase.execute(createFeatureFlagDto);
  }
}
