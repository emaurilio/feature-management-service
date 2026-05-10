import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { UserData } from 'src/modules/common/utils/types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsFeatureFlagPresent } from 'src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import { IsUXResearchPresent } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';

export class CreateUXResearchResponseDto {
  @Expose({ name: 'ux_research_name' })
  @IsOptional()
  @IsString({ message: 'UX Research Name must be a string' })
  @IsUXResearchPresent({ message: 'UX Research not found' })
  uxResearchName?: string;

  @Expose({ name: 'feature_flag_name' })
  @IsOptional()
  @IsString({ message: 'Feature Flag name must be a string' })
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  featureFlagName?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Percentage must be a number with up to 2 decimal places' },
  )
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage?: number | null;

  @Expose({ name: 'user_id' })
  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  userId?: string;

  @Expose({ name: 'response_data' })
  @IsNotEmpty({ message: 'Response data is required' })
  @IsJSON({ message: 'Response data must be a valid JSON string' })
  responseData: string;

  @Expose({ name: 'response_date' })
  @IsNotEmpty({ message: 'Response date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Response date must be a date' })
  responseDate: Date;

  @Expose({ name: 'company_id' })
  @IsOptional()
  @IsString({ message: 'Company ID must be a string' })
  companyId?: string;

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
