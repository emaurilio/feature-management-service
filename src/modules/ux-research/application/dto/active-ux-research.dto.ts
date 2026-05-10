import { Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsUXResearchPresent } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';
import type { UserData } from 'src/modules/common/utils/types/user-data.type';

export class ActiveUXResearchDto {
  @Expose({ name: 'ux_research_name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @IsUXResearchPresent({ message: 'UX Research not found' })
  uxResearchName: string;

  //The field User Data must be a object with data by user that create this UX Research
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
