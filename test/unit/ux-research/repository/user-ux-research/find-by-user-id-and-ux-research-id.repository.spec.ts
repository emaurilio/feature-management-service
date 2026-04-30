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

  describe('findByUserIdAndUXResearchId', () => {
    it('should return user UX research when found', async () => {
      const mockEntity: UserUXResearchEntity = {
        id: 'user-ux-research-1',
        uxResearchId: 'ux-research-1',
        userId: 'user-1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      jest.spyOn(repository, 'findOne').mockResolvedValue(
        new UserUXResearch(mockEntity.uxResearchId, mockEntity.userId, mockEntity.id) as any
      );

      const result = await repository.findByUserIdAndUXResearchId('user-1', 'ux-research-1');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: 'user-1', uxResearchId: 'ux-research-1' } 
      });
      expect(result).toBeInstanceOf(UserUXResearch);
      expect(result?.userId).toBe('user-1');
      expect(result?.uxResearchId).toBe('ux-research-1');
      expect(result?.id).toBe('user-ux-research-1');
    });

    it('should return null when user UX research not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByUserIdAndUXResearchId('non-existent-user', 'non-existent-ux-research');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: 'non-existent-user', uxResearchId: 'non-existent-ux-research' } 
      });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const databaseError = new Error('Database connection failed');
      jest.spyOn(repository, 'findOne').mockRejectedValue(databaseError);

      await expect(repository.findByUserIdAndUXResearchId('user-1', 'ux-research-1'))
        .rejects.toThrow('Database connection failed');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: 'user-1', uxResearchId: 'ux-research-1' } 
      });
    });

    it('should work with empty user ID', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByUserIdAndUXResearchId('', 'ux-research-1');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: '', uxResearchId: 'ux-research-1' } 
      });
      expect(result).toBeNull();
    });

    it('should work with empty UX research ID', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByUserIdAndUXResearchId('user-1', '');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: 'user-1', uxResearchId: '' } 
      });
      expect(result).toBeNull();
    });

    it('should work with both empty IDs', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByUserIdAndUXResearchId('', '');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: '', uxResearchId: '' } 
      });
      expect(result).toBeNull();
    });

    it('should work with different ID formats', async () => {
      const mockEntity: UserUXResearchEntity = {
        id: 'uuid-54321-09876-fedcba',
        uxResearchId: 'uuid-12345-67890-abcdef',
        userId: 'user-uuid-123',
        createdAt: new Date('2023-01-05'),
        updatedAt: new Date('2023-01-06'),
        deletedAt: undefined,
      } as unknown as UserUXResearchEntity;

      jest.spyOn(repository, 'findOne').mockResolvedValue(
        new UserUXResearch(mockEntity.uxResearchId, mockEntity.userId, mockEntity.id)
      );

      const result = await repository.findByUserIdAndUXResearchId('user-uuid-123', 'uuid-12345-67890-abcdef');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: 'user-uuid-123', uxResearchId: 'uuid-12345-67890-abcdef' } 
      });
      expect(result?.userId).toBe('user-uuid-123');
      expect(result?.uxResearchId).toBe('uuid-12345-67890-abcdef');
      expect(result?.id).toBe('uuid-54321-09876-fedcba');
    });

    it('should handle case when only user exists but UX research does not', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByUserIdAndUXResearchId('user-1', 'non-existent-ux-research');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: 'user-1', uxResearchId: 'non-existent-ux-research' } 
      });
      expect(result).toBeNull();
    });

    it('should handle case when only UX research exists but user does not', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await repository.findByUserIdAndUXResearchId('non-existent-user', 'ux-research-1');

      expect(repository.findOne).toHaveBeenCalledWith({ 
        where: { userId: 'non-existent-user', uxResearchId: 'ux-research-1' } 
      });
      expect(result).toBeNull();
    });
  });
});