import { UXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research.mapper';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('UXResearchMapper', () => {
  describe('toDomain', () => {
    it('should map entity to domain correctly', () => {
      const entity: UXResearchEntity = {
        id: 'ux-research-1',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
        percentage: 100,
        version: 1,
        isActive: true,
        type: 'percentage' as UXResearchType,
        featureFlagName: 'feature-1',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        featureFlag: undefined,
        enable: true,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-02T10:00:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchEntity;

      const result = UXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearch);
      expect(result.id).toBe('ux-research-1');
      expect(result.nameVersion).toBe('test-v1');
      expect(result.name).toBe('Test UX Research');
      expect(result.percentage).toBe(100);
      expect(result.version).toBe(1);
      expect(result.isActive).toBe(true);
      expect(result.type).toBe('percentage');
      expect(result.featureFlagName).toBe('feature-1');
      expect(result.startDate).toEqual(new Date('2023-01-01'));
      expect(result.endDate).toEqual(new Date('2023-01-31'));
      expect(result.createdAt).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(result.updatedAt).toEqual(new Date('2023-01-02T10:00:00Z'));
      expect(result.deletedAt).toBeUndefined();
    });

    it('should map entity to domain correctly with optional fields', () => {
      const entity: UXResearchEntity = {
        id: 'ux-research-2',
        nameVersion: 'test-v2',
        name: 'Test UX Research 2',
        percentage: 50,
        version: 2,
        isActive: false,
        type: 'company' as UXResearchType,
        featureFlagName: undefined,
        startDate: undefined,
        endDate: undefined,
        featureFlag: undefined,
        enable: false,
        createdAt: new Date('2023-02-01T10:00:00Z'),
        updatedAt: new Date('2023-02-02T10:00:00Z'),
        deletedAt: new Date('2023-02-03T10:00:00Z'),
      } as unknown as UXResearchEntity;

      const result = UXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearch);
      expect(result.id).toBe('ux-research-2');
      expect(result.nameVersion).toBe('test-v2');
      expect(result.name).toBe('Test UX Research 2');
      expect(result.percentage).toBe(50);
      expect(result.version).toBe(2);
      expect(result.isActive).toBe(false);
      expect(result.type).toBe('company');
      expect(result.featureFlagName).toBeUndefined();
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
      expect(result.createdAt).toEqual(new Date('2023-02-01T10:00:00Z'));
      expect(result.updatedAt).toEqual(new Date('2023-02-02T10:00:00Z'));
      expect(result.deletedAt).toEqual(new Date('2023-02-03T10:00:00Z'));
    });

    it('should work with different UX research types', () => {
      const entity: UXResearchEntity = {
        id: 'ux-research-3',
        nameVersion: 'user-v1',
        name: 'User UX Research',
        percentage: 75,
        version: 1,
        isActive: true,
        type: 'user' as UXResearchType,
        featureFlagName: 'feature-2',
        startDate: new Date('2023-03-01'),
        endDate: new Date('2023-03-31'),
        featureFlag: undefined,
        enable: true,
        createdAt: new Date('2023-03-01T10:00:00Z'),
        updatedAt: new Date('2023-03-02T10:00:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchEntity;

      const result = UXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearch);
      expect(result.type).toBe('user');
      expect(result.name).toBe('User UX Research');
    });

    it('should throw error when entity is null', () => {
      const entity = null as any;

      expect(() => UXResearchMapper.toDomain(entity)).toThrow('Cannot read properties of null');
    });

    it('should throw error when entity is undefined', () => {
      const entity = undefined as any;

      expect(() => UXResearchMapper.toDomain(entity)).toThrow('Cannot read properties of undefined');
    });

    it('should work with empty strings', () => {
      const entity: UXResearchEntity = {
        id: '',
        nameVersion: '',
        name: '',
        percentage: 0,
        version: 0,
        isActive: false,
        type: 'percentage' as UXResearchType,
        featureFlagName: '',
        startDate: new Date(),
        endDate: new Date(),
        featureFlag: undefined,
        enable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as unknown as UXResearchEntity;

      const result = UXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearch);
      expect(result.id).toBe('');
      expect(result.nameVersion).toBe('');
      expect(result.name).toBe('');
    });
  });

  describe('toPersistence', () => {
    it('should map domain to persistence correctly', () => {
      const domain = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as UXResearchType,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const result = UXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'ux-research-1',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
        percentage: 100,
        version: 1,
        isActive: true,
        type: 'percentage',
        featureFlagName: 'feature-1',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-02T10:00:00Z'),
        deletedAt: undefined,
      });
    });

    it('should map domain to persistence correctly with optional fields', () => {
      const domain = new UXResearch(
        'test-v2',
        'Test UX Research 2',
        50,
        2,
        false,
        'company' as UXResearchType,
        undefined,
        undefined,
        undefined,
        'ux-research-2',
        new Date('2023-02-01T10:00:00Z'),
        new Date('2023-02-02T10:00:00Z'),
        new Date('2023-02-03T10:00:00Z'),
      );

      const result = UXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'ux-research-2',
        nameVersion: 'test-v2',
        name: 'Test UX Research 2',
        percentage: 50,
        version: 2,
        isActive: false,
        type: 'company',
        featureFlagName: undefined,
        startDate: undefined,
        endDate: undefined,
        createdAt: new Date('2023-02-01T10:00:00Z'),
        updatedAt: new Date('2023-02-02T10:00:00Z'),
        deletedAt: new Date('2023-02-03T10:00:00Z'),
      });
    });

    it('should map domain to persistence correctly without id', () => {
      const domain = new UXResearch(
        'test-v3',
        'Test UX Research 3',
        75,
        3,
        true,
        'user' as UXResearchType,
        'feature-3',
        new Date('2023-03-01'),
        new Date('2023-03-31'),
      );

      const result = UXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: undefined,
        nameVersion: 'test-v3',
        name: 'Test UX Research 3',
        percentage: 75,
        version: 3,
        isActive: true,
        type: 'user',
        featureFlagName: 'feature-3',
        startDate: new Date('2023-03-01'),
        endDate: new Date('2023-03-31'),
        createdAt: undefined,
        updatedAt: undefined,
        deletedAt: undefined,
      });
    });

    it('should handle null deletedAt correctly', () => {
      const domain = new UXResearch(
        'test-v4',
        'Test UX Research 4',
        25,
        4,
        true,
        'user_percentage' as UXResearchType,
        'feature-4',
        new Date('2023-04-01'),
        new Date('2023-04-30'),
        'ux-research-4',
        new Date('2023-04-01T10:00:00Z'),
        new Date('2023-04-02T10:00:00Z'),
        undefined,
      );

      const result = UXResearchMapper.toPersistence(domain);

      expect(result.deletedAt).toBeUndefined();
    });

    it('should throw error when domain is null', () => {
      const domain = null as any;

      expect(() => UXResearchMapper.toPersistence(domain)).toThrow('Cannot read properties of null');
    });

    it('should throw error when domain is undefined', () => {
      const domain = undefined as any;

      expect(() => UXResearchMapper.toPersistence(domain)).toThrow('Cannot read properties of undefined');
    });

    it('should work with empty strings', () => {
      const fixedDate = new Date('2023-01-01T00:00:00Z');
      const domain = new UXResearch('', '', 0, 0, false, 'percentage' as UXResearchType, '', fixedDate, fixedDate, '', fixedDate, fixedDate);

      const result = UXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: '',
        nameVersion: '',
        name: '',
        percentage: 0,
        version: 0,
        isActive: false,
        type: 'percentage',
        featureFlagName: '',
        startDate: fixedDate,
        endDate: fixedDate,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        deletedAt: undefined,
      });
    });
  });

  describe('round-trip mapping', () => {
    it('should maintain data integrity through round-trip mapping', () => {
      const originalDomain = new UXResearch(
        'test-v1',
        'Test UX Research',
        100,
        1,
        true,
        'percentage' as UXResearchType,
        'feature-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'ux-research-1',
        new Date('2023-01-01T10:00:00Z'),
        new Date('2023-01-02T10:00:00Z'),
        undefined,
      );

      const persistence = UXResearchMapper.toPersistence(originalDomain);
      
      const mockEntity: UXResearchEntity = {
        ...persistence,
        featureFlag: undefined,
        enable: true,
      } as unknown as UXResearchEntity;

      const mappedBackDomain = UXResearchMapper.toDomain(mockEntity);

      expect(mappedBackDomain.id).toBe(originalDomain.id);
      expect(mappedBackDomain.nameVersion).toBe(originalDomain.nameVersion);
      expect(mappedBackDomain.name).toBe(originalDomain.name);
      expect(mappedBackDomain.percentage).toBe(originalDomain.percentage);
      expect(mappedBackDomain.version).toBe(originalDomain.version);
      expect(mappedBackDomain.isActive).toBe(originalDomain.isActive);
      expect(mappedBackDomain.type).toBe(originalDomain.type);
      expect(mappedBackDomain.featureFlagName).toBe(originalDomain.featureFlagName);
      expect(mappedBackDomain.startDate).toEqual(originalDomain.startDate);
      expect(mappedBackDomain.endDate).toEqual(originalDomain.endDate);
      expect(mappedBackDomain.createdAt).toEqual(originalDomain.createdAt);
      expect(mappedBackDomain.updatedAt).toEqual(originalDomain.updatedAt);
      expect(mappedBackDomain.deletedAt).toBe(originalDomain.deletedAt);
    });

    it('should handle round-trip mapping without id', () => {
      const originalDomain = new UXResearch(
        'test-v2',
        'Test UX Research 2',
        50,
        2,
        false,
        'company' as UXResearchType,
        undefined,
        undefined,
        undefined,
      );

      const persistence = UXResearchMapper.toPersistence(originalDomain);
      
      const mockEntity: UXResearchEntity = {
        ...persistence,
        featureFlag: undefined,
        enable: false,
      } as unknown as UXResearchEntity;

      const mappedBackDomain = UXResearchMapper.toDomain(mockEntity);

      expect(mappedBackDomain.nameVersion).toBe(originalDomain.nameVersion);
      expect(mappedBackDomain.name).toBe(originalDomain.name);
      expect(mappedBackDomain.percentage).toBe(originalDomain.percentage);
      expect(mappedBackDomain.version).toBe(originalDomain.version);
      expect(mappedBackDomain.isActive).toBe(originalDomain.isActive);
      expect(mappedBackDomain.type).toBe(originalDomain.type);
      expect(mappedBackDomain.featureFlagName).toBe(originalDomain.featureFlagName);
      expect(mappedBackDomain.startDate).toBe(originalDomain.startDate);
      expect(mappedBackDomain.endDate).toBe(originalDomain.endDate);
    });

    it('should handle round-trip mapping with deletedAt', () => {
      const originalDomain = new UXResearch(
        'test-v3',
        'Test UX Research 3',
        75,
        3,
        true,
        'user' as UXResearchType,
        'feature-3',
        new Date('2023-03-01'),
        new Date('2023-03-31'),
        'ux-research-3',
        new Date('2023-03-01T10:00:00Z'),
        new Date('2023-03-02T10:00:00Z'),
        new Date('2023-03-03T10:00:00Z'),
      );

      const persistence = UXResearchMapper.toPersistence(originalDomain);
      
      const mockEntity: UXResearchEntity = {
        ...persistence,
        featureFlag: undefined,
        enable: true,
      } as unknown as UXResearchEntity;

      const mappedBackDomain = UXResearchMapper.toDomain(mockEntity);

      expect(mappedBackDomain.deletedAt).toEqual(originalDomain.deletedAt);
    });
  });
});