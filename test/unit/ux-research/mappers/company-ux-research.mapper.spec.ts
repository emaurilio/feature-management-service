import { CompanyUXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/company-ux-research.mapper';
import { CompanyUXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/CompanyUXResearch.entity';
import { CompanyUXResearch } from 'src/modules/ux-research/domain/entites/CompanyUXResearch';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/UXResearch.entity';

describe('CompanyUXResearchMapper', () => {
  describe('toDomain', () => {
    it('should map entity to domain correctly', () => {
      const mockUXResearchEntity = {
        id: 'ux-research-1',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
        percentage: 100,
        version: 1,
        isActive: true,
        type: 'percentage',
        featureFlagName: 'feature-1',
        startDate: new Date(),
        endDate: new Date(),
        featureFlag: null,
        enable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as unknown as UXResearchEntity;

      const entity: CompanyUXResearchEntity = {
        id: 'company-ux-research-1',
        uxResearchId: 'ux-research-1',
        companyId: 'company-1',
        uxResearch: mockUXResearchEntity,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: new Date(),
      };

      const result = CompanyUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(CompanyUXResearch);
      expect(result.id).toBe('company-ux-research-1');
      expect(result.uxResearchId).toBe('ux-research-1');
      expect(result.companyId).toBe('company-1');
    });

    it('should map entity without id to domain correctly', () => {
      const mockUXResearchEntity = {
        id: 'ux-research-1',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
        percentage: 100,
        version: 1,
        isActive: true,
        type: 'percentage',
        featureFlagName: 'feature-1',
        startDate: new Date(),
        endDate: new Date(),
        featureFlag: null,
        enable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as unknown as UXResearchEntity;

      const entity: CompanyUXResearchEntity = {
        id: 'company-ux-research-1',
        uxResearchId: 'ux-research-1',
        companyId: 'company-1',
        uxResearch: mockUXResearchEntity,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: new Date(),
      };

      const result = CompanyUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(CompanyUXResearch);
      expect(result.id).toBe('company-ux-research-1');
      expect(result.uxResearchId).toBe('ux-research-1');
      expect(result.companyId).toBe('company-1');
    });

    it('should throw error when entity is null', () => {
      const entity = null as any;

      expect(() => CompanyUXResearchMapper.toDomain(entity)).toThrow('Cannot read properties of null');
    });

    it('should throw error when entity is undefined', () => {
      const entity = undefined as any;

      expect(() => CompanyUXResearchMapper.toDomain(entity)).toThrow('Cannot read properties of undefined');
    });

    it('should work with different ID formats', () => {
      const mockUXResearchEntity = {
        id: 'uuid-12345-67890-abcdef',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
        percentage: 100,
        version: 1,
        isActive: true,
        type: 'percentage',
        featureFlagName: 'feature-1',
        startDate: new Date(),
        endDate: new Date(),
        featureFlag: null,
        enable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as unknown as UXResearchEntity;

      const entity: CompanyUXResearchEntity = {
        id: 'uuid-54321-09876-fedcba',
        uxResearchId: 'uuid-12345-67890-abcdef',
        companyId: 'company-uuid-123',
        uxResearch: mockUXResearchEntity,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: new Date(),
      };

      const result = CompanyUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(CompanyUXResearch);
      expect(result.id).toBe('uuid-54321-09876-fedcba');
      expect(result.uxResearchId).toBe('uuid-12345-67890-abcdef');
      expect(result.companyId).toBe('company-uuid-123');
    });

    it('should work with empty strings', () => {
      const mockUXResearchEntity = {
        id: '',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
        percentage: 100,
        version: 1,
        isActive: true,
        type: 'percentage',
        featureFlagName: 'feature-1',
        startDate: new Date(),
        endDate: new Date(),
        featureFlag: null,
        enable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as unknown as UXResearchEntity;

      const entity: CompanyUXResearchEntity = {
        id: '',
        uxResearchId: '',
        companyId: '',
        uxResearch: mockUXResearchEntity,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: new Date(),
      };

      const result = CompanyUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(CompanyUXResearch);
      expect(result.id).toBe('');
      expect(result.uxResearchId).toBe('');
      expect(result.companyId).toBe('');
    });
  });

  describe('toPersistence', () => {
    it('should map domain to persistence correctly with id', () => {
      const domain = new CompanyUXResearch(
        'ux-research-1',
        'company-1',
        'company-ux-research-1',
      );

      const result = CompanyUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'company-ux-research-1',
        uxResearchId: 'ux-research-1',
        companyId: 'company-1',
      });
    });

    it('should map domain to persistence correctly without id', () => {
      const domain = new CompanyUXResearch(
        'ux-research-1',
        'company-1',
      );

      const result = CompanyUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: undefined,
        uxResearchId: 'ux-research-1',
        companyId: 'company-1',
      });
    });

    it('should throw error when domain is null', () => {
      const domain = null as any;

      expect(() => CompanyUXResearchMapper.toPersistence(domain)).toThrow('Cannot read properties of null');
    });

    it('should throw error when domain is undefined', () => {
      const domain = undefined as any;

      expect(() => CompanyUXResearchMapper.toPersistence(domain)).toThrow('Cannot read properties of undefined');
    });

    it('should work with different ID formats', () => {
      const domain = new CompanyUXResearch(
        'uuid-12345-67890-abcdef',
        'company-uuid-123',
        'uuid-54321-09876-fedcba',
      );

      const result = CompanyUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'uuid-54321-09876-fedcba',
        uxResearchId: 'uuid-12345-67890-abcdef',
        companyId: 'company-uuid-123',
      });
    });

    it('should work with empty strings', () => {
      const domain = new CompanyUXResearch('', '', '');

      const result = CompanyUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: '',
        uxResearchId: '',
        companyId: '',
      });
    });

    it('should work with mixed valid and empty values', () => {
      const domain = new CompanyUXResearch('ux-research-1', '', 'company-ux-research-1');

      const result = CompanyUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'company-ux-research-1',
        uxResearchId: 'ux-research-1',
        companyId: '',
      });
    });
  });

  describe('round-trip mapping', () => {
    it('should maintain data integrity through round-trip mapping', () => {
      const originalDomain = new CompanyUXResearch(
        'ux-research-1',
        'company-1',
        'company-ux-research-1',
      );

      const persistence = CompanyUXResearchMapper.toPersistence(originalDomain);
      
      const mockEntity: CompanyUXResearchEntity = {
        ...persistence,
        uxResearch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as unknown as CompanyUXResearchEntity;

      const mappedBackDomain = CompanyUXResearchMapper.toDomain(mockEntity);

      expect(mappedBackDomain.id).toBe(originalDomain.id);
      expect(mappedBackDomain.uxResearchId).toBe(originalDomain.uxResearchId);
      expect(mappedBackDomain.companyId).toBe(originalDomain.companyId);
    });

    it('should handle round-trip mapping without id', () => {
      const originalDomain = new CompanyUXResearch(
        'ux-research-1',
        'company-1',
      );

      const persistence = CompanyUXResearchMapper.toPersistence(originalDomain);
      
      const mockEntity: CompanyUXResearchEntity = {
        ...persistence,
        uxResearch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      } as unknown as CompanyUXResearchEntity;

      const mappedBackDomain = CompanyUXResearchMapper.toDomain(mockEntity);

      expect(mappedBackDomain.uxResearchId).toBe(originalDomain.uxResearchId);
      expect(mappedBackDomain.companyId).toBe(originalDomain.companyId);
    });
  });
});