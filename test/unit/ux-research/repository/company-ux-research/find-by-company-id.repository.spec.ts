/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyUXResearchRepository } from 'src/ux-research/infraestructure/persistence/repositories/company-ux-research.repository';
import { CompanyUXResearchEntity } from 'src/ux-research/infraestructure/persistence/entities/company-ux-research.entity';
import { CompanyUXResearch } from 'src/ux-research/domain/entites/CompanyUXResearch';
import { CompanyUXResearchMapper } from 'src/ux-research/infraestructure/persistence/mappers/company-ux-research.mapper';

describe('CompanyUXResearchRepository - findByCompanyId', () => {
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

  it('should return company UX researches when found', async () => {
    const companyId = 'company-1';
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

    const mockDomainObjects = [
      new CompanyUXResearch(companyId, 'ux-research-1', '1'),
      new CompanyUXResearch(companyId, 'ux-research-2', '2'),
    ];

    jest.spyOn(repository, 'find').mockResolvedValue(mockEntities);
    jest.spyOn(CompanyUXResearchMapper, 'toDomain')
      .mockReturnValueOnce(mockDomainObjects[0])
      .mockReturnValueOnce(mockDomainObjects[1]);

    const result = await repository.findByCompanyId(companyId);

    expect(repository.find).toHaveBeenCalledWith({ where: { companyId } });
    expect(CompanyUXResearchMapper.toDomain).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockDomainObjects);
  });

  it('should return null when no company UX researches found', async () => {
    const companyId = 'company-1';

    jest.spyOn(repository, 'find').mockResolvedValue([]);

    const result = await repository.findByCompanyId(companyId);

    expect(repository.find).toHaveBeenCalledWith({ where: { companyId } });
    expect(result).toBeNull();
  });

  it('should handle empty array result correctly', async () => {
    jest.clearAllMocks();
    
    const companyId = 'company-1';

    jest.spyOn(repository, 'find').mockResolvedValue([]);
    jest.spyOn(CompanyUXResearchMapper, 'toDomain');

    const result = await repository.findByCompanyId(companyId);

    expect(repository.find).toHaveBeenCalledWith({ where: { companyId } });
    expect(result).toBeNull();
    expect(CompanyUXResearchMapper.toDomain).not.toHaveBeenCalled();
  });
});
