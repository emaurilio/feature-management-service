import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckUXResearchValidateDto {
  @IsNotEmpty({ message: 'UX Research Name is required' })
  @IsString({ message: 'UX Research Name must be a string' })
  name: string;

  @Expose({ name: 'user_id' })
  @IsString({ message: 'User id must be a string' })
  @IsOptional()
  userId?: string;

  @Expose({ name: 'company_id' })
  @IsString({ message: 'Company id must be a string' })
  @IsOptional()
  companyId?: string;
}
