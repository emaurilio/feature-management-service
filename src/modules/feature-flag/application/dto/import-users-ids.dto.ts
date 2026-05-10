import { Expose } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsObject, IsString, MinLength } from 'class-validator';
import { IsFeatureFlagPresent } from 'src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import type { UserData } from '../../../common/utils/types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';

export class ImportUsersIdsDto {
  @Expose({ name: 'feature_flag_name' })
  @IsNotEmpty({ message: 'Feature Flag Name is required' })
  @IsString({ message: 'Feature Flag Name must be a string' })
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  featureFlagName: string;

  @Expose({ name: 'users_ids' })
  @IsNotEmpty({ message: 'Users IDs is required' })
  @ArrayMinSize(1, { message: 'Users IDs is required' })
  @IsString({ each: true, message: 'Users IDs must contain only strings' })
  @MinLength(1, { each: true, message: 'Each user ID must be a non-empty string' })
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
