import { Controller, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SimpleTokenGuard } from 'src/common/guards/simple-token.guard';

@ApiTags('Internal')
@ApiSecurity('STS-Token')
@Controller('sts/ux-research')
@UseGuards(SimpleTokenGuard)
export class AppController { }
