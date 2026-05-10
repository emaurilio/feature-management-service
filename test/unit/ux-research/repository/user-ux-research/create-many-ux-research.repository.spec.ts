import { UserUXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/user-ux-research.repository';
import { UserUXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/user-ux-resarch.entity';
import { UserUXResearch } from 'src/modules/ux-research/domain/entites/UserUXResearch';
import { UserUXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/user-ux-research.mapper';
import { DataSource } from 'typeorm';

describe('UserUXResearchRepository', () => {
  let repository: UserUXResearchRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    jest.restoreAllMocks();
    dataSource = {
      createEntityManager: jest.fn(),
    } as any;

    repository = new UserUXResearchRepository(dataSource);
    jest.clearAllMocks();
  });

  describe('createMany', () => {
    it('should create multiple user UX researches successfully', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('ux-research-1', 'user-1', 'user-ux-research-1'),
        new UserUXResearch('ux-research-2', 'user-2', 'user-ux-research-2'),
        new UserUXResearch('ux-research-3', 'user-3', 'user-ux-research-3'),
      ];

      const mockSavedEntities: UserUXResearchEntity[] = [
        {
          id: 'user-ux-research-1',
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
        {
          id: 'user-ux-research-2',
          uxResearchId: 'ux-research-2',
          userId: 'user-2',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
        {
          id: 'user-ux-research-3',
          uxResearchId: 'ux-research-3',
          userId: 'user-3',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
      ];

      jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntities.map(entity => 
        new UserUXResearch(entity.uxResearchId, entity.userId, entity.id)
      ) as any);

      const result = await repository.createMany(userUXResearches);

      expect(repository.save).toHaveBeenCalledWith([
        {
          id: 'user-ux-research-1',
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
        },
        {
          id: 'user-ux-research-2',
          uxResearchId: 'ux-research-2',
          userId: 'user-2',
        },
        {
          id: 'user-ux-research-3',
          uxResearchId: 'ux-research-3',
          userId: 'user-3',
        },
      ]);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(UserUXResearch);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].uxResearchId).toBe('ux-research-1');
      expect(result[0].id).toBe('user-ux-research-1');
    });

    it('should create multiple user UX researches without IDs', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('ux-research-1', 'user-1'),
        new UserUXResearch('ux-research-2', 'user-2'),
      ];

      const mockSavedEntities: UserUXResearchEntity[] = [
        {
          id: 'generated-id-1',
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
        {
          id: 'generated-id-2',
          uxResearchId: 'ux-research-2',
          userId: 'user-2',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
      ];

      jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntities.map(entity => 
        new UserUXResearch(entity.uxResearchId, entity.userId, entity.id)
      ) as any);

      const result = await repository.createMany(userUXResearches);

      expect(repository.save).toHaveBeenCalledWith([
        {
          id: undefined,
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
        },
        {
          id: undefined,
          uxResearchId: 'ux-research-2',
          userId: 'user-2',
        },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('generated-id-1');
      expect(result[1].id).toBe('generated-id-2');
    });

    it('should handle empty array', async () => {
      jest.spyOn(repository, 'save').mockResolvedValue([] as any);

      const result = await repository.createMany([]);

      expect(repository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should handle single item array', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('ux-research-1', 'user-1', 'user-ux-research-1'),
      ];

      const mockSavedEntity: UserUXResearchEntity = {
        id: 'user-ux-research-1',
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      jest.spyOn(repository, 'save').mockResolvedValue([new UserUXResearch(
        mockSavedEntity.uxResearchId, 
        mockSavedEntity.userId, 
        mockSavedEntity.id
      )] as any);

      const result = await repository.createMany(userUXResearches);

      expect(repository.save).toHaveBeenCalledWith([
        {
          id: 'user-ux-research-1',
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should handle database errors', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('ux-research-1', 'user-1'),
      ];

      const databaseError = new Error('Database connection failed');
      jest.spyOn(repository, 'save').mockRejectedValue(databaseError);

      await expect(repository.createMany(userUXResearches)).rejects.toThrow('Database connection failed');

      expect(repository.save).toHaveBeenCalledWith([
        {
          id: undefined,
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
        },
      ]);
    });

    it('should handle mapper errors', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('ux-research-1', 'user-1'),
      ];

      jest.spyOn(UserUXResearchMapper, 'toPersistence').mockImplementation(() => {
        throw new Error('Mapper error');
      });

      await expect(repository.createMany(userUXResearches)).rejects.toThrow('Mapper error');

      expect(UserUXResearchMapper.toPersistence).toHaveBeenCalledWith(userUXResearches[0]);
    });

    it('should work with different ID formats', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('uuid-12345-67890-abcdef', 'user-uuid-123', 'uuid-54321-09876-fedcba'),
      ];

      const mockSavedEntity: UserUXResearchEntity = {
        id: 'uuid-54321-09876-fedcba',
        uxResearchId: 'uuid-12345-67890-abcdef',
        userId: 'user-uuid-123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      jest.spyOn(repository, 'save').mockResolvedValue([new UserUXResearch(
        mockSavedEntity.uxResearchId, 
        mockSavedEntity.userId, 
        mockSavedEntity.id
      )] as any);

      const result = await repository.createMany(userUXResearches);

      expect(repository.save).toHaveBeenCalledWith([
        {
          id: 'uuid-54321-09876-fedcba',
          uxResearchId: 'uuid-12345-67890-abcdef',
          userId: 'user-uuid-123',
        },
      ]);
      expect(result[0].userId).toBe('user-uuid-123');
      expect(result[0].uxResearchId).toBe('uuid-12345-67890-abcdef');
    });

    it('should work with empty strings', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('', '', ''),
      ];

      const mockSavedEntity: UserUXResearchEntity = {
        id: '',
        uxResearchId: '',
        userId: '',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      jest.spyOn(repository, 'save').mockResolvedValue([new UserUXResearch(
        mockSavedEntity.uxResearchId, 
        mockSavedEntity.userId, 
        mockSavedEntity.id
      )] as any);

      const result = await repository.createMany(userUXResearches);

      expect(repository.save).toHaveBeenCalledWith([
        {
          id: '',
          uxResearchId: '',
          userId: '',
        },
      ]);
      expect(result[0].userId).toBe('');
      expect(result[0].uxResearchId).toBe('');
    });

    it('should handle mixed valid and empty values', async () => {
      const userUXResearches: UserUXResearch[] = [
        new UserUXResearch('ux-research-1', 'user-1', 'user-ux-research-1'),
        new UserUXResearch('', '', ''),
        new UserUXResearch('ux-research-2', 'user-2'),
      ];

      const mockSavedEntities: UserUXResearchEntity[] = [
        {
          id: 'user-ux-research-1',
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
        {
          id: '',
          uxResearchId: '',
          userId: '',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
        {
          id: 'generated-id-2',
          uxResearchId: 'ux-research-2',
          userId: 'user-2',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
      ];

      jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntities.map(entity => 
        new UserUXResearch(entity.uxResearchId, entity.userId, entity.id)
      ) as any);

      const result = await repository.createMany(userUXResearches);

      expect(repository.save).toHaveBeenCalledWith([
        {
          id: 'user-ux-research-1',
          uxResearchId: 'ux-research-1',
          userId: 'user-1',
        },
        {
          id: '',
          uxResearchId: '',
          userId: '',
        },
        {
          id: undefined,
          uxResearchId: 'ux-research-2',
          userId: 'user-2',
        },
      ]);
      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe('user-1');
      expect(result[1].userId).toBe('');
      expect(result[2].userId).toBe('user-2');
    });
  });
});