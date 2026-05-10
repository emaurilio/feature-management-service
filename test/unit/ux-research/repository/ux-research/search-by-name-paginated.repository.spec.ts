/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Like } from 'typeorm';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research.mapper';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('UXResearchRepository - searchByNamePaginated', () => {
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

  it('should return paginated UX research results when found', async () => {
    const name = 'test';
    const page = 1;
    const limit = 10;

    const mockEntities = [
      {
        id: '1',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
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
      },
      {
        id: '2',
        nameVersion: 'test-v2',
        name: 'Another Test Research',
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
      },
    ] as unknown as UXResearchEntity[];

    const mockDomainObjects = [
      new UXResearch(
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
      ),
      new UXResearch(
        'test-v2',
        'Another Test Research',
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
      ),
    ];

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 25]);
    jest.spyOn(UXResearchMapper, 'toDomain')
      .mockReturnValueOnce(mockDomainObjects[0])
      .mockReturnValueOnce(mockDomainObjects[1]);

    const result = await repository.searchByNamePaginated(name, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: Like(`%${name}%`) },
      take: limit,
      skip: 0,
      order: { name: 'ASC' },
    });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      data: mockDomainObjects,
      total: 25,
    });
  });

  it('should return empty result when no UX research found', async () => {
    jest.clearAllMocks();
    
    const name = 'non-existent';
    const page = 1;
    const limit = 10;

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);
    jest.spyOn(UXResearchMapper, 'toDomain');

    const result = await repository.searchByNamePaginated(name, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: Like(`%${name}%`) },
      take: limit,
      skip: 0,
      order: { name: 'ASC' },
    });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
      total: 0,
    });
  });

  it('should handle pagination correctly for different pages', async () => {
    const name = 'test';
    const page = 2;
    const limit = 5;

    const mockEntities = [
      {
        id: '3',
        nameVersion: 'test-v3',
        name: 'Third Test Research',
        featureFlagName: 'feature-3',
        featureFlag: null,
        enable: true,
        percentage: 75,
        version: 3,
        isActive: true,
        type: 'user',
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ] as unknown as UXResearchEntity[];

    const mockDomainObject = new UXResearch(
      'test-v3',
      'Third Test Research',
      75,
      3,
      true,
      'user' as UXResearchType,
      'feature-3',
      new Date(),
      new Date(),
      '3',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 12]);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.searchByNamePaginated(name, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: Like(`%${name}%`) },
      take: limit,
      skip: 5,
      order: { name: 'ASC' },
    });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntities[0]);
    expect(result).toEqual({
      data: [mockDomainObject],
      total: 12,
    });
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const name = 'test';
    const page = 1;
    const limit = 10;
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'findAndCount').mockRejectedValue(error);

    await expect(repository.searchByNamePaginated(name, page, limit))
      .rejects.toThrow('Database connection failed');

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: Like(`%${name}%`) },
      take: limit,
      skip: 0,
      order: { name: 'ASC' },
    });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should work with different limit values', async () => {
    const name = 'test';
    const page = 1;
    const limit = 20;

    const mockEntities = [
      {
        id: '1',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
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
      },
    ] as unknown as UXResearchEntity[];

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

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 1]);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.searchByNamePaginated(name, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: Like(`%${name}%`) },
      take: limit,
      skip: 0,
      order: { name: 'ASC' },
    });
    expect(result).toEqual({
      data: [mockDomainObject],
      total: 1,
    });
  });

  it('should work with empty search name', async () => {
    const name = '';
    const page = 1;
    const limit = 10;

    const mockEntities = [
      {
        id: '1',
        nameVersion: 'test-v1',
        name: 'Test UX Research',
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
      },
    ] as unknown as UXResearchEntity[];

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

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 1]);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.searchByNamePaginated(name, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: Like(`%%`) },
      take: limit,
      skip: 0,
      order: { name: 'ASC' },
    });
    expect(result).toEqual({
      data: [mockDomainObject],
      total: 1,
    });
  });

  it('should maintain alphabetical order by name', async () => {
    const name = 'test';
    const page = 1;
    const limit = 10;

    const mockEntities = [
      {
        id: '2',
        nameVersion: 'test-v2',
        name: 'B Test Research',
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
      },
      {
        id: '1',
        nameVersion: 'test-v1',
        name: 'A Test Research',
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
      },
    ] as unknown as UXResearchEntity[];

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 2]);

    const result = await repository.searchByNamePaginated(name, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: Like(`%${name}%`) },
      take: limit,
      skip: 0,
      order: { name: 'ASC' },
    });
  });
});