import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post, Put, UseGuards, Version } from '@nestjs/common';
import { CreateFeatureFlagDto } from './application/dto/create-feature-flag.dto';
import { CreateFeatureFlagUseCase } from './application/use-cases/create-feature-flag.use-case';
import { SimpleTokenGuard } from 'src/modules/common/guards/simple-token.guard';
import { ImportCompaniesIdsUseCase } from './application/use-cases/import-companies-ids.use-case';
import { ImportCompaniesIdsDto } from './application/dto/import-companies-ids.dto';
import { ImportUsersIdsDto } from './application/dto/import-users-ids.dto';
import { ImportUsersIdsUseCase } from './application/use-cases/import-users-ids.use-case';
import { DeleteFeatureFlagUseCase } from './application/use-cases/delete-feature-flag.use-case';
import { SearchFeatureFlagDto } from './application/dto/search-feature-flag.dto';
import { SearchFeatureFlagUseCase } from './application/use-cases/search-feature-flag.use-case';
import { CheckFeatureFlagValidateDto } from './application/dto/check-feature-flag-validate.dto';
import { CheckFeatureFlagUseCase } from './application/use-cases/check-feature-flag/check-feature-flag.use-case';
import { DisableFeatureFlagDto } from './application/dto/disable-feature-flag.dto';
import { DisableFeatureFlagUseCase } from './application/use-cases/disable-feature-flag.use-case';
import { ActiveFeatureFlagUseCase } from './application/use-cases/active-feature-flag.use-case';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DeleteFeatureFlagResponseDto } from './application/dto/response/delete-feature-flag-response.dto';
import { CheckFeatureFlagResponseDto } from './application/dto/response/check-feature-flag-response.dto';
import { GetFeatureFlagResponseDto } from './application/dto/response/get-feature-flag-response.dto';
import { SearchFeatureFlagPaginatedResponseDto } from './application/dto/response/search-feature-flag-response.dto';
import { DeleteFeatureFlagDto } from './application/dto/delete-feature-flag.dto';
import { ActiveFeatureFlagDto } from './application/dto/active-feature-flag.dto';

@ApiTags('Internal')
@ApiSecurity('STS-Token')
@Controller('sts/feature-flags')
@UseGuards(SimpleTokenGuard)
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
  ) { }
  @Version('1')
  @Post('create')
  @ApiOkResponse({ type: GetFeatureFlagResponseDto })
  async create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    return this.createFeatureFlagUseCase.execute(createFeatureFlagDto);
  }

  @Version('1')
  @Post('import-companies-ids')
  async importCompaniesIds(
    @Body() importCompaniesIdsDto: ImportCompaniesIdsDto,
  ) {
    return this.importCompaniesIdsUseCase.execute(importCompaniesIdsDto);
  }

  @Version('1')
  @Post('import-users-ids')
  async importUsersIds(@Body() importUsersIdsDto: ImportUsersIdsDto) {
    return this.importUsersIdsUseCase.execute(importUsersIdsDto);
  }

  @Version('1')
  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DeleteFeatureFlagResponseDto })
  async delete(@Body() deleteFeatureFlagDto: DeleteFeatureFlagDto) {
    return await this.deleteFeatureFlagUseCase.execute(deleteFeatureFlagDto);
  }

  @Version('1')
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SearchFeatureFlagPaginatedResponseDto })
  async searchForName(@Body() search: SearchFeatureFlagDto) {
    return await this.searchFeatureFlagByName.execute(search);
  }

  @Version('1')
  @Post('check-feature-flag')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CheckFeatureFlagResponseDto })
  async checkValidate(@Body() checkValidate: CheckFeatureFlagValidateDto) {
    return await this.checkFeatureFlagUseCase.execute(checkValidate);
  }

  @Version('1')
  @Patch('disable')
  @ApiOkResponse({ type: GetFeatureFlagResponseDto })
  async disable(@Body() disableFeatureFlagDto: DisableFeatureFlagDto) {
    return await this.disableFeatureFlagUseCase.execute(disableFeatureFlagDto);
  }

  @Version('1')
  @Patch('active')
  @ApiOkResponse({ type: GetFeatureFlagResponseDto })
  async active(@Body() activeFeatureFlagDto: ActiveFeatureFlagDto) {
    return await this.activeFeatureFlagUseCase.execute(activeFeatureFlagDto);
  }
}
