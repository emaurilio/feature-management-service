/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagType } from 'src/feature-flag/domain/enums/feature-flag-type.enum';
import { FeatureFlagRepository } from 'src/feature-flag/infraestructure/persistence/repositories/feature-flag.repository';
import { FeatureFlagEntity } from 'src/feature-flag/infraestructure/persistence/entities/FeatureFlag.entity';
import { AuditLogService } from 'src/feature-flag/application/services/audit-log.service';
import { SearchFeatureFlagUseCase } from 'src/feature-flag/application/use-cases/search-feature-flag.use-case';
import { SearchFeatureFlagDto } from 'src/feature-flag/application/dto/search-feature-flag.dto';

describe('FeatureFlagRepository - searchByNamePaginated', () => {
  let repository: jest.Mocked<FeatureFlagRepository>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let useCase: SearchFeatureFlagUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchFeatureFlagUseCase,
        {
          provide: AuditLogService,
          useValue: {
            dispatchLog: jest.fn(),
          },
        },
        {
          provide: 'FeatureFlagRepositoryInterface',
          useValue: {
            searchByNamePaginated: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get('FeatureFlagRepositoryInterface');
    auditLogService = module.get(AuditLogService);
    useCase = module.get(SearchFeatureFlagUseCase);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(auditLogService).toBeDefined();
    expect(useCase).toBeDefined();
  });

  it('should search feature flags by name and return paginated results', async () => {
    const searchFeatureFlagDto: SearchFeatureFlagDto = {
      name: 'test',
      page: 1,
      userData: {
        userId: 'user-id',
        email: 'user@example.com',
        name: 'User One',
      },
    };

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

    repository.searchByNamePaginated.mockResolvedValue({
      data: entities,
      total: 2,
    });

    const result = await useCase.execute(searchFeatureFlagDto);

    const [name, page, take] = repository.searchByNamePaginated.mock.calls[0] as [
      string,
      number,
      number,
    ];

    expect(name).toBe('test');
    expect(page).toBe(1);
    expect(take).toBe(15);

    expect(result.meta.totalItems).toBe(2);
    expect(result.meta.currentPage).toBe(1);
    expect(result.meta.itemCount).toBe(2);
    expect(result.meta.totalPages).toBe(1);
    expect(result.items[0].name).toBe('test');
    expect(result.items[1].name).toBe('test-2');
  });

  it('should return empty results when no feature flags match the search', async () => {
    const searchFeatureFlagDto: SearchFeatureFlagDto = {
      name: 'test',
      page: 1,
      userData: {
        userId: 'user-id',
        email: 'user@example.com',
        name: 'User One',
      },
    };

    repository.searchByNamePaginated.mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await useCase.execute(searchFeatureFlagDto);

    const [name, page, take] = repository.searchByNamePaginated.mock.calls[0] as [
      string,
      number,
      number,
    ];

    expect(take).toBe(15);
    expect(page).toBe(1);

    expect(result.meta.totalItems).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('should search feature flags by name and return paginated results - page 2', async () => {
    const searchFeatureFlagDto: SearchFeatureFlagDto = {
      name: 'test',
      page: 2,
      userData: {
        userId: 'user-id',
        email: 'user@example.com',
        name: 'User One',
      },
    };

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

    repository.searchByNamePaginated.mockResolvedValue({
      data: entity,
      total: 16,
    });

    const result = await useCase.execute(searchFeatureFlagDto);

    const [name, page, take] = repository.searchByNamePaginated.mock.calls[0] as [
      string,
      number,
      number,
    ];

    expect(name).toBe('test');
    expect(page).toBe(2);
    expect(take).toBe(15);

    expect(result.meta.totalItems).toBe(16);
    expect(result.meta.currentPage).toBe(2);
    expect(result.meta.itemCount).toBe(1);
    expect(result.meta.totalPages).toBe(2);
    expect(result.items[0].name).toBe('test');
  });
});
