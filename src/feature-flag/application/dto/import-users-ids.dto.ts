import { Expose } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { IsFeatureFlagPresent } from 'src/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import type { UserData } from './types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';

export class ImportUsersIdsDto {
  @Expose({ name: 'feature_flag_name' })
  @IsNotEmpty({ message: 'Feature Flag Name is required' })
  @IsString({ message: 'Feature Flag Name must be a string' })
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  featureFlagName: string;

  @Expose({ name: 'users_ids' })
  @IsNotEmpty({ message: 'Users IDs is required' })
  @IsArray({ message: 'Users IDs must be an array' })
  usersIds: string[];

  //The field User Data must be a object with data by user that import this feature flag
  @Expose({ name: 'user_data' })
  @ApiProperty({
    example: {
      userId: 'string',
      email: 'string',
      name: 'string',
    },
    required: true,
  })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
