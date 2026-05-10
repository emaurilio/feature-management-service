import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { UXResearchRepository } from '../persistence/repositories/ux-research.repository';

@ValidatorConstraint({ name: 'UXResearchExists', async: true })
@Injectable()
export class UXResearchExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly repository: UXResearchRepository) { }

  async validate(name: string) {
    const uxResearch = await this.repository.findByName(name);
    return !!uxResearch;
  }

  defaultMessage(args: ValidationArguments) {
    return `UX Research "${args.value}" dont exists`;
  }
}

export function IsUXResearchPresent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: UXResearchExistsConstraint,
    });
  };
}
