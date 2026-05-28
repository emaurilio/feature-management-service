import { Expose } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsObject, IsString, MinLength } from 'class-validator';
import { IsFeatureFlagPresent } from 'src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import { ApiProperty } from '@nestjs/swagger';
import type { UserData } from '../../../common/utils/types/user-data.type';

export class ImportCompaniesIdsDto {
  @Expose({ name: 'feature_flag_name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  featureFlagName: string;

  @Expose({ name: 'companies_ids' })
  @IsNotEmpty({ message: 'Companies IDs is required' })
  @ArrayMinSize(1, { message: 'Companies IDs is required' })
  @IsString({ each: true, message: 'Companies IDs must contain only strings' })
  @MinLength(1, { each: true, message: 'Each company ID must be a non-empty string' })
  companiesIds: string[];

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
