/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research.mapper';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('UXResearchRepository - findByName', () => {
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

  it('should return UX research when found by name', async () => {
    const name = 'Test UX Research';
    const mockEntity = {
      id: '1',
      nameVersion: 'test-v1',
      name,
      featureFlagName: 'feature-1',
      featureFlag: null,
      enable: true,
      percentage: 100,
      version: 1,
      isActive: true,
      type: 'percentage',
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'test-v1',
      name,
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

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.findByName(name);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name },
      withDeleted: false,
    });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should return null when UX research not found by name', async () => {
    jest.clearAllMocks();
    
    const name = 'Non-existent Research';

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    jest.spyOn(UXResearchMapper, 'toDomain');

    const result = await repository.findByName(name);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name },
      withDeleted: false,
    });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const name = 'Test Research';
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'findOne').mockRejectedValue(error);

    await expect(repository.findByName(name))
      .rejects.toThrow('Database connection failed');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name },
      withDeleted: false,
    });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should work with withDeleted parameter set to true', async () => {
    const name = 'Test UX Research';
    const mockEntity = {
      id: '1',
      nameVersion: 'test-v1',
      name,
      featureFlagName: 'feature-1',
      featureFlag: null,
      enable: true,
      percentage: 100,
      version: 1,
      isActive: true,
      type: 'percentage',
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(), // Soft deleted
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'test-v1',
      name,
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
      new Date(),
    );

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.findByName(name, true);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name },
      withDeleted: true,
    });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should work with different UX research types', async () => {
    const name = 'Company Research';
    const mockEntity = {
      id: '2',
      nameVersion: 'company-v1',
      name,
      featureFlagName: 'feature-2',
      featureFlag: null,
      enable: false,
      percentage: 50,
      version: 2,
      isActive: false,
      type: 'company',
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'company-v1',
      name,
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

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.findByName(name);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name },
      withDeleted: false,
    });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should handle empty name', async () => {
    const name = '';

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await repository.findByName(name);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name: '' },
      withDeleted: false,
    });
    expect(result).toBeNull();
  });

  it('should handle null name', async () => {
    const name = null as any;

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await repository.findByName(name);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { name: null },
      withDeleted: false,
    });
    expect(result).toBeNull();
  });
});