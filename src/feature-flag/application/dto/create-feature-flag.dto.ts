import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import type { UserData } from './types/user-data.type';

export class CreateFeatureFlagDto {
  @IsNotEmpty({ message: 'Feature Flag Name is required' })
  @IsString({ message: 'Feature Flag Name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Type is required' })
  type: FeatureFlagType;

  @IsNumber({ maxDecimalPlaces: 2 })
  percentage: number;

  //The field User Data must be a object with data by user that create this feature flag
  @Expose({ name: 'user_data' })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
