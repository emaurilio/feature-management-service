import { Expose } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { IsFeatureFlagPresent } from 'src/FeatureFlagModule/infraestructure/validators/feature-flag-exists.validator';
import type { UserData } from './types/user-data.type';

export class ImportUsersIdsDto {
  @Expose({ name: 'feature_flag_name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @IsFeatureFlagPresent()
  featureFlagName: string;

  @Expose({ name: 'users_ids' })
  @IsNotEmpty({ message: 'User IDs is required' })
  @IsArray({ message: 'User IDs must be an array' })
  usersIds: string[];

  //The field User Data must be a object with data by user that create this feature flag
  @Expose({ name: 'user_data' })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
