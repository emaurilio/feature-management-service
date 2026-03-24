import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateFeatureFlagDto } from './application/dto/create-feature-flag.dto';
import { CreateFeatureFlagUseCase } from './application/usecase/create-feature-flag.use-case';
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';
import { ImportCompaniesIdsUseCase } from './application/usecase/import-companies-ids.use-case';
import { ImportCompaniesIdsDto } from './application/dto/import-companies-ids.dto';
import { ImportUsersIdsDto } from './application/dto/import-users-ids.dto';
import { ImportUsersIdsUseCase } from './application/usecase/import-users-ids.use-case';

@Controller('feature-flags')
export class FeatureFlagController {
  constructor(
    private readonly createFeatureFlagUseCase: CreateFeatureFlagUseCase,
    private readonly importCompaniesIdsUseCase: ImportCompaniesIdsUseCase,
    private readonly importUsersIdsUseCase: ImportUsersIdsUseCase,
  ) {}

  @UseGuards(SimpleTokenGuard)
  @Post('create')
  async create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    return this.createFeatureFlagUseCase.execute(createFeatureFlagDto);
  }

  @UseGuards(SimpleTokenGuard)
  @Post('import-companies-ids')
  async importCompaniesIds(
    @Body() importCompaniesIdsDto: ImportCompaniesIdsDto,
  ) {
    return this.importCompaniesIdsUseCase.execute(importCompaniesIdsDto);
  }

  @UseGuards(SimpleTokenGuard)
  @Post('import-users-ids')
  async importUsersIds(@Body() importUsersIdsDto: ImportUsersIdsDto) {
    return this.importUsersIdsUseCase.execute(importUsersIdsDto);
  }
}
