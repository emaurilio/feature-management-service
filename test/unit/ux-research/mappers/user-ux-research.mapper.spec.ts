import { UserUXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/user-ux-research.mapper';
import { UserUXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/user-ux-resarch.entity';
import { UserUXResearch } from 'src/modules/ux-research/domain/entites/UserUXResearch';

describe('UserUXResearchMapper', () => {
  describe('toDomain', () => {
    it('should map entity to domain correctly', () => {
      const entity: UserUXResearchEntity = {
        id: 'user-ux-research-1',
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      const result = UserUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UserUXResearch);
      expect(result.id).toBe('user-ux-research-1');
      expect(result.uxResearchId).toBe('ux-research-1');
      expect(result.userId).toBe('user-1');
    });

    it('should map entity without id to domain correctly', () => {
      const entity: UserUXResearchEntity = {
        id: 'user-ux-research-1',
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      const result = UserUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UserUXResearch);
      expect(result.id).toBe('user-ux-research-1');
      expect(result.uxResearchId).toBe('ux-research-1');
      expect(result.userId).toBe('user-1');
    });

    it('should throw error when entity is null', () => {
      const entity = null as any;

      expect(() => UserUXResearchMapper.toDomain(entity)).toThrow('Cannot read properties of null');
    });

    it('should throw error when entity is undefined', () => {
      const entity = undefined as any;

      expect(() => UserUXResearchMapper.toDomain(entity)).toThrow('Cannot read properties of undefined');
    });

    it('should work with different ID formats', () => {
      const entity: UserUXResearchEntity = {
        id: 'uuid-54321-09876-fedcba',
        uxResearchId: 'uuid-12345-67890-abcdef',
        userId: 'user-uuid-123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      const result = UserUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UserUXResearch);
      expect(result.id).toBe('uuid-54321-09876-fedcba');
      expect(result.uxResearchId).toBe('uuid-12345-67890-abcdef');
      expect(result.userId).toBe('user-uuid-123');
    });

    it('should work with empty strings', () => {
      const entity: UserUXResearchEntity = {
        id: '',
        uxResearchId: '',
        userId: '',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      const result = UserUXResearchMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UserUXResearch);
      expect(result.id).toBe('');
      expect(result.uxResearchId).toBe('');
      expect(result.userId).toBe('');
    });
  });

  describe('toPersistence', () => {
    it('should map domain to persistence correctly with id', () => {
      const domain = new UserUXResearch(
        'ux-research-1',
        'user-1',
        'user-ux-research-1',
      );

      const result = UserUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'user-ux-research-1',
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
      });
    });

    it('should map domain to persistence correctly without id', () => {
      const domain = new UserUXResearch(
        'ux-research-1',
        'user-1',
      );

      const result = UserUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: undefined,
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
      });
    });

    it('should throw error when domain is null', () => {
      const domain = null as any;

      expect(() => UserUXResearchMapper.toPersistence(domain)).toThrow('Cannot read properties of null');
    });

    it('should throw error when domain is undefined', () => {
      const domain = undefined as any;

      expect(() => UserUXResearchMapper.toPersistence(domain)).toThrow('Cannot read properties of undefined');
    });

    it('should work with different ID formats', () => {
      const domain = new UserUXResearch(
        'uuid-12345-67890-abcdef',
        'user-uuid-123',
        'uuid-54321-09876-fedcba',
      );

      const result = UserUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'uuid-54321-09876-fedcba',
        uxResearchId: 'uuid-12345-67890-abcdef',
        userId: 'user-uuid-123',
      });
    });

    it('should work with empty strings', () => {
      const domain = new UserUXResearch('', '', '');

      const result = UserUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: '',
        uxResearchId: '',
        userId: '',
      });
    });

    it('should work with mixed valid and empty values', () => {
      const domain = new UserUXResearch('ux-research-1', '', 'user-ux-research-1');

      const result = UserUXResearchMapper.toPersistence(domain);

      expect(result).toEqual({
        id: 'user-ux-research-1',
        uxResearchId: 'ux-research-1',
        userId: '',
      });
    });
  });

  describe('round-trip mapping', () => {
    it('should maintain data integrity through round-trip mapping', () => {
      const originalDomain = new UserUXResearch(
        'ux-research-1',
        'user-1',
        'user-ux-research-1',
      );

      const persistence = UserUXResearchMapper.toPersistence(originalDomain);
      
      const mockEntity: UserUXResearchEntity = {
        ...persistence,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      const mappedBackDomain = UserUXResearchMapper.toDomain(mockEntity);

      expect(mappedBackDomain.id).toBe(originalDomain.id);
      expect(mappedBackDomain.uxResearchId).toBe(originalDomain.uxResearchId);
      expect(mappedBackDomain.userId).toBe(originalDomain.userId);
    });

    it('should handle round-trip mapping without id', () => {
      const originalDomain = new UserUXResearch(
        'ux-research-1',
        'user-1',
      );

      const persistence = UserUXResearchMapper.toPersistence(originalDomain);
      
      const mockEntity: UserUXResearchEntity = {
        ...persistence,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      const mappedBackDomain = UserUXResearchMapper.toDomain(mockEntity);

      expect(mappedBackDomain.uxResearchId).toBe(originalDomain.uxResearchId);
      expect(mappedBackDomain.userId).toBe(originalDomain.userId);
    });
  });
});