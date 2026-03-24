import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { FeatureFlagRepository } from '../persistence/repositories/feature-flag.repository';

@ValidatorConstraint({ name: 'FeatureFlagExists', async: true })
@Injectable()
export class FeatureFlagExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly repository: FeatureFlagRepository) {}

  async validate(name: string) {
    const flag = await this.repository.findByName(name);
    return !!flag;
  }

  defaultMessage(args: ValidationArguments) {
    return `Feature flag "${args.value}" dont exists`;
  }
}

export function IsFeatureFlagPresent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: FeatureFlagExistsConstraint,
    });
  };
}
