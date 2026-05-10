import { UXResearchResponseMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research-response.mapper';
import { UXResearchResponseEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research-response.entity';
import { UXResearchResponse } from 'src/modules/ux-research/domain/entites/UXResearchResponse';

describe('UXResearchResponseMapper', () => {
  describe('toDomain', () => {
    it('should map entity to domain correctly with all fields', () => {
      const entity: UXResearchResponseEntity = {
        id: 'response-1',
        response: { rating: 5, feedback: 'Great experience!' },
        responseDate: new Date('2023-01-15T10:30:00Z'),
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
        companyId: 'company-1',
        createdAt: new Date('2023-01-15T10:00:00Z'),
        updatedAt: new Date('2023-01-15T10:30:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const result = UXResearchResponseMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearchResponse);
      expect(result.id).toBe('response-1');
      expect(result.response).toEqual({ rating: 5, feedback: 'Great experience!' });
      expect(result.responseDate).toEqual(new Date('2023-01-15T10:30:00Z'));
      expect(result.uxResearchId).toBe('ux-research-1');
      expect(result.userId).toBe('user-1');
      expect(result.companyId).toBe('company-1');
    });

    it('should map entity to domain correctly with only required fields', () => {
      const entity: UXResearchResponseEntity = {
        id: 'response-2',
        response: { satisfied: true },
        responseDate: new Date('2023-02-20T14:15:00Z'),
        uxResearchId: 'ux-research-2',
        userId: null,
        companyId: null,
        createdAt: new Date('2023-02-20T14:00:00Z'),
        updatedAt: new Date('2023-02-20T14:15:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const result = UXResearchResponseMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearchResponse);
      expect(result.id).toBe('response-2');
      expect(result.response).toEqual({ satisfied: true });
      expect(result.responseDate).toEqual(new Date('2023-02-20T14:15:00Z'));
      expect(result.uxResearchId).toBe('ux-research-2');
      expect(result.userId).toBe(null);
      expect(result.companyId).toBe(null);
    });

    it('should map entity to domain correctly without id', () => {
      const entity: UXResearchResponseEntity = {
        id: null,
        response: { score: 8 },
        responseDate: new Date('2023-03-10T09:45:00Z'),
        uxResearchId: 'ux-research-3',
        userId: 'user-3',
        companyId: null,
        createdAt: new Date('2023-03-10T09:30:00Z'),
        updatedAt: new Date('2023-03-10T09:45:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const result = UXResearchResponseMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearchResponse);
      expect(result.id).toBe(null);
      expect(result.response).toEqual({ score: 8 });
      expect(result.responseDate).toEqual(new Date('2023-03-10T09:45:00Z'));
      expect(result.uxResearchId).toBe('ux-research-3');
      expect(result.userId).toBe('user-3');
      expect(result.companyId).toBe(null);
    });

    it('should work with different response types', () => {
      const entity: UXResearchResponseEntity = {
        id: 'response-4',
        response: 'Simple string response',
        responseDate: new Date('2023-04-05T16:20:00Z'),
        uxResearchId: 'ux-research-4',
        userId: null,
        companyId: 'company-4',
        createdAt: new Date('2023-04-05T16:00:00Z'),
        updatedAt: new Date('2023-04-05T16:20:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const result = UXResearchResponseMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearchResponse);
      expect(result.response).toBe('Simple string response');
      expect(result.userId).toBe(null);
      expect(result.companyId).toBe('company-4');
    });

    it('should throw error when entity is null', () => {
      const entity = null as any;

      expect(() => UXResearchResponseMapper.toDomain(entity)).toThrow('Cannot read properties of null');
    });

    it('should throw error when entity is undefined', () => {
      const entity = undefined as any;

      expect(() => UXResearchResponseMapper.toDomain(entity)).toThrow('Cannot read properties of undefined');
    });

    it('should work with empty response object', () => {
      const entity: UXResearchResponseEntity = {
        id: 'response-5',
        response: {},
        responseDate: new Date('2023-05-01T12:00:00Z'),
        uxResearchId: 'ux-research-5',
        userId: '',
        companyId: '',
        createdAt: new Date('2023-05-01T11:50:00Z'),
        updatedAt: new Date('2023-05-01T12:00:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const result = UXResearchResponseMapper.toDomain(entity);

      expect(result).toBeInstanceOf(UXResearchResponse);
      expect(result.response).toEqual({});
      expect(result.userId).toBe('');
      expect(result.companyId).toBe('');
    });
  });

  describe('toEntity', () => {
    it('should map domain to entity correctly with all fields', () => {
      const domain = new UXResearchResponse(
        { rating: 5, feedback: 'Great experience!' },
        new Date('2023-01-15T10:30:00Z'),
        'ux-research-1',
        'user-1',
        'company-1',
        'response-1',
      );

      const result = UXResearchResponseMapper.toEntity(domain);

      expect(result).toEqual({
        id: 'response-1',
        response: { rating: 5, feedback: 'Great experience!' },
        responseDate: new Date('2023-01-15T10:30:00Z'),
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
        companyId: 'company-1',
      });
    });

    it('should map domain to entity correctly with only required fields', () => {
      const domain = new UXResearchResponse(
        { satisfied: true },
        new Date('2023-02-20T14:15:00Z'),
        'ux-research-2',
      );

      const result = UXResearchResponseMapper.toEntity(domain);

      expect(result).toEqual({
        id: undefined,
        response: { satisfied: true },
        responseDate: new Date('2023-02-20T14:15:00Z'),
        uxResearchId: 'ux-research-2',
        userId: undefined,
        companyId: undefined,
      });
    });

    it('should map domain to entity correctly with only userId', () => {
      const domain = new UXResearchResponse(
        { score: 8 },
        new Date('2023-03-10T09:45:00Z'),
        'ux-research-3',
        'user-3',
      );

      const result = UXResearchResponseMapper.toEntity(domain);

      expect(result).toEqual({
        id: undefined,
        response: { score: 8 },
        responseDate: new Date('2023-03-10T09:45:00Z'),
        uxResearchId: 'ux-research-3',
        userId: 'user-3',
        companyId: undefined,
      });
    });

    it('should map domain to entity correctly with only companyId', () => {
      const domain = new UXResearchResponse(
        'Simple string response',
        new Date('2023-04-05T16:20:00Z'),
        'ux-research-4',
        undefined,
        'company-4',
      );

      const result = UXResearchResponseMapper.toEntity(domain);

      expect(result).toEqual({
        id: undefined,
        response: 'Simple string response',
        responseDate: new Date('2023-04-05T16:20:00Z'),
        uxResearchId: 'ux-research-4',
        userId: undefined,
        companyId: 'company-4',
      });
    });

    it('should work with different response types', () => {
      const domain = new UXResearchResponse(
        [1, 2, 3, 4, 5],
        new Date('2023-06-15T11:30:00Z'),
        'ux-research-6',
        'user-6',
        'company-6',
        'response-6',
      );

      const result = UXResearchResponseMapper.toEntity(domain);

      expect(result).toEqual({
        id: 'response-6',
        response: [1, 2, 3, 4, 5],
        responseDate: new Date('2023-06-15T11:30:00Z'),
        uxResearchId: 'ux-research-6',
        userId: 'user-6',
        companyId: 'company-6',
      });
    });

    it('should throw error when domain is null', () => {
      const domain = null as any;

      expect(() => UXResearchResponseMapper.toEntity(domain)).toThrow('Cannot read properties of null');
    });

    it('should throw error when domain is undefined', () => {
      const domain = undefined as any;

      expect(() => UXResearchResponseMapper.toEntity(domain)).toThrow('Cannot read properties of undefined');
    });

    it('should work with empty response object', () => {
      const domain = new UXResearchResponse(
        {},
        new Date('2023-07-01T13:45:00Z'),
        'ux-research-7',
        '',
        '',
        'response-7',
      );

      const result = UXResearchResponseMapper.toEntity(domain);

      expect(result).toEqual({
        id: 'response-7',
        response: {},
        responseDate: new Date('2023-07-01T13:45:00Z'),
        uxResearchId: 'ux-research-7',
        userId: '',
        companyId: '',
      });
    });
  });

  describe('round-trip mapping', () => {
    it('should maintain data integrity through round-trip mapping with all fields', () => {
      const originalDomain = new UXResearchResponse(
        { rating: 5, feedback: 'Excellent!' },
        new Date('2023-01-15T10:30:00Z'),
        'ux-research-1',
        'user-1',
        'company-1',
        'response-1',
      );

      const entity = UXResearchResponseMapper.toEntity(originalDomain);
      
      const mockEntity: UXResearchResponseEntity = {
        ...entity,
        createdAt: new Date('2023-01-15T10:00:00Z'),
        updatedAt: new Date('2023-01-15T10:30:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const mappedBackDomain = UXResearchResponseMapper.toDomain(mockEntity);

      expect(mappedBackDomain.id).toBe(originalDomain.id);
      expect(mappedBackDomain.response).toEqual(originalDomain.response);
      expect(mappedBackDomain.responseDate).toEqual(originalDomain.responseDate);
      expect(mappedBackDomain.uxResearchId).toBe(originalDomain.uxResearchId);
      expect(mappedBackDomain.userId).toBe(originalDomain.userId);
      expect(mappedBackDomain.companyId).toBe(originalDomain.companyId);
    });

    it('should handle round-trip mapping with only required fields', () => {
      const originalDomain = new UXResearchResponse(
        { satisfied: true },
        new Date('2023-02-20T14:15:00Z'),
        'ux-research-2',
      );

      const entity = UXResearchResponseMapper.toEntity(originalDomain);
      
      const mockEntity: UXResearchResponseEntity = {
        ...entity,
        createdAt: new Date('2023-02-20T14:00:00Z'),
        updatedAt: new Date('2023-02-20T14:15:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const mappedBackDomain = UXResearchResponseMapper.toDomain(mockEntity);

      expect(mappedBackDomain.response).toEqual(originalDomain.response);
      expect(mappedBackDomain.responseDate).toEqual(originalDomain.responseDate);
      expect(mappedBackDomain.uxResearchId).toBe(originalDomain.uxResearchId);
      expect(mappedBackDomain.userId).toBe(originalDomain.userId);
      expect(mappedBackDomain.companyId).toBe(originalDomain.companyId);
    });

    it('should handle round-trip mapping with complex response data', () => {
      const complexResponse = {
        ratings: {
          usability: 5,
          design: 4,
          functionality: 5,
        },
        comments: [
          'Very intuitive interface',
          'Love the new features',
          'Could use more customization options'
        ],
        metadata: {
          browser: 'Chrome',
          version: '120.0.0.0',
          screenResolution: '1920x1080'
        }
      };

      const originalDomain = new UXResearchResponse(
        complexResponse,
        new Date('2023-08-10T15:45:00Z'),
        'ux-research-8',
        'user-8',
        undefined,
        'response-8',
      );

      const entity = UXResearchResponseMapper.toEntity(originalDomain);
      
      const mockEntity: UXResearchResponseEntity = {
        ...entity,
        createdAt: new Date('2023-08-10T15:30:00Z'),
        updatedAt: new Date('2023-08-10T15:45:00Z'),
        deletedAt: undefined,
      } as unknown as UXResearchResponseEntity;

      const mappedBackDomain = UXResearchResponseMapper.toDomain(mockEntity);

      expect(mappedBackDomain.response).toEqual(complexResponse);
      expect(mappedBackDomain.userId).toBe(originalDomain.userId);
      expect(mappedBackDomain.companyId).toBe(originalDomain.companyId);
    });
  });
});