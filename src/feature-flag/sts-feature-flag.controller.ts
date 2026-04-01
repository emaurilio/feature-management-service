import { Body, Controller, Post, UseGuards, Version } from '@nestjs/common';
import { CreateFeatureFlagDto } from './application/dto/create-feature-flag.dto';
import { CreateFeatureFlagUseCase } from './application/use-cases/create-feature-flag.use-case';
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';
import { ImportCompaniesIdsUseCase } from './application/use-cases/import-companies-ids.use-case';
import { ImportCompaniesIdsDto } from './application/dto/import-companies-ids.dto';
import { ImportUsersIdsDto } from './application/dto/import-users-ids.dto';
import { ImportUsersIdsUseCase } from './application/use-cases/import-users-ids.use-case';
import { DeleteFeatureFlagDto } from './application/dto/delete-feature-flag.dto';
import { DeleteFeatureFlagUseCase } from './application/use-cases/delete-feature-flag.use-case';
import { SearchFeatureFlagDto } from './application/dto/search-feature-flag.dto';
import { SearchFeatureFlagUseCase } from './application/use-cases/search-feature-flag.use-case';
import { CheckFeatureFlagValidateDto } from './application/dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagUseCase } from './application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { DisableFeatureFlagDto } from './application/dto/desable-feature-flag.dto';
import { DisableFeatureFlagUseCase } from './application/use-cases/disable-feature-flag.use-case';
import { ActiveFeatureFlagUseCase } from './application/use-cases/active-feature-flag.use-case';

@Controller('sts/feature-flags')
export class StsFeatureFlagController {
  constructor(
    private readonly createFeatureFlagUseCase: CreateFeatureFlagUseCase,
    private readonly importCompaniesIdsUseCase: ImportCompaniesIdsUseCase,
    private readonly importUsersIdsUseCase: ImportUsersIdsUseCase,
    private readonly deleteFeatureFlagUseCase: DeleteFeatureFlagUseCase,
    private readonly searchFeatureFlagByName: SearchFeatureFlagUseCase,
    private readonly checkFeatureFlagUseCase: CheckFeatureFlagUseCase,
    private readonly disableFeatureFlagUseCase: DisableFeatureFlagUseCase,
    private readonly activeFeatureFlagUseCase: ActiveFeatureFlagUseCase,
  ) {}

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('create')
  async create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    return this.createFeatureFlagUseCase.execute(createFeatureFlagDto);
  }

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('import-companies-ids')
  async importCompaniesIds(
    @Body() importCompaniesIdsDto: ImportCompaniesIdsDto,
  ) {
    return this.importCompaniesIdsUseCase.execute(importCompaniesIdsDto);
  }

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('import-users-ids')
  async importUsersIds(@Body() importUsersIdsDto: ImportUsersIdsDto) {
    return this.importUsersIdsUseCase.execute(importUsersIdsDto);
  }

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('delete')
  async delete(@Body() deleteFeatureFlagDto: DeleteFeatureFlagDto) {
    return await this.deleteFeatureFlagUseCase.execute(deleteFeatureFlagDto);
  }

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('search')
  async searchForName(@Body() search: SearchFeatureFlagDto) {
    return await this.searchFeatureFlagByName.execute(search);
  }

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('check-feature-flag')
  async checkValidate(@Body() checkValidate: CheckFeatureFlagValidateDto) {
    return await this.checkFeatureFlagUseCase.execute(checkValidate);
  }

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('disable')
  async disable(@Body() disableFeatureFlagDto: DisableFeatureFlagDto) {
    return await this.disableFeatureFlagUseCase.execute(disableFeatureFlagDto);
  }

  @Version('1')
  @UseGuards(SimpleTokenGuard)
  @Post('active')
  async active(@Body() activeFeatureFlagDto: DisableFeatureFlagDto) {
    return await this.activeFeatureFlagUseCase.execute(activeFeatureFlagDto);
  }
}
