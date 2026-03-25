import { Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import type { UserData } from './types/user-data.type';

export class DeleteFeatureFlagDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  //The field User Data must be a object with data by user that create this feature flag
  @Expose({ name: 'user_data' })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
