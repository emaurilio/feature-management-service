/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UXResearchRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research.repository';
import { UXResearchEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research.entity';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research.mapper';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';

describe('UXResearchRepository - getByFeatureFlagName', () => {
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

  it('should return UX research when found by feature flag name', async () => {
    const featureFlagName = 'test-feature-flag';
    const mockEntity = {
      id: '1',
      nameVersion: 'test-v1',
      name: 'Test UX Research',
      featureFlagName,
      featureFlag: null,
      enable: true,
      percentage: 100,
      version: 1,
      isActive: true,
      type: 'feature-flag',
      startDate: new Date(),
      endDate: new Date(),
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
      'feature-flag' as UXResearchType,
      featureFlagName,
      new Date(),
      new Date(),
      '1',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.getByFeatureFlagName(featureFlagName);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { featureFlagName },
    });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should return null when UX research not found by feature flag name', async () => {
    jest.clearAllMocks();
    
    const featureFlagName = 'non-existent-feature';

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    jest.spyOn(UXResearchMapper, 'toDomain');

    const result = await repository.getByFeatureFlagName(featureFlagName);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { featureFlagName },
    });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const featureFlagName = 'test-feature';
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'findOne').mockRejectedValue(error);

    await expect(repository.getByFeatureFlagName(featureFlagName))
      .rejects.toThrow('Database connection failed');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { featureFlagName },
    });
    expect(UXResearchMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should work with different feature flag names', async () => {
    const featureFlagName = 'different-feature';
    const mockEntity = {
      id: '2',
      nameVersion: 'different-v1',
      name: 'Different UX Research',
      featureFlagName,
      featureFlag: null,
      enable: false,
      percentage: 50,
      version: 2,
      isActive: false,
      type: 'feature-flag',
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as UXResearchEntity;

    const mockDomainObject = new UXResearch(
      'different-v1',
      'Different UX Research',
      50,
      2,
      false,
      'feature-flag' as UXResearchType,
      featureFlagName,
      new Date(),
      new Date(),
      '2',
      new Date(),
      new Date(),
      undefined,
    );

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
    jest.spyOn(UXResearchMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.getByFeatureFlagName(featureFlagName);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { featureFlagName },
    });
    expect(UXResearchMapper.toDomain).toHaveBeenCalledWith(mockEntity);
    expect(result).toEqual(mockDomainObject);
  });

  it('should handle empty feature flag name', async () => {
    const featureFlagName = '';

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await repository.getByFeatureFlagName(featureFlagName);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { featureFlagName: '' },
    });
    expect(result).toBeNull();
  });

  it('should handle null feature flag name', async () => {
    const featureFlagName = null as any;

    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    const result = await repository.getByFeatureFlagName(featureFlagName);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { featureFlagName: null },
    });
    expect(result).toBeNull();
  });
});