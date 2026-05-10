import { UserUXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/user-ux-research.repository';
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

  describe('deleteByUXResearchId', () => {
    it('should delete user UX researches successfully when records exist', async () => {
      const mockCount = 3;
      const mockSoftDeleteResult = { affected: 3 };

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId('ux-research-1');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-1' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-1' });
      expect(result).toBe(true);
    });

    it('should return true when no records exist to delete', async () => {
      const mockCount = 0;

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete');

      const result = await repository.deleteByUXResearchId('non-existent-ux-research');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'non-existent-ux-research' } });
      expect(repository.softDelete).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when soft delete affects fewer records than expected', async () => {
      const mockCount = 5;
      const mockSoftDeleteResult = { affected: 3 };

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId('ux-research-1');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-1' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-1' });
      expect(result).toBe(false);
    });

    it('should return false when soft delete affects no records but count > 0', async () => {
      const mockCount = 2;
      const mockSoftDeleteResult = { affected: 0 };

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId('ux-research-1');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-1' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-1' });
      expect(result).toBe(false);
    });

    it('should return true when soft delete affects exactly expected count', async () => {
      const mockCount = 1;
      const mockSoftDeleteResult = { affected: 1 };

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId('ux-research-1');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-1' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-1' });
      expect(result).toBe(true);
    });

    it('should handle database errors during count operation', async () => {
      const databaseError = new Error('Database connection failed during count');
      jest.spyOn(repository, 'count').mockRejectedValue(databaseError);
      jest.spyOn(repository, 'softDelete');

      await expect(repository.deleteByUXResearchId('ux-research-1')).rejects.toThrow('Database connection failed during count');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-1' } });
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should handle database errors during soft delete operation', async () => {
      const mockCount = 2;
      const databaseError = new Error('Database connection failed during soft delete');

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockRejectedValue(databaseError);

      await expect(repository.deleteByUXResearchId('ux-research-1')).rejects.toThrow('Database connection failed during soft delete');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-1' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-1' });
    });

    it('should handle soft delete result with undefined affected count', async () => {
      const mockCount = 2;
      const mockSoftDeleteResult = { affected: undefined };

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId('ux-research-1');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-1' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-1' });
      expect(result).toBe(false);
    });

    it('should work with empty UX research ID', async () => {
      const mockCount = 0;

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete');

      const result = await repository.deleteByUXResearchId('');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: '' } });
      expect(repository.softDelete).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should work with different UX research ID formats', async () => {
      const mockCount = 1;
      const mockSoftDeleteResult = { affected: 1 };
      const uxResearchId = 'uuid-12345-67890-abcdef';

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId(uxResearchId);

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId });
      expect(result).toBe(true);
    });

    it('should handle large number of records', async () => {
      const mockCount = 1000;
      const mockSoftDeleteResult = { affected: 1000 };

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId('ux-research-bulk');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-bulk' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-bulk' });
      expect(result).toBe(true);
    });

    it('should handle partial deletion scenario', async () => {
      const mockCount = 10;
      const mockSoftDeleteResult = { affected: 7 };

      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

      const result = await repository.deleteByUXResearchId('ux-research-partial');

      expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId: 'ux-research-partial' } });
      expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId: 'ux-research-partial' });
      expect(result).toBe(false);
    });
  });
});