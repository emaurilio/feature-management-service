/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyUXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/company-ux-research.repository';

describe('CompanyUXResearchRepository - deleteByUXResearchId', () => {
  let repository: CompanyUXResearchRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyUXResearchRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<CompanyUXResearchRepository>(
      CompanyUXResearchRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should return true when no records exist for uxResearchId', async () => {
    jest.clearAllMocks();
    
    const uxResearchId = 'ux-research-1';

    jest.spyOn(repository, 'count').mockResolvedValue(0);
    jest.spyOn(repository, 'softDelete');

    const result = await repository.deleteByUXResearchId(uxResearchId);

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(result).toBe(true);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should return true when all records are successfully deleted', async () => {
    const uxResearchId = 'ux-research-1';
    const expectedCount = 3;
    const mockSoftDeleteResult = { affected: 3, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);
    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult);

    const result = await repository.deleteByUXResearchId(uxResearchId);

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId });
    expect(result).toBe(true);
  });

  it('should return false when not all records are deleted', async () => {
    const uxResearchId = 'ux-research-1';
    const expectedCount = 3;
    const mockSoftDeleteResult = { affected: 2, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);
    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult);

    const result = await repository.deleteByUXResearchId(uxResearchId);

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId });
    expect(result).toBe(false);
  });

  it('should return false when softDelete returns affected as null', async () => {
    const uxResearchId = 'ux-research-1';
    const expectedCount = 2;
    const mockSoftDeleteResult = { affected: undefined, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);
    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult);

    const result = await repository.deleteByUXResearchId(uxResearchId);

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId });
    expect(result).toBe(false);
  });

  it('should return false when softDelete returns affected as 0', async () => {
    const uxResearchId = 'ux-research-1';
    const expectedCount = 2;
    const mockSoftDeleteResult = { affected: 0, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);
    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult);

    const result = await repository.deleteByUXResearchId(uxResearchId);

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId });
    expect(result).toBe(false);
  });

  it('should handle database errors in count operation', async () => {
    jest.clearAllMocks();
    
    const uxResearchId = 'ux-research-1';
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'count').mockRejectedValue(error);
    jest.spyOn(repository, 'softDelete');

    await expect(repository.deleteByUXResearchId(uxResearchId))
      .rejects.toThrow('Database connection failed');

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('should handle database errors in softDelete operation', async () => {
    const uxResearchId = 'ux-research-1';
    const expectedCount = 1;
    const error = new Error('Soft delete failed');

    jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);
    jest.spyOn(repository, 'softDelete').mockRejectedValue(error);

    await expect(repository.deleteByUXResearchId(uxResearchId))
      .rejects.toThrow('Soft delete failed');

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId });
  });

  it('should work with different uxResearchId values', async () => {
    const uxResearchId = 'different-ux-research-123';
    const expectedCount = 5;
    const mockSoftDeleteResult = { affected: 5, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);
    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult);

    const result = await repository.deleteByUXResearchId(uxResearchId);

    expect(repository.count).toHaveBeenCalledWith({ where: { uxResearchId } });
    expect(repository.softDelete).toHaveBeenCalledWith({ uxResearchId });
    expect(result).toBe(true);
  });
});