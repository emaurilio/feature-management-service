import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import type { UserData } from 'src/modules/common/utils/types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUXResearchDto {
  @IsNotEmpty({ message: 'UX Research Name is required' })
  @IsString({ message: 'UX Research Name must be a string' })
  name: string;

  @IsNumber({ maxDecimalPlaces: 0 })
  page?: number = 1;

  @IsNumber({ maxDecimalPlaces: 0 })
  limit?: number = 10;

  //The field User Data must be a object with data by user that search for UX Research
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
