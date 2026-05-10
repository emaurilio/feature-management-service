import { Expose } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  MinLength,
} from 'class-validator';
import type { UserData } from 'src/modules/common/utils/types/user-data.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsUXResearchPresent } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';

export class ImportUXResearchCompaniesIdsDto {
  @Expose({ name: 'ux_research_name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @IsUXResearchPresent({ message: 'UX Research not found' })
  uxResearchName: string;

  @Expose({ name: 'companies_ids' })
  @IsArray({ message: 'Companies IDs must be an array' })
  @ArrayMinSize(1, { message: 'Companies IDs is required' })
  @IsString({ each: true, message: 'Companies IDs must contain only strings' })
  @MinLength(1, { each: true, message: 'Each company ID must be a non-empty string' })
  companiesIds: string[];

  //The field User Data must be a object with data by user that import this UX Research
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
