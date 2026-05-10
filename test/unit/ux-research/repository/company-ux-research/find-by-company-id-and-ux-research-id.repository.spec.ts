/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CompanyUXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/company-ux-research.repository';
import { CompanyUXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/company-ux-research.entity';
import { CompanyUXResearch } from 'src/modules/ux-research/domain/entites/CompanyUXResearch';
import { CompanyUXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/company-ux-research.mapper';

describe('CompanyUXResearchRepository - findByCompanyIdAndUXResearchId', () => {
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

  it('should return company UX research when found', async () => {
    const companyId = 'company-1';
    const uxResearchId = 'ux-research-1';
    const mockEntity = {
      id: '1',
      companyId,
      uxResearchId,
      uxResearch: {
        id: uxResearchId,
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

    const mockDomainObject = new CompanyUXResearch(companyId, uxResearchId, '1');

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
    jest.spyOn(CompanyUXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.findByCompanyIdAndUXResearchId(companyId, uxResearchId);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { companyId, uxResearchId },
    });
    expect(CompanyUXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should return null when company UX research not found', async () => {
    jest.clearAllMocks();
    
    const companyId = 'company-1';
    const uxResearchId = 'ux-research-1';

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    jest.spyOn(CompanyUXResearchMapper, 'toDomain');

    const result = await repository.findByCompanyIdAndUXResearchId(companyId, uxResearchId);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { companyId, uxResearchId },
    });
    expect(result).toBeNull();
    expect(CompanyUXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const companyId = 'company-1';
    const uxResearchId = 'ux-research-1';
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'findOne').mockRejectedValue(error);

    await expect(repository.findByCompanyIdAndUXResearchId(companyId, uxResearchId))
      .rejects.toThrow('Database connection failed');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { companyId, uxResearchId },
    });
    expect(CompanyUXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should work with different company and ux research combinations', async () => {
    const companyId = 'company-2';
    const uxResearchId = 'ux-research-3';
    const mockEntity = {
      id: '3',
      companyId,
      uxResearchId,
      uxResearch: {
        id: uxResearchId,
        name: 'Different UX Research',
        nameVersion: 'different-v1',
        percentage: 75,
        version: 3,
        isActive: false,
        type: 'feature-flag',
        featureFlagName: 'different-feature',
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

    const mockDomainObject = new CompanyUXResearch(companyId, uxResearchId, '3');

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
    jest.spyOn(CompanyUXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.findByCompanyIdAndUXResearchId(companyId, uxResearchId);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { companyId, uxResearchId },
    });
    expect(CompanyUXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntity);
    expect(result).toEqual(mockDomainObject);
  });
});