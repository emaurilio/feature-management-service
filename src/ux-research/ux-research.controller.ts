import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@ApiTags('Public')
@ApiBearerAuth('JWT-auth')
@Controller('api/ux-research')
@UseGuards(JwtAuthGuard)
export class AppController { }
