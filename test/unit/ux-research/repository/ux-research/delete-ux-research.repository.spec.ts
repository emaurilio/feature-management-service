/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';

describe('UXResearchRepository - deleteUXResearch', () => {
  let repository: UXResearchRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UXResearchRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<UXResearchRepository>(
      UXResearchRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should delete UX research successfully', async () => {
    const id = 'ux-research-1';
    const mockSoftDeleteResult = { affected: 1, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

    const result = await repository.deleteUXResearch(id);

    expect(repository.softDelete).toHaveBeenCalledWith(id);
    expect(result).toBe(true);
  });

  it('should return false when no record was deleted', async () => {
    const id = 'non-existent-id';
    const mockSoftDeleteResult = { affected: 0, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

    const result = await repository.deleteUXResearch(id);

    expect(repository.softDelete).toHaveBeenCalledWith(id);
    expect(result).toBe(false);
  });

  it('should handle softDelete returning undefined affected', async () => {
    const id = 'ux-research-1';
    const mockSoftDeleteResult = { affected: undefined, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

    const result = await repository.deleteUXResearch(id);

    expect(repository.softDelete).toHaveBeenCalledWith(id);
    expect(result).toBe(false);
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const id = 'ux-research-1';
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'softDelete').mockRejectedValue(error);

    await expect(repository.deleteUXResearch(id))
      .rejects.toThrow('Database connection failed');

    expect(repository.softDelete).toHaveBeenCalledWith(id);
  });

  it('should work with different ID formats', async () => {
    const id = 'uuid-12345-67890-abcdef';
    const mockSoftDeleteResult = { affected: 1, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

    const result = await repository.deleteUXResearch(id);

    expect(repository.softDelete).toHaveBeenCalledWith(id);
    expect(result).toBe(true);
  });

  it('should handle empty string ID', async () => {
    const id = '';
    const mockSoftDeleteResult = { affected: 0, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

    const result = await repository.deleteUXResearch(id);

    expect(repository.softDelete).toHaveBeenCalledWith('');
    expect(result).toBe(false);
  });

  it('should handle null ID', async () => {
    const id = null as any;
    const mockSoftDeleteResult = { affected: 0, generatedMaps: [], raw: {} };

    jest.spyOn(repository, 'softDelete').mockResolvedValue(mockSoftDeleteResult as any);

    const result = await repository.deleteUXResearch(id);

    expect(repository.softDelete).toHaveBeenCalledWith(null);
    expect(result).toBe(false);
  });
});