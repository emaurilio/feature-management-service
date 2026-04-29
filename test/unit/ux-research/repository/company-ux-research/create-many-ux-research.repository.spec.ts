/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyUXResearchRepository } from 'src/ux-research/infraestructure/persistence/repositories/company-ux-research.repository';
import { CompanyUXResearchEntity } from 'src/ux-research/infraestructure/persistence/entities/company-ux-research.entity';
import { CompanyUXResearch } from 'src/ux-research/domain/entites/CompanyUXResearch';
import { CompanyUXResearchMapper } from 'src/ux-research/infraestructure/persistence/mappers/company-ux-research.mapper';

describe('CompanyUXResearchRepository - createMany', () => {
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

  it('should create multiple company UX researches', async () => {
    const companyId = 'company-1';
    const domainCompanyUXResearches = [
      new CompanyUXResearch(companyId, 'ux-research-1'),
      new CompanyUXResearch(companyId, 'ux-research-2'),
    ];

    const mockEntities = [
      {
        id: '1',
        companyId,
        uxResearchId: 'ux-research-1',
        uxResearch: {
          id: 'ux-research-1',
          name: 'Test UX Research 1',
          nameVersion: 'test-v1',
          percentage: 100,
          version: 1,
          isActive: true,
          type: 'feature-flag',
          featureFlagName: 'test-feature',
          featureFlag: null,
          enable: true,
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '2',
        companyId,
        uxResearchId: 'ux-research-2',
        uxResearch: {
          id: 'ux-research-2',
          name: 'Test UX Research 2',
          nameVersion: 'test-v2',
          percentage: 50,
          version: 2,
          isActive: false,
          type: 'feature-flag',
          featureFlagName: 'test-feature-2',
          featureFlag: null,
          enable: true,
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ] as unknown as CompanyUXResearchEntity[];

    const mockPersistenceEntities = [
      {
        companyId,
        uxResearchId: 'ux-research-1',
      },
      {
        companyId,
        uxResearchId: 'ux-research-2',
      },
    ];

    jest.spyOn(CompanyUXResearchMapper, 'toPersistence')
      .mockReturnValueOnce(mockPersistenceEntities[0])
      .mockReturnValueOnce(mockPersistenceEntities[1]);
    
    jest.spyOn(repository, 'save').mockResolvedValue(mockEntities as any);

    const result = await repository.createMany(domainCompanyUXResearches);

    expect(CompanyUXResearchMapper.toPersistence).toHaveBeenCalledTimes(2);
    expect(CompanyUXResearchMapper.toPersistence).toHaveBeenCalledWith(domainCompanyUXResearches[0]);
    expect(CompanyUXResearchMapper.toPersistence).toHaveBeenCalledWith(domainCompanyUXResearches[1]);
    expect(repository.save).toHaveBeenCalledWith(mockPersistenceEntities);
    expect(result).toEqual(mockEntities);
  });

  it('should handle empty array correctly', async () => {
    jest.clearAllMocks();
    
    const domainCompanyUXResearches: CompanyUXResearch[] = [];

    jest.spyOn(CompanyUXResearchMapper, 'toPersistence');
    jest.spyOn(repository, 'save').mockResolvedValue([] as any);

    const result = await repository.createMany(domainCompanyUXResearches);

    expect(CompanyUXResearchMapper.toPersistence).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith([]);
    expect(result).toEqual([]);
  });

  it('should handle save errors gracefully', async () => {
    jest.clearAllMocks();
    
    const companyId = 'company-1';
    const domainCompanyUXResearches = [
      new CompanyUXResearch(companyId, 'ux-research-1'),
    ];

    const error = new Error('Database error');
    jest.spyOn(CompanyUXResearchMapper, 'toPersistence').mockReturnValue({
      companyId,
      uxResearchId: 'ux-research-1',
    });
    jest.spyOn(repository, 'save').mockRejectedValue(error);

    await expect(repository.createMany(domainCompanyUXResearches))
      .rejects.toThrow('Database error');

    expect(CompanyUXResearchMapper.toPersistence).toHaveBeenCalledWith(domainCompanyUXResearches[0]);
    expect(repository.save).toHaveBeenCalledWith([{
      companyId,
      uxResearchId: 'ux-research-1',
    }]);
  });

  it('should handle single item array', async () => {
    const companyId = 'company-1';
    const domainCompanyUXResearches = [
      new CompanyUXResearch(companyId, 'ux-research-1', 'custom-id'),
    ];

    const mockEntity = {
      id: 'custom-id',
      companyId,
      uxResearchId: 'ux-research-1',
      uxResearch: {
        id: 'ux-research-1',
        name: 'Test UX Research',
        nameVersion: 'test-v1',
        percentage: 100,
        version: 1,
        isActive: true,
        type: 'feature-flag',
        featureFlagName: 'test-feature',
        featureFlag: null,
        enable: true,
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as CompanyUXResearchEntity;

    const mockPersistenceEntity = {
      companyId,
      uxResearchId: 'ux-research-1',
    };

    jest.spyOn(CompanyUXResearchMapper, 'toPersistence').mockReturnValue(mockPersistenceEntity);
    jest.spyOn(repository, 'save').mockResolvedValue([mockEntity] as any);

    const result = await repository.createMany(domainCompanyUXResearches);

    expect(CompanyUXResearchMapper.toPersistence).toHaveBeenCalledWith(domainCompanyUXResearches[0]);
    expect(repository.save).toHaveBeenCalledWith([mockPersistenceEntity]);
    expect(result).toEqual([mockEntity]);
  });
});