/* eslint-disable @typescript-eslint/no-unsafe-call */

import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import { FeatureFlagType } from 'src/FeatureFlagModule/domain/enums/feature-flag-type.enum';

export interface UserData {
  userId: string;
  email: string;
  name: string;
}

export class CreateFeatureFlagDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Type is required' })
  type: FeatureFlagType;

  @IsNumber({ maxDecimalPlaces: 2 })
  percentage: number;

  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
