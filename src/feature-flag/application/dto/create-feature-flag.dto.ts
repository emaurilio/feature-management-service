import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import type { UserData } from './types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @IsNotEmpty({ message: 'Feature Flag Name is required' })
  @IsString({ message: 'Feature Flag Name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(FeatureFlagType, { message: 'Type must be a valid FeatureFlagType' })
  type: FeatureFlagType;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Percentage must be a number with up to 2 decimal places' },
  )
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage?: number | null;

  //The field User Data must be a object with data by user that create this feature flag
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
