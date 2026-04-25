import { Test, TestingModule } from '@nestjs/testing';
import { ValidationArguments } from 'class-validator';
import * as classValidator from 'class-validator';
import {
  FeatureFlagExistsConstraint,
  IsFeatureFlagPresent,
} from 'src/feature-flag/infraestructure/validators/feature-flag-exists.validator';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';

jest.mock('class-validator', () => {
  const original = jest.requireActual('class-validator');
  return {
    ...original,
    registerDecorator: jest.fn(),
  };
});

describe('FeatureFlagExistsValidator', () => {
  let constraint: FeatureFlagExistsConstraint;
  let repository: jest.Mocked<FeatureFlagRepository>;

  beforeEach(async () => {
    const repositoryMock = {
      findByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagExistsConstraint,
        {
          provide: FeatureFlagRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    constraint = module.get<FeatureFlagExistsConstraint>(
      FeatureFlagExistsConstraint,
    );
    repository = module.get(FeatureFlagRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(constraint).toBeDefined();
  });

  describe('FeatureFlagExistsConstraint', () => {
    describe('validate', () => {
      it('should return true if feature flag exists', async () => {
        repository.findByName.mockResolvedValue({
          id: '1',
          name: 'existing-flag',
        } as any);

        const result = await constraint.validate('existing-flag');

        expect(result).toBe(true);
        expect(repository.findByName).toHaveBeenCalledWith('existing-flag');
        expect(repository.findByName).toHaveBeenCalledTimes(1);
      });

      it('should return false if feature flag does not exist', async () => {
        repository.findByName.mockResolvedValue(null);

        const result = await constraint.validate('non-existing-flag');

        expect(result).toBe(false);
        expect(repository.findByName).toHaveBeenCalledWith('non-existing-flag');
        expect(repository.findByName).toHaveBeenCalledTimes(1);
      });
    });

    describe('defaultMessage', () => {
      it('should return the correct default message', () => {
        const args = {
          value: 'test-flag',
          targetName: '',
          property: '',
          object: {},
          constraints: [],
        } as ValidationArguments;

        const message = constraint.defaultMessage(args);

        expect(message).toBe('Feature flag "test-flag" dont exists');
      });
    });
  });

  describe('IsFeatureFlagPresent decorator', () => {
    it('should call registerDecorator with correct options', () => {
      class TestClass {
        flagName: string;
      }

      const validationOptions = { each: true };

      const decorator = IsFeatureFlagPresent(validationOptions);
      decorator(TestClass.prototype, 'flagName');

      expect(classValidator.registerDecorator).toHaveBeenCalledWith(
        expect.objectContaining({
          target: TestClass.prototype.constructor,
          propertyName: 'flagName',
          options: validationOptions,
          constraints: [],
          validator: FeatureFlagExistsConstraint,
        }),
      );
    });
  });
});
