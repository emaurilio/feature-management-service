/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { SearchUXResearchUseCase } from 'src/modules/ux-research/application/use-cases/search-feature-flag.use-case';
import { SearchUXResearchDto } from 'src/modules/ux-research/application/dto/search-ux-research.dto';
import { AuditLogService } from 'src/modules/ux-research/application/services/log.service';
import { UXResearch } from 'src/modules/ux-research/domain/entites/UXResearch';
import { UXResearchType } from 'src/modules/ux-research/domain/enums/ux-research-type.enum';
import type { UXResearchRepositoryInterface } from 'src/modules/ux-research/domain/repositories/persistence/ux-research.repository.interface';

describe('SearchUXResearchUseCase', () => {
  let repository: jest.Mocked<UXResearchRepositoryInterface>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let useCase: SearchUXResearchUseCase;

  const userData = {
    userId: 'user-id',
    email: 'user@example.com',
    name: 'User One',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchUXResearchUseCase,
        {
          provide: AuditLogService,
          useValue: {
            dispatchLog: jest.fn(),
          },
        },
        {
          provide: 'UXResearchRepositoryInterface',
          useValue: {
            searchByNamePaginated: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get('UXResearchRepositoryInterface');
    auditLogService = module.get(AuditLogService);
    useCase = module.get(SearchUXResearchUseCase);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(auditLogService).toBeDefined();
    expect(useCase).toBeDefined();
  });

  it('should search UX research by name and return paginated results', async () => {
    const searchUXResearchDto: SearchUXResearchDto = {
      name: 'test',
      page: 1,
      userData,
    };

    const items = [
      new UXResearch(
        'test-1',
        'test',
        50,
        1,
        true,
        UXResearchType.PERCENTAGE,
        'feature-flag-1',
        undefined,
        undefined,
        'id-1',
      ),
      new UXResearch(
        'test-2',
        'test-2',
        20,
        1,
        true,
        UXResearchType.COMPANY,
        'feature-flag-2',
        undefined,
        undefined,
        'id-2',
      ),
    ];

    repository.searchByNamePaginated.mockResolvedValue({
      data: items,
      total: 2,
    });

    const result = await useCase.execute(searchUXResearchDto);

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
    expect(result.meta.itemsPerPage).toBe(15);
    expect(result.meta.totalPages).toBe(1);
    expect(result.items[0].name).toBe('test');
    expect(result.items[1].name).toBe('test-2');

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'search_ux_research',
        entity: 'UX-Research',
        data: expect.objectContaining({
          user: userData,
          name: 'test',
          result: {
            items,
            meta: { totalItems: 2 },
          },
        }),
      }),
    );
  });

  it('should return empty results when no UX research matches the search', async () => {
    const searchUXResearchDto: SearchUXResearchDto = {
      name: 'test',
      page: 1,
      userData,
    };

    repository.searchByNamePaginated.mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await useCase.execute(searchUXResearchDto);

    const [, page, take] = repository.searchByNamePaginated.mock.calls[0] as [
      string,
      number,
      number,
    ];

    expect(page).toBe(1);
    expect(take).toBe(15);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('should search UX research with custom page and limit', async () => {
    const searchUXResearchDto: SearchUXResearchDto = {
      name: 'test',
      page: 2,
      limit: 10,
      userData,
    };

    const items = [
      new UXResearch(
        'test-1',
        'test',
        50,
        1,
        true,
        UXResearchType.PERCENTAGE,
        undefined,
        undefined,
        undefined,
        'id-1',
      ),
    ];

    repository.searchByNamePaginated.mockResolvedValue({
      data: items,
      total: 16,
    });

    const result = await useCase.execute(searchUXResearchDto);

    const [name, page, take] = repository.searchByNamePaginated.mock.calls[0] as [
      string,
      number,
      number,
    ];

    expect(name).toBe('test');
    expect(page).toBe(2);
    expect(take).toBe(10);

    expect(result.meta.totalItems).toBe(16);
    expect(result.meta.currentPage).toBe(2);
    expect(result.meta.itemCount).toBe(1);
    expect(result.meta.itemsPerPage).toBe(10);
    expect(result.meta.totalPages).toBe(2);
    expect(result.items[0].name).toBe('test');
  });

  it('should dispatch audit log and rethrow when repository fails', async () => {
    const searchUXResearchDto: SearchUXResearchDto = {
      name: 'test',
      page: 1,
      userData,
    };

    repository.searchByNamePaginated.mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(useCase.execute(searchUXResearchDto)).rejects.toThrow(
      'database unavailable',
    );

    expect(auditLogService.dispatchLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'search_ux_research',
        entity: 'UX-Research',
        data: expect.objectContaining({
          user: userData,
          error: 'database unavailable',
        }),
      }),
    );
  });
});
