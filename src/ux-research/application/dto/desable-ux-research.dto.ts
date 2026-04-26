import { Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import type { UserData } from './types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsUXResearchPresent } from 'src/ux-research/infraestructure/validators/ux-research-exists.validator';

export class DisableUXResearchDto {
  @Expose({ name: 'ux_research_name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @IsUXResearchPresent({ message: 'UX Research not found' })
  uxResearchName: string;

  //The field User Data must be a object with data by user that create this feature flag
  @Expose({ name: 'user_data' })
  @ApiProperty({
    example: {
      userId: 'string',
      email: 'string',
      name: 'string',
    },
  })
  @IsNotEmpty({ message: 'User data is required' })
  @IsObject({ message: 'User data must be an object' })
  userData: UserData;
}
