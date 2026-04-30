import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { UserData } from 'src/common/utils/types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';
import { UXResearchType } from 'src/ux-research/domain/enums/ux-research-type.enum';
import { IsFeatureFlagPresent } from 'src/feature-flag/infraestructure/validators/feature-flag-exists.validator';

export class CreateUXResearchDto {
  @IsNotEmpty({ message: 'UX Research Name is required' })
  @IsString({ message: 'UX Research Name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(UXResearchType, { message: 'Type must be a valid UXResearchType' })
  type: UXResearchType;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Percentage must be a number with up to 2 decimal places' },
  )
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage?: number | null;

  @Expose({ name: 'start_date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Start date must be a date' })
  startDate?: Date;

  @Expose({ name: 'end_date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'End date must be a date' })
  endDate?: Date;

  @Expose({ name: 'feature_flag_name' })
  @IsOptional()
  @IsString()
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  featureFlagName?: string;

  //The field User Data must be a object with data by user that create this ux research
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
