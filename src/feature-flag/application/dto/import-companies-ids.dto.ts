import { Expose } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { IsFeatureFlagPresent } from 'src/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import type { UserData } from './types/user-data.type';

export class ImportCompaniesIdsDto {
  @Expose({ name: 'feature_flag_name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  featureFlagName: string;

  @Expose({ name: 'companies_ids' })
  @IsNotEmpty({ message: 'Feature Flag Companies IDs is required' })
  @IsArray({ message: 'Feature Flag Companies IDs must be an array' })
  companiesIds: string[];

  //The field User Data must be a object with data by user that import this feature flag
  @Expose({ name: 'user_data' })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
