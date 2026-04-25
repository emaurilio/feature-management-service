/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';

describe('FeatureFlagRepository - searchByNamePaginated', () => {
  let repository: FeatureFlagRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<FeatureFlagRepository>(FeatureFlagRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should search feature flags by name and return paginated results', async () => {
    const entities = [
      Object.assign(new FeatureFlagEntity(), {
        id: 'id-1',
        nameVersion: 'test-1',
        name: 'test',
        percentage: 50,
        version: 1,
        isActive: true,
        type: FeatureFlagType.COMPANY,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      Object.assign(new FeatureFlagEntity(), {
        id: 'id-2',
        nameVersion: 'test-2',
        name: 'test-2',
        percentage: 20,
        version: 1,
        isActive: true,
        type: FeatureFlagType.COMPANY,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    const findAndCountSpy = jest
      .spyOn(repository, 'findAndCount')
      .mockResolvedValue([entities, 2] as any);

    const result = await repository.searchByNamePaginated('test', 1, 2);

    expect(findAndCountSpy).toHaveBeenCalledTimes(1);

    const [options] = findAndCountSpy.mock.calls[0] as [any];

    expect(options?.take).toBe(2);
    expect(options?.skip).toBe(0);
    expect(options?.order).toEqual({ name: 'ASC' });
    expect(options?.where?.name).toHaveProperty('_value', '%test%');

    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('test');
    expect(result.data[1].name).toBe('test-2');
  });

  it('should return empty results when no feature flags match the search', async () => {
    const findAndCountSpy = jest
      .spyOn(repository, 'findAndCount')
      .mockResolvedValue([[], 0] as any);

    const result = await repository.searchByNamePaginated('missing', 1, 5);

    expect(findAndCountSpy).toHaveBeenCalledTimes(1);

    const [options] = findAndCountSpy.mock.calls[0] as [any];
    expect(options?.take).toBe(5);
    expect(options?.skip).toBe(0);
    expect(options?.order).toEqual({ name: 'ASC' });
    expect(options?.where?.name).toHaveProperty('_value', '%missing%');

    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('should search feature flags by name and return paginated results - page 2', async () => {
    const entity = [
      Object.assign(new FeatureFlagEntity(), {
        id: 'id-1',
        nameVersion: 'test-1',
        name: 'test',
        percentage: 50,
        version: 1,
        isActive: true,
        type: FeatureFlagType.COMPANY,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    const findAndCountSpy = jest
      .spyOn(repository, 'findAndCount')
      .mockResolvedValue([entity, 1] as any);

    const result = await repository.searchByNamePaginated('test', 2, 1);

    expect(findAndCountSpy).toHaveBeenCalledTimes(1);

    const [options] = findAndCountSpy.mock.calls[0] as [any];

    expect(options?.take).toBe(1);
    expect(options?.skip).toBe(1);
    expect(options?.order).toEqual({ name: 'ASC' });
    expect(options?.where?.name).toHaveProperty('_value', '%test%');

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('test');
  });
});
