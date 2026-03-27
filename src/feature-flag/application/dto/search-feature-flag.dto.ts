import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import type { UserData } from './types/user-data.type';

export class SearchFeatureFlagDto {
  @IsNotEmpty({ message: 'Feature Flag Name is required' })
  @IsString({ message: 'Feature Flag Name must be a string' })
  name: string;

  @IsNumber({ maxDecimalPlaces: 0 })
  page?: number = 1;

  //The field User Data must be a object with data by user that search for features flag
  @Expose({ name: 'user_data' })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
