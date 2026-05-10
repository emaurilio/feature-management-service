import { Test, TestingModule } from '@nestjs/testing';
import { UXResearchExistsConstraint } from 'src/modules/ux-research/infraestructure/validators/ux-research-exists.validator';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { ValidationArguments } from 'class-validator';

describe('UXResearchExistsConstraint', () => {
  let constraint: UXResearchExistsConstraint;
  let repository: jest.Mocked<UXResearchRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UXResearchExistsConstraint,
        {
          provide: UXResearchRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    constraint = module.get<UXResearchExistsConstraint>(UXResearchExistsConstraint);
    repository = module.get(UXResearchRepository) as jest.Mocked<UXResearchRepository>;
  });

  it('should be defined', () => {
    expect(constraint).toBeDefined();
  });

  describe('validate', () => {
    it('should return true when UX research exists', async () => {
      const name = 'Test UX Research';
      const mockUXResearch = new UXResearch(
        'test-v1',
        name,
        100,
        1,
        true,
        'percentage' as any,
        'feature-1',
        new Date(),
        new Date(),
        '1',
        new Date(),
        new Date(),
        undefined,
      );

      repository.findByName.mockResolvedValue(mockUXResearch);

      const result = await constraint.validate(name);

      expect(repository.findByName).toHaveBeenCalledWith(name);
      expect(result).toBe(true);
    });

    it('should return false when UX research does not exist', async () => {
      const name = 'Non-existent UX Research';

      repository.findByName.mockResolvedValue(null);

      const result = await constraint.validate(name);

      expect(repository.findByName).toHaveBeenCalledWith(name);
      expect(result).toBe(false);
    });

    it('should handle repository errors gracefully', async () => {
      const name = 'Test UX Research';
      const error = new Error('Database connection failed');

      repository.findByName.mockRejectedValue(error);

      await expect(constraint.validate(name)).rejects.toThrow('Database connection failed');

      expect(repository.findByName).toHaveBeenCalledWith(name);
    });

    it('should work with empty string name', async () => {
      const name = '';

      repository.findByName.mockResolvedValue(null);

      const result = await constraint.validate(name);

      expect(repository.findByName).toHaveBeenCalledWith('');
      expect(result).toBe(false);
    });

    it('should work with null name', async () => {
      const name = null as any;

      repository.findByName.mockResolvedValue(null);

      const result = await constraint.validate(name);

      expect(repository.findByName).toHaveBeenCalledWith(null);
      expect(result).toBe(false);
    });

    it('should work with undefined name', async () => {
      const name = undefined as any;

      repository.findByName.mockResolvedValue(null);

      const result = await constraint.validate(name);

      expect(repository.findByName).toHaveBeenCalledWith(undefined);
      expect(result).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return correct default message', () => {
      const args: ValidationArguments = {
        value: 'Test UX Research',
        constraints: [],
        targetName: 'TestClass',
        object: {},
        property: 'name',
      } as ValidationArguments;

      const result = constraint.defaultMessage(args);

      expect(result).toBe('UX Research "Test UX Research" dont exists');
    });

    it('should handle different value types', () => {
      const args: ValidationArguments = {
        value: 123,
        constraints: [],
        targetName: 'TestClass',
        object: {},
        property: 'name',
      } as ValidationArguments;

      const result = constraint.defaultMessage(args);

      expect(result).toBe('UX Research "123" dont exists');
    });

    it('should handle null value', () => {
      const args: ValidationArguments = {
        value: null,
        constraints: [],
        targetName: 'TestClass',
        object: {},
        property: 'name',
      } as ValidationArguments;

      const result = constraint.defaultMessage(args);

      expect(result).toBe('UX Research "null" dont exists');
    });

    it('should handle undefined value', () => {
      const args: ValidationArguments = {
        value: undefined,
        constraints: [],
        targetName: 'TestClass',
        object: {},
        property: 'name',
      } as ValidationArguments;

      const result = constraint.defaultMessage(args);

      expect(result).toBe('UX Research "undefined" dont exists');
    });
  });
});

describe('IsUXResearchPresent', () => {
  it('should be a function', () => {
    const { IsUXResearchPresent } = require('src/modules/ux-research/infraestructure/validators/ux-research-exists.validator');
    
    expect(typeof IsUXResearchPresent).toBe('function');
  });

  it('should return a decorator function', () => {
    const { IsUXResearchPresent } = require('src/modules/ux-research/infraestructure/validators/ux-research-exists.validator');
    
    const decorator = IsUXResearchPresent();
    expect(typeof decorator).toBe('function');
  });

  it('should work with validation options', () => {
    const { IsUXResearchPresent } = require('src/modules/ux-research/infraestructure/validators/ux-research-exists.validator');
    
    const validationOptions = { message: 'Custom message' };
    const decorator = IsUXResearchPresent(validationOptions);
    expect(typeof decorator).toBe('function');
  });

  it('should register decorator correctly', () => {
    const { IsUXResearchPresent } = require('src/modules/ux-research/infraestructure/validators/ux-research-exists.validator');
    
    class TestClass {
      name!: string;
    }

    const decorator = IsUXResearchPresent();
    decorator(TestClass.prototype, 'name');

    expect(typeof decorator).toBe('function');
    
    expect(() => decorator(TestClass.prototype, 'name')).not.toThrow();
  });
});