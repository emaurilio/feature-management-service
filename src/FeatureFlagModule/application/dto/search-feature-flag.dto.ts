import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import type { UserData } from './types/user-data.type';

export class SearchFeatureFlagDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsNumber({ maxDecimalPlaces: 0 })
  page?: number = 1;

  //The field User Data must be a object with data by user that create this feature flag
  @Expose({ name: 'user_data' })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
