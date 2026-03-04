import { Controller, UseGuards } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {}
