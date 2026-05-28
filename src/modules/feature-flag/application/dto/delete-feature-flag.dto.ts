import { Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsFeatureFlagPresent } from 'src/modules/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import type { UserData } from '../../../common/utils/types/user-data.type';

export class DeleteFeatureFlagDto {
  @IsNotEmpty({ message: 'Feature Flag Name is required' })
  @IsString({ message: 'Feature Flag Name must be a string' })
  @IsFeatureFlagPresent({ message: 'Feature Flag not found' })
  name: string;

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
