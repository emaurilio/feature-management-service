import { UserUXResearchRepository } from 'src/ux-research/infraestructure/persistence/repositories/user-ux-research.repository';
import { UserUXResearchEntity } from 'src/ux-research/infraestructure/persistence/entities/user-ux-resarch.entity';
import { UserUXResearch } from 'src/ux-research/domain/entites/UserUXResearch';
import { DataSource } from 'typeorm';

describe('UserUXResearchRepository', () => {
  let repository: UserUXResearchRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    dataSource = {
      createEntityManager: jest.fn(),
    } as any;

    repository = new UserUXResearchRepository(dataSource);
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return user UX researches when found', async () => {
      const mockEntities: UserUXResearchEntity[] = [
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
          userId: 'user-1',
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-04'),
          deletedAt: undefined,
        } as unknown as UserUXResearchEntity,
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockEntities.map(entity => 
        new UserUXResearch(entity.uxResearchId, entity.userId, entity.id)
      ) as any);

      const result = await repository.findByUserId('user-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserUXResearch);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].uxResearchId).toBe('ux-research-1');
    });

    it('should return null when no user UX researches found', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await repository.findByUserId('non-existent-user');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: 'non-existent-user',
        },
      });
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const databaseError = new Error('Database connection failed');
      jest.spyOn(repository, 'find').mockRejectedValue(databaseError);

      await expect(repository.findByUserId('user-1')).rejects.toThrow('Database connection failed');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
      });
    });

    it('should work with empty user ID', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await repository.findByUserId('');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: '',
        },
      });
      expect(result).toEqual([]);
    });

    it('should work with different user ID formats', async () => {
      const mockEntity: UserUXResearchEntity = {
        id: 'user-ux-research-3',
        uxResearchId: 'ux-research-3',
        userId: 'uuid-12345-67890-abcdef',
        createdAt: new Date('2023-01-05'),
        updatedAt: new Date('2023-01-06'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      jest.spyOn(repository, 'find').mockResolvedValue([
        new UserUXResearch(mockEntity.uxResearchId, mockEntity.userId, mockEntity.id)
      ] as any);

      const result = await repository.findByUserId('uuid-12345-67890-abcdef');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId: 'uuid-12345-67890-abcdef',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('uuid-12345-67890-abcdef');
    });
  });
});