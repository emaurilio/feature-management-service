/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UXResearchResponseRepository } from 'src/modules/ux-research/infraestructure/persistence/repositories/ux-research-response.repository';
import { UXResearchResponseEntity } from 'src/modules/ux-research/infraestructure/persistence/entities/ux-research-response.entity';
import { UXResearchResponse } from 'src/modules/ux-research/domain/entites/UXResearchResponse';
import { UXResearchResponseMapper } from 'src/modules/ux-research/infraestructure/persistence/mappers/ux-research-response.mapper';

describe('UXResearchResponseRepository - getByUXResearchIdPaginated', () => {
  let repository: UXResearchResponseRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UXResearchResponseRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    repository = module.get<UXResearchResponseRepository>(
      UXResearchResponseRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should return paginated UX research responses when found', async () => {
    const uxResearchId = 'ux-research-1';
    const page = 1;
    const limit = 10;

    const mockEntities = [
      {
        id: '1',
        uxResearchId,
        userId: 'user-1',
        companyId: 'company-1',
        response: 'response-data-1',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      },
      {
        id: '2',
        uxResearchId,
        userId: 'user-2',
        companyId: 'company-2',
        response: 'response-data-2',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      },
    ] as unknown as UXResearchResponseEntity[];

    const mockDomainObjects = [
      new UXResearchResponse('response-data-1', new Date(), uxResearchId, 'user-1', 'company-1', '1'),
      new UXResearchResponse('response-data-2', new Date(), uxResearchId, 'user-2', 'company-2', '2'),
    ];

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 25]);
    jest.spyOn(UXResearchResponseMapper, 'toDomain')
      .mockReturnValueOnce(mockDomainObjects[0])
      .mockReturnValueOnce(mockDomainObjects[1]);

    const result = await repository.getByUXResearchIdPaginated(uxResearchId, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { uxResearchId },
      skip: 0,
      take: limit,
    });
    expect(UXResearchResponseMapper.toDomain).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      items: mockDomainObjects,
      meta: {
        totalItems: 25,
        itemCount: 2,
        itemsPerPage: limit,
        totalPages: 3,
        currentPage: page,
      },
    });
  });

  it('should return null when no responses found', async () => {
    jest.clearAllMocks();
    
    const uxResearchId = 'ux-research-1';
    const page = 1;
    const limit = 10;

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);
    jest.spyOn(UXResearchResponseMapper, 'toDomain');

    const result = await repository.getByUXResearchIdPaginated(uxResearchId, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { uxResearchId },
      skip: 0,
      take: limit,
    });
    expect(UXResearchResponseMapper.toDomain).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should use default pagination values when page and limit are not provided', async () => {
    jest.clearAllMocks();
    
    const uxResearchId = 'ux-research-1';

    const mockEntities = [
      {
        id: '1',
        uxResearchId,
        userId: 'user-1',
        companyId: 'company-1',
        response: 'response-data-1',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      },
    ] as unknown as UXResearchResponseEntity[];

    const mockDomainObject = new UXResearchResponse('response-data-1', new Date(), uxResearchId, 'user-1', 'company-1', '1');

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 1]);
    jest.spyOn(UXResearchResponseMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.getByUXResearchIdPaginated(uxResearchId);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { uxResearchId },
      skip: 0,
      take: 15,
    });
    expect(result).toEqual({
      items: [mockDomainObject],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 15,
        totalPages: 1,
        currentPage: 1,
      },
    });
  });

  it('should handle pagination correctly for different pages', async () => {
    const uxResearchId = 'ux-research-1';
    const page = 2;
    const limit = 5;

    const mockEntities = [
      {
        id: '6',
        uxResearchId,
        userId: 'user-6',
        companyId: 'company-6',
        response: 'response-data-6',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      },
    ] as unknown as UXResearchResponseEntity[];

    const mockDomainObject = new UXResearchResponse('response-data-6', new Date(), uxResearchId, 'user-6', 'company-6', '6');

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 12]);
    jest.spyOn(UXResearchResponseMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.getByUXResearchIdPaginated(uxResearchId, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { uxResearchId },
      skip: 5,
      take: limit,
    });
    expect(UXResearchResponseMapper.toDomain).toHaveBeenCalledWith(mockEntities[0]);
    expect(result).toEqual({
      items: [mockDomainObject],
      meta: {
        totalItems: 12,
        itemCount: 1,
        itemsPerPage: limit,
        totalPages: 3,
        currentPage: page,
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    jest.clearAllMocks();
    
    const uxResearchId = 'ux-research-1';
    const page = 1;
    const limit = 10;
    const error = new Error('Database connection failed');

    jest.spyOn(repository, 'findAndCount').mockRejectedValue(error);
    jest.spyOn(UXResearchResponseMapper, 'toDomain');

    await expect(repository.getByUXResearchIdPaginated(uxResearchId, page, limit))
      .rejects.toThrow('Database connection failed');

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { uxResearchId },
      skip: 0,
      take: limit,
    });
    expect(UXResearchResponseMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should work with different limit values', async () => {
    jest.clearAllMocks();
    
    const uxResearchId = 'ux-research-1';
    const page = 1;
    const limit = 20;

    const mockEntities = [
      {
        id: '1',
        uxResearchId,
        userId: 'user-1',
        companyId: 'company-1',
        response: 'response-data-1',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      },
    ] as unknown as UXResearchResponseEntity[];

    const mockDomainObject = new UXResearchResponse('response-data-1', new Date(), uxResearchId, 'user-1', 'company-1', '1');

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 1]);
    jest.spyOn(UXResearchResponseMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.getByUXResearchIdPaginated(uxResearchId, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { uxResearchId },
      skip: 0,
      take: limit,
    });
    expect(result).toEqual({
      items: [mockDomainObject],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: limit,
        totalPages: 1,
        currentPage: page,
      },
    });
  });

  it('should handle null userId and companyId correctly', async () => {
    const uxResearchId = 'ux-research-1';
    const page = 1;
    const limit = 10;

    const mockEntities = [
      {
        id: '1',
        uxResearchId,
        userId: undefined,
        companyId: undefined,
        response: 'anonymous-response',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      },
    ] as unknown as UXResearchResponseEntity[];

    const mockDomainObject = new UXResearchResponse('anonymous-response', new Date(), uxResearchId, undefined, undefined, '1');

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 1]);
    jest.spyOn(UXResearchResponseMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.getByUXResearchIdPaginated(uxResearchId, page, limit);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { uxResearchId },
      skip: 0,
      take: limit,
    });
    expect(result).toEqual({
      items: [mockDomainObject],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: limit,
        totalPages: 1,
        currentPage: page,
      },
    });
  });

  it('should calculate totalPages correctly when totalItems is exactly divisible by itemsPerPage', async () => {
    const uxResearchId = 'ux-research-1';
    const page = 1;
    const limit = 10;

    const mockEntities = [
      {
        id: '1',
        uxResearchId,
        userId: 'user-1',
        companyId: 'company-1',
        response: 'response-data-1',
        responseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      },
    ] as unknown as UXResearchResponseEntity[];

    const mockDomainObject = new UXResearchResponse('response-data-1', new Date(), uxResearchId, 'user-1', 'company-1', '1');

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockEntities, 20]);
    jest.spyOn(UXResearchResponseMapper, 'toDomain').mockReturnValue(mockDomainObject);

    const result = await repository.getByUXResearchIdPaginated(uxResearchId, page, limit);

    expect(result).toEqual({
      items: [mockDomainObject],
      meta: {
        totalItems: 20,
        itemCount: 1,
        itemsPerPage: limit,
        totalPages: 2,
        currentPage: page,
      },
    });
  });
});