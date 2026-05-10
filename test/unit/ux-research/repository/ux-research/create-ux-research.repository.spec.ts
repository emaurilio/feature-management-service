/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research.mapper';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('UXResearchRepository - createUXResearch', () => {
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

  it('should create UX research successfully', async () => {
    const uxResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'percentage' as UXResearchType,
      'feature-1',
      new Date(),
      new Date(),
    );

    const mockPersistenceEntity = {
      nameVersion: 'test-v1',
      name: 'Test UX Research',
      percentage: 100,
      version: 1,
      isActive: true,
      type: 'percentage',
      featureFlagName: 'feature-1',
      startDate: new Date(),
      endDate: new Date(),
    };

    const mockSavedEntity = {
      id: '1',
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
      '1',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(UXResearchMapper, 'toPersistence').mockReturnValue(mockPersistenceEntity as any);
    jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.createUXResearch(uxResearch);

    expect(UXResearchMapper.toPersistence).toHaveBeenCalledWith(uxResearch);
    expect(repository.save).toHaveBeenCalledWith(mockPersistenceEntity);
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockSavedEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const uxResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'percentage' as UXResearchType,
      'feature-1',
      new Date(),
      new Date(),
    );

    const mockPersistenceEntity = {
      nameVersion: 'test-v1',
      name: 'Test UX Research',
      percentage: 100,
      version: 1,
      isActive: true,
      type: 'percentage',
      featureFlagName: 'feature-1',
      startDate: new Date(),
      endDate: new Date(),
    };

    const error = new Error('Database connection failed');

    jest.spyOn(UXResearchMapper, 'toPersistence').mockReturnValue(mockPersistenceEntity as any);
    jest.spyOn(repository, 'save').mockRejectedValue(error);
    jest.spyOn(UXResearchMapper, 'toDomain');

    await expect(repository.createUXResearch(uxResearch))
      .rejects.toThrow('Database connection failed');

    expect(UXResearchMapper.toPersistence).toHaveBeenCalledWith(uxResearch);
    expect(repository.save).toHaveBeenCalledWith(mockPersistenceEntity);
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should work with different UX research types', async () => {
    jest.clearAllMocks();
    
    const uxResearch = new UXResearch(
      'company-v1',
      'Company UX Research',
      50,
      2,
      false,
      'company' as UXResearchType,
      'feature-2',
      new Date(),
      new Date(),
    );

    const mockPersistenceEntity = {
      nameVersion: 'company-v1',
      name: 'Company UX Research',
      percentage: 50,
      version: 2,
      isActive: false,
      type: 'company',
      featureFlagName: 'feature-2',
      startDate: new Date(),
      endDate: new Date(),
    };

    const mockSavedEntity = {
      id: '2',
      nameVersion: 'company-v1',
      name: 'Company UX Research',
      percentage: 50,
      version: 2,
      isActive: false,
      type: 'company',
      featureFlagName: 'feature-2',
      startDate: new Date(),
      endDate: new Date(),
      featureFlag: null,
      enable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'company-v1',
      'Company UX Research',
      50,
      2,
      false,
      'company' as UXResearchType,
      'feature-2',
      new Date(),
      new Date(),
      '2',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(UXResearchMapper, 'toPersistence').mockReturnValue(mockPersistenceEntity as any);
    jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.createUXResearch(uxResearch);

    expect(UXResearchMapper.toPersistence).toHaveBeenCalledWith(uxResearch);
    expect(repository.save).toHaveBeenCalledWith(mockPersistenceEntity);
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockSavedEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should work with optional fields', async () => {
    const uxResearch = new UXResearch(
      'minimal-v1',
      'Minimal UX Research',
      75,
      3,
      true,
      'user' as UXResearchType,
    );

    const mockPersistenceEntity = {
      nameVersion: 'minimal-v1',
      name: 'Minimal UX Research',
      percentage: 75,
      version: 3,
      isActive: true,
      type: 'user',
      featureFlagName: undefined,
      startDate: undefined,
      endDate: undefined,
    };

    const mockSavedEntity = {
      id: '3',
      nameVersion: 'minimal-v1',
      name: 'Minimal UX Research',
      percentage: 75,
      version: 3,
      isActive: true,
      type: 'user',
      featureFlagName: null,
      startDate: null,
      endDate: null,
      featureFlag: null,
      enable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'minimal-v1',
      'Minimal UX Research',
      75,
      3,
      true,
      'user' as UXResearchType,
      undefined,
      undefined,
      undefined,
      '3',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(UXResearchMapper, 'toPersistence').mockReturnValue(mockPersistenceEntity as any);
    jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.createUXResearch(uxResearch);

    expect(UXResearchMapper.toPersistence).toHaveBeenCalledWith(uxResearch);
    expect(repository.save).toHaveBeenCalledWith(mockPersistenceEntity);
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockSavedEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should handle mapper errors gracefully', async () => {
    jest.clearAllMocks();
    
    const uxResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'percentage' as UXResearchType,
      'feature-1',
      new Date(),
      new Date(),
    );

    const error = new Error('Mapper error');

    jest.spyOn(UXResearchMapper, 'toPersistence').mockImplementation(() => {
      throw error;
    });
    jest.spyOn(repository, 'save');
    jest.spyOn(UXResearchMapper, 'toDomain');

    await expect(repository.createUXResearch(uxResearch))
      .rejects.toThrow('Mapper error');

    expect(UXResearchMapper.toPersistence).toHaveBeenCalledWith(uxResearch);
    expect(repository.save).not.toHaveBeenCalled();
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should handle toDomain mapper errors gracefully', async () => {
    jest.clearAllMocks();
    
    const uxResearch = new UXResearch(
      'test-v1',
      'Test UX Research',
      100,
      1,
      true,
      'percentage' as UXResearchType,
      'feature-1',
      new Date(),
      new Date(),
    );

    const mockPersistenceEntity = {
      nameVersion: 'test-v1',
      name: 'Test UX Research',
      percentage: 100,
      version: 1,
      isActive: true,
      type: 'percentage',
      featureFlagName: 'feature-1',
      startDate: new Date(),
      endDate: new Date(),
    };

    const mockSavedEntity = {
      id: '1',
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

    const error = new Error('ToDomain mapper error');

    jest.spyOn(UXResearchMapper, 'toPersistence').mockReturnValue(mockPersistenceEntity as any);
    jest.spyOn(repository, 'save').mockResolvedValue(mockSavedEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockImplementation(() => {
      throw error;
    });

    await expect(repository.createUXResearch(uxResearch))
      .rejects.toThrow('ToDomain mapper error');

    expect(UXResearchMapper.toPersistence).toHaveBeenCalledWith(uxResearch);
    expect(repository.save).toHaveBeenCalledWith(mockPersistenceEntity);
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockSavedEntity);
  });
});