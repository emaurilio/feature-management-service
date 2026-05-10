import { Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import type { UserData } from 'src/modules/common/utils/types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsUXResearchPresent } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';

export class DeleteUXResearchDto {
  @IsNotEmpty({ message: 'UX Research Name is required' })
  @IsString({ message: 'UX Research Name must be a string' })
  @IsUXResearchPresent({ message: 'UX Research not found' })
  name: string;

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
