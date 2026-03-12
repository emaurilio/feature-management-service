import { Injectable } from '@nestjs/common';
import { CreateFeatureFlagDto } from './application/dto/CreateFeatureFlag.dto';

@Injectable()
export class FeatureFlagService {
  async create(createFeatureFlagDto: CreateFeatureFlagDto) {
    return {
      message: 'Feature Flag created successfully',
      data: createFeatureFlagDto,
    };
  }
}
