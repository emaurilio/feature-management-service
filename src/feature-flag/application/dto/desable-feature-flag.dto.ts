import { Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import type { UserData } from './types/user-data.type';
import { IsFeatureFlagPresent } from 'src/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisableFeatureFlagDto {
  @Expose({ name: 'feature_flag_name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  featureFlagName: string;

  //The field User Data must be a object with data by user that create this feature flag
  @Expose({ name: 'user_data' })
  @ApiProperty({
    example: {
      userId: 'string',
      email: 'string',
      name: 'string',
    },
  })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
