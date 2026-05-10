/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research.mapper';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('UXResearchRepository - updateUXResearch', () => {
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

  it('should update UX research successfully', async () => {
    const id = '1';
    const partialEntity = {
      name: 'Updated UX Research',
      percentage: 75,
      isActive: false,
    };

    const mockUpdatedEntity = {
      id: '1',
      nameVersion: 'test-v1',
      name: 'Updated UX Research',
      percentage: 75,
      version: 1,
      isActive: false,
      type: 'percentage',
      featureFlagName: 'feature-1',
      startDate: new Date(),
      endDate: new Date(),
      featureFlag: null,
      enable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'test-v1',
      'Updated UX Research',
      75,
      1,
      false,
      'percentage' as UXResearchType,
      'feature-1',
      new Date(),
      new Date(),
      '1',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockUpdatedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.updateUXResearch(id, partialEntity);

    expect(repository.update).toHaveBeenCalledWith(id, partialEntity);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockUpdatedEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should throw error when UX research not found after update', async () => {
    jest.clearAllMocks();
    
    const id = 'non-existent-id';
    const partialEntity = {
      name: 'Updated UX Research',
    };

    jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    jest.spyOn(UXResearchMapper, 'toDomain');

    await expect(repository.updateUXResearch(id, partialEntity))
      .rejects.toThrow('UX Research not found after update');

    expect(repository.update).toHaveBeenCalledWith(id, partialEntity);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const id = '1';
    const partialEntity = {
      name: 'Updated UX Research',
    };
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'update').mockRejectedValue(error);
    jest.spyOn(repository, 'findOne');
    jest.spyOn(UXResearchMapper, 'toDomain');

    await expect(repository.updateUXResearch(id, partialEntity))
      .rejects.toThrow('Database connection failed');

    expect(repository.update).toHaveBeenCalledWith(id, partialEntity);
    expect(repository.findOne).not.toHaveBeenCalled();
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should work with different partial updates', async () => {
    const id = '2';
    const partialEntity = {
      nameVersion: 'updated-v2',
      type: 'company' as UXResearchType,
      featureFlagName: 'new-feature',
    };

    const mockUpdatedEntity = {
      id: '2',
      nameVersion: 'updated-v2',
      name: 'Test UX Research',
      percentage: 100,
      version: 1,
      isActive: true,
      type: 'company',
      featureFlagName: 'new-feature',
      startDate: new Date(),
      endDate: new Date(),
      featureFlag: null,
      enable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'updated-v2',
      'Test UX Research',
      100,
      1,
      true,
      'company' as UXResearchType,
      'new-feature',
      new Date(),
      new Date(),
      '2',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockUpdatedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.updateUXResearch(id, partialEntity);

    expect(repository.update).toHaveBeenCalledWith(id, partialEntity);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockUpdatedEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should handle empty partial update', async () => {
    const id = '3';
    const partialEntity = {};

    const mockUpdatedEntity = {
      id: '3',
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
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'percentage' as UXResearchType,
      'feature-1',
      new Date(),
      new Date(),
      '3',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockUpdatedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.updateUXResearch(id, partialEntity);

    expect(repository.update).toHaveBeenCalledWith(id, {});
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockUpdatedEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should handle findOne errors gracefully', async () => {
    jest.clearAllMocks();
    
    const id = '1';
    const partialEntity = {
      name: 'Updated UX Research',
    };
    const error = new Error('FindOne error');

    jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
    jest.spyOn(repository, 'findOne').mockRejectedValue(error);

    await expect(repository.updateUXResearch(id, partialEntity))
      .rejects.toThrow('FindOne error');

    expect(repository.update).toHaveBeenCalledWith(id, partialEntity);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should handle toDomain mapper errors gracefully', async () => {
    jest.clearAllMocks();
    
    const id = '1';
    const partialEntity = {
      name: 'Updated UX Research',
    };

    const mockUpdatedEntity = {
      id: '1',
      nameVersion: 'test-v1',
      name: 'Updated UX Research',
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
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const error = new Error('ToDomain mapper error');

    jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockUpdatedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockImplementation(() => {
      throw error;
    });

    await expect(repository.updateUXResearch(id, partialEntity))
      .rejects.toThrow('ToDomain mapper error');

    expect(repository.update).toHaveBeenCalledWith(id, partialEntity);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockUpdatedEntity);
  });
});