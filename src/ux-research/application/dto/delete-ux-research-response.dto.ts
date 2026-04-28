import { Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import type { UserData } from 'src/common/utils/types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteUXResearchResponseDto {
  @Expose({ name: 'ux_research_response_id' })
  @IsNotEmpty({ message: 'UX Research Name is required' })
  @IsString({ message: 'UX Research Name must be a string' })
  uxResponseId: string;

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
