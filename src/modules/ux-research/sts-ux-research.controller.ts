import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post, UseGuards, Version } from '@nestjs/common';
import { SimpleTokenGuard } from 'src/modules/common/guards/simple-token.guard';
import { ImportCompaniesIdsUseCase } from './application/use-cases/import-companies-ids.use-case';
import { ImportUsersIdsUseCase } from './application/use-cases/import-users-ids.use-case';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DeleteUxResearchItemResponseDto } from './application/dto/response/delete-ux-research-item-response.dto';
import { DeleteUXResearchUseCase } from './application/use-cases/delete-ux-research.use-case';
import { SearchUXResearchUseCase } from './application/use-cases/search-feature-flag.use-case';
import { CheckUXResearchUseCase } from './application/use-cases/check-feature-flag/check-ux-research.use-case';
import { DisableUXResearchUseCase } from './application/use-cases/disable-ux-research.use-case';
import { ActiveUXResearchUseCase } from './application/use-cases/active-ux-research.use-case';
import { CreateUXResearchDto } from './application/dto/create-ux-research.dto';
import { CreateUXResearchUseCase } from './application/use-cases/create-ux-research.use-case';
import { ImportUXResearchCompaniesIdsDto } from './application/dto/import-companies-ids.dto';
import { ImportUXResearchUsersIdsDto } from './application/dto/import-users-ids.dto';
import { DeleteUXResearchDto } from './application/dto/delete-ux-research.dto';
import { CheckUXResearchValidateDto } from './application/dto/check-ux-research-validate.dto';
import { DisableUXResearchDto } from './application/dto/desable-ux-research.dto';
import { ActiveUXResearchDto } from './application/dto/active-ux-research.dto';
import { SearchUXResearchDto } from './application/dto/search-ux-research.dto';
import { GetUXResearchResponseDto } from './application/dto/response/get-ux-research-response.dto';
import { GetUXResearchResponseUseCase } from './application/use-cases/get-ux-research-response.use-case';
import { CreateUXResearchResponseDto } from './application/dto/response/create-ux-research-response.dto';
import { CreateUXResearchResponseUseCase } from './application/use-cases/create-ux-research-response.use-case';
import { DeleteUXResearchResponseDto } from './application/dto/response/delete-ux-research-response.dto';
import { DeleteUXResearchResponseUseCase } from './application/use-cases/delete-ux-research-response.use-case';

@ApiTags('Internal')
@ApiSecurity('STS-Token')
@Controller('sts/ux-research')
@UseGuards(SimpleTokenGuard)
export class StsUXResearchController {
    constructor(
        private readonly createUXResearchUseCase: CreateUXResearchUseCase,
        private readonly importCompaniesIdsUseCase: ImportCompaniesIdsUseCase,
        private readonly importUsersIdsUseCase: ImportUsersIdsUseCase,
        private readonly deleteUXResearchUseCase: DeleteUXResearchUseCase,
        private readonly searchUXResearchByName: SearchUXResearchUseCase,
        private readonly checkUXResearchUseCase: CheckUXResearchUseCase,
        private readonly disableUXResearchUseCase: DisableUXResearchUseCase,
        private readonly activeUXResearchUseCase: ActiveUXResearchUseCase,
        private readonly getUXResearchResponseUseCase: GetUXResearchResponseUseCase,
        private readonly createUXResearchResponseUseCase: CreateUXResearchResponseUseCase,
        private readonly deleteUXResearchResponseUseCase: DeleteUXResearchResponseUseCase,
    ) { }
    @Version('1')
    @Post('create')
    async create(@Body() createUXResearchDto: CreateUXResearchDto) {
        return this.createUXResearchUseCase.execute(createUXResearchDto);
    }

    @Version('1')
    @Post('import-companies-ids')
    async importCompaniesIds(
        @Body() importCompaniesIdsDto: ImportUXResearchCompaniesIdsDto,
    ) {
        return this.importCompaniesIdsUseCase.execute(importCompaniesIdsDto);
    }

    @Version('1')
    @Post('import-users-ids')
    async importUsersIds(@Body() importUsersIdsDto: ImportUXResearchUsersIdsDto) {
        return this.importUsersIdsUseCase.execute(importUsersIdsDto);
    }

    @Version('1')
    @Delete('delete')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: DeleteUXResearchResponseDto })
    async delete(@Body() deleteUXResearchDto: DeleteUXResearchDto) {
        return await this.deleteUXResearchUseCase.execute(deleteUXResearchDto);
    }

    @Version('1')
    @Post('search')
    @HttpCode(HttpStatus.OK)
    async searchForName(@Body() search: SearchUXResearchDto) {
        return await this.searchUXResearchByName.execute(search);
    }

    @Version('1')
    @Post('check-ux-research')
    @HttpCode(HttpStatus.OK)
    async checkValidate(@Body() checkValidate: CheckUXResearchValidateDto) {
        return await this.checkUXResearchUseCase.execute(checkValidate);
    }

    @Version('1')
    @Patch('disable')
    @ApiOkResponse({ type: GetUXResearchResponseDto })
    async disable(@Body() disableUXResearchDto: DisableUXResearchDto) {
        return await this.disableUXResearchUseCase.execute(disableUXResearchDto);
    }

    @Version('1')
    @Patch('active')
    @ApiOkResponse({ type: GetUXResearchResponseDto })
    async active(@Body() activeUXResearchDto: ActiveUXResearchDto) {
        return await this.activeUXResearchUseCase.execute(activeUXResearchDto);
    }

    @Version('1')
    @Post('create-ux-research-response')
    @ApiOkResponse({ type: GetUXResearchResponseDto })
    async createUXResearchResponse(@Body() createUXResearchResponseDto: CreateUXResearchResponseDto) {
        return await this.createUXResearchResponseUseCase.execute(createUXResearchResponseDto);
    }

    @Version('1')
    @Delete('delete-ux-research-response')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: GetUXResearchResponseDto })
    async deleteUXResearchResponse(@Body() deleteUXResearchResponseDto: DeleteUXResearchResponseDto) {
        return await this.deleteUXResearchResponseUseCase.execute(deleteUXResearchResponseDto);
    }

    @Version('1')
    @Post('get-responses')
    @HttpCode(HttpStatus.OK)
    async getUXResearchResponses(@Body() getUXResearchResponseDto: GetUXResearchResponseDto) {
        return await this.getUXResearchResponseUseCase.execute(getUXResearchResponseDto);
    }
    
}
